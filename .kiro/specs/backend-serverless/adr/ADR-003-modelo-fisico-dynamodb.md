# ADR-003 — Modelo físico DynamoDB

- **Estado:** aceptado para el MVP
- **Fecha:** 2026-07-23
- **Owner:** Francis
- **Requisitos:** backend-serverless R2 y R4; autenticacion-consentimiento-parental R1, R3, R4, R5 y R6
- **Diagrama:** [`docs/diagramas/modelo-fisico-dynamodb.mmd`](../../../../docs/diagramas/modelo-fisico-dynamodb.mmd)

## Contexto

El backend debe persistir cuenta adulta mínima, consentimientos, perfiles
infantiles, progreso, retos emitidos, intentos e idempotencia. Las rutas de
usuario no pueden usar `Scan`, toda operación infantil debe comprobar ownership
desde el access token adulto y los datos efímeros deben admitir TTL.

El flujo crítico de respuesta modifica reto, intento, progreso e idempotencia de
forma atómica. También necesitamos exportar y borrar una cuenta o perfil
consultando particiones conocidas, sin crear índices secundarios antes de
demostrar su necesidad.

## Decisión

Se usarán dos tablas DynamoDB provisionadas por ambiente:

1. `ptk-domain-{environment}` para cuenta, consentimiento, perfiles y juego.
2. `ptk-idempotency-{environment}` para resultados temporales de mutaciones
   idempotentes, agrupados por adulto y alcance.

Ambas tablas usan clave compuesta `PK` + `SK`, cifrado en reposo y TTL mediante
`expiresAt` cuando corresponde. No se crea ningún GSI ni LSI en el modelo
inicial.

La separación no pretende construir un single-table design avanzado. Agrupa los
items que deben consultarse juntos y aísla la capacidad y retención de la
idempotencia. `TransactWriteItems` puede incluir ambas tablas porque se despliegan
en la misma cuenta y región.

## Identificadores y tipos comunes

- `parentRef`: referencia interna estable calculada como
  `base64url(HMAC-SHA256(secretKey[keyVersion], cognitoSub))`. No es
  anonimización ni reemplaza la autorización.
- `keyVersion`: identifica qué secreto HMAC usar; no es el material secreto.
- La clave HMAC reside en Secrets Manager, accesible únicamente por `api-core`.
  Una rotación requiere lectura dual y migración controlada antes de retirar la
  versión anterior.
- `childId`, `challengeId`, `attemptId`, `eventId` y `requestId`: identificadores
  aleatorios opacos, sin PII.
- Fechas de dominio: texto UTC RFC 3339, por ejemplo
  `2026-07-23T15:22:00Z`.
- `validUntil`: expiración lógica RFC 3339 evaluada por el backend.
- `expiresAt`: entero epoch en segundos usado exclusivamente por DynamoDB TTL.
- `revision`: entero monotónico para control de concurrencia optimista.
- Todos los items incluyen `entityType` para validación. Este campo nunca
  sustituye la autorización por claves y condiciones.

El backend obtiene `cognitoSub` exclusivamente del access token validado. Nunca
acepta `parentRef` ni un identificador adulto desde el body o la URL.

## Tabla de dominio

```text
Nombre: ptk-domain-{environment}
Partition key: PK (String)
Sort key: SK (String)
TTL: expiresAt (Number, opcional)
Billing: PROVISIONED
GSI/LSI iniciales: ninguno
```

### Partición adulta

```text
PK = PARENT#{parentRef}
```

| SK | `entityType` | Propósito |
|---|---|---|
| `ACCOUNT` | `ParentAccount` | Estado mínimo y constancia del age gate |
| `CONSENT#{purpose}` | `Consent` | Decisión vigente por finalidad |
| `CONSENT_EVENT#{purpose}#{decidedAt}#{eventId}` | `ConsentEvent` | Historial inmutable de decisiones |
| `PROFILE#{childId}` | `ChildProfile` | Perfil infantil y prueba de ownership |
| `CHALLENGE#{challengeId}` | `ChallengeLocator` | Puntero temporal hacia la partición infantil |
| `DELETION#{scope}#{requestId}` | `DeletionJob` | Estado reanudable del borrado |

#### `ParentAccount`

```text
status: active | deleting
ageGateRuleVersion
ageGatePassedAt
profileCount
revision
createdAt
updatedAt
```

No contiene fecha de nacimiento, email, token, contraseña ni datos del niño. El
email permanece en Cognito. La fecha usada por el age gate se procesa en memoria
y se descarta.

Toda mutación normal incluye una condición sobre `ParentAccount.status = active`.
El borrado de cuenta cambia primero ese estado a `deleting`, bloqueando perfiles,
consentimientos, retos e intentos nuevos.

#### `Consent`

```text
purpose: core | serverSideAi | productAnalytics
state: granted | denied | revoked
policyVersion
method
decidedAt
revokedAt?
revision
```

Cada modificación actualiza el item vigente y crea un `ConsentEvent` inmutable
en la misma transacción. Una decisión solo es vigente cuando su versión coincide
con la política activa. Las finalidades opcionales comienzan en `denied`.

#### `ChildProfile`

```text
childId
aliasId
avatarId
ageBand: 8-10 | 11-13
status: active | deleting
revision
createdAt
updatedAt
```

No se persisten nombre real, fecha de nacimiento, correo, teléfono, foto, voz,
ubicación ni credenciales infantiles. El ownership se representa mediante la
ubicación del perfil bajo la PK adulta; no se duplica `ownerParentSub`.

#### `ChallengeLocator`

```text
childId
challengeSk
createdAt
validUntil
expiresAt
```

Permite resolver `POST /v1/retos/{challengeId}/intentos` con un `GetItem` bajo la
partición del adulto autenticado. No duplica contenido ni calificación. Se
conserva durante la garantía de idempotencia aunque el reto ya no admita una
respuesta nueva.

Para borrar un perfil, todos sus localizadores se descubren con:

```text
Query PK=PARENT#{parentRef}
  AND begins_with(SK, CHALLENGE#)
  FilterExpression childId = :childId
```

Es una `Query` acotada a una sola cuenta, no un `Scan`. Esto también encuentra
localizadores cuyo `Challenge` haya sido eliminado antes por TTL.

#### `DeletionJob`

```text
scope: profile | account
childId?
state: inProgress | externalCleanup | failed
cursor?
startedAt
updatedAt
revision
```

El cursor permite reanudar borrados por páginas. Un job activo no usa TTL: no
puede desaparecer antes de completar el borrado. Al finalizar se elimina en la
misma etapa que sus registros de idempotencia. Los jobs atascados producen una
alarma y permanecen disponibles para reanudación. La auditoría final usa una
métrica sin IDs ni datos borrados.

### Partición infantil

```text
PK = CHILD#{childId}
```

| SK | `entityType` | Propósito |
|---|---|---|
| `PROGRESS#MAIN` | `Progress` | Resumen autoritativo actual |
| `CHALLENGE#{challengeId}` | `Challenge` | Reto emitido y estado |
| `ATTEMPT#{answeredAt}#{attemptId}` | `Attempt` | Intento ordenado cronológicamente |

Antes de acceder a esta partición, el caso de uso comprueba en la misma
transacción o mediante lectura consistente que la cuenta y el perfil están
activos:

```text
PK = PARENT#{parentRef}, SK = ACCOUNT, status = active
PK = PARENT#{parentRef}, SK = PROFILE#{childId}, status = active
```

Un perfil ausente y uno ajeno producen el mismo `PROFILE_NOT_FOUND`.

#### `Progress`

```text
score
streak
totalAttempts
correctAttempts
currentDifficulty
recentResults[]
recentScenarioIds[]
recentMessageKinds[]
revision
createdAt
updatedAt
```

Los enums y reglas de puntaje se fijan en las tareas de dominio. Las colecciones
recientes son ventanas acotadas, no historiales. Su tamaño se configura junto
con la estrategia de adaptación y nunca crece sin límite.

#### `Challenge`

```text
challengeId
scenarioId
scenarioVersion
source: curated
appType
difficulty
messageKind: trap | legitimate
payloadSnapshot
grading
status: issued | answered | expired
issuedAt
answeredAt?
validUntil
expiresAt
revision
```

`payloadSnapshot` congela la versión curada mostrada. `grading` contiene la
decisión correcta, códigos de señales y feedback; nunca se incluye al entregar
el reto. El backend acepta un intento nuevo solo si `status = issued` y
`validUntil > now`. TTL usa `expiresAt` y puede limpiar el item después.

El modelo inicial solo persiste retos `curated`. No guarda prompt, respuesta
cruda, chat ni salida de Bedrock. Persistir un artefacto generado y sanitizado
requiere una decisión posterior sobre R6 antes de habilitar esa fuente.

#### `Attempt`

```text
attemptId
challengeId
scenarioId
appType
difficulty
decision: trap | legitimate
isCorrect
pointsAwarded
feedbackCode
responseTimeBucket
answeredAt
expiresAt
```

Solo admite decisiones cerradas, códigos y rangos. No admite texto libre, chat,
PII, payload del request ni contenido escrito por el niño.

## Tabla de idempotencia

```text
Nombre: ptk-idempotency-{environment}
Partition key: PK (String)
Sort key: SK (String)
TTL: expiresAt (Number, opcional)
Billing: PROVISIONED
GSI/LSI: ninguno
```

Los registros se agrupan por adulto para poder eliminarlos sin `Scan`:

```text
PK = PARENT#{parentRef}
SK = SCOPE#{scopeKey}#IDEMP#{operation}#{digest}

digest = base64url(HMAC-SHA256(
  secretKey[keyVersion], operation | idempotencyKey
))

scopeKey = ACCOUNT
         | CHILD#{childId}
```

Las mutaciones de cuenta y consentimiento usan `ACCOUNT`. Intentos y borrado de
perfil usan `CHILD#{childId}`. Para un intento, el backend obtiene primero
`childId` desde `ChallengeLocator` y después hace el `GetItem` idempotente.

Campos:

```text
entityType: IdempotencyRecord
operation
childId?
requestHash
state: inProgress | completed
responseStatus?
responseSnapshot?
createdAt
updatedAt
expiresAt?
```

`requestHash` se calcula sobre la representación canónica del request permitido.
`responseSnapshot` contiene solo la respuesta cerrada necesaria para repetir el
resultado; nunca cuerpos arbitrarios, tokens ni texto libre.

Flujo de lectura:

1. Hacer `GetItem` consistente por PK+SK.
2. Si existe, está `completed` y `requestHash` coincide, devolver el snapshot.
3. Si existe, está `inProgress` y coincide, devolver el estado de la operación.
4. Si existe y no coincide, responder `IDEMPOTENCY_CONFLICT`.
5. Si no existe, ejecutar la mutación transaccional.
6. Si una ejecución concurrente gana la condición, releer y aplicar las reglas
   anteriores.

La garantía de repetición para intentos y consentimiento es de siete días. Los
registros de borrado no expiran mientras el workflow esté activo y se eliminan
al terminar, junto con los datos de su alcance.

## Access patterns

| Operación | Lectura/escritura física | Consistencia |
|---|---|---|
| obtener cuenta adulta | `GetItem(PARENT#ref, ACCOUNT)` | consistente |
| obtener consentimiento actual | `GetItem(PARENT#ref, CONSENT#purpose)` | consistente cuando autoriza una finalidad |
| listar historial de consentimiento | `Query PK=PARENT#ref AND begins_with(SK, CONSENT_EVENT#purpose#)` | consistente cuando sea necesario |
| listar perfiles | `Query PK=PARENT#ref AND begins_with(SK, PROFILE#)` | consistente tras una mutación |
| comprobar ownership | `GetItem(PARENT#ref, PROFILE#childId)` | consistente |
| obtener progreso | `GetItem(CHILD#childId, PROGRESS#MAIN)` | consistente para calificar |
| emitir reto | `TransactWrite` de `Challenge` + `ChallengeLocator` con condiciones de cuenta/perfil/consentimiento | atómica |
| localizar reto | `GetItem(PARENT#ref, CHALLENGE#challengeId)` | consistente |
| leer reto | `GetItem(CHILD#childId, CHALLENGE#challengeId)` | consistente |
| listar intentos recientes | `Query PK=CHILD#childId AND begins_with(SK, ATTEMPT#)`, descendente y con límite | consistente solo si el caso lo exige |
| repetir mutación | `GetItem(PARENT#ref, SCOPE#...#IDEMP#...)` | consistente |
| limpiar idempotencia infantil | `Query PK=PARENT#ref AND begins_with(SK, SCOPE#CHILD#childId#IDEMP#)` | consistente |
| limpiar idempotencia adulta | `Query PK=PARENT#ref` | consistente |
| limpiar localizadores infantiles | `Query PARENT#ref` por prefijo `CHALLENGE#` y filtro `childId` | consistente |
| borrar perfil | `Query CHILD#childId` y queries de limpieza anteriores, por páginas | workflow idempotente |
| borrar cuenta | `Query PARENT#ref`; después `Query` de cada partición infantil e idempotencia | workflow idempotente |
| exportar cuenta | `Query PARENT#ref`; después `Query CHILD#childId` por cada perfil | paginada y autenticada |

No se usa `Scan`. Un access pattern nuevo que no pueda resolverse por clave debe
actualizar este ADR y justificar un índice, costo, IAM y estrategia de borrado.

## Emisión de reto

La emisión usa una transacción corta:

1. `ConditionCheck` de cuenta activa.
2. `ConditionCheck` de perfil activo bajo la PK adulta.
3. `ConditionCheck` del consentimiento `core` vigente.
4. `Put` de `Challenge` con `attribute_not_exists(PK)`.
5. `Put` de `ChallengeLocator` con `attribute_not_exists(PK)`.

El cliente recibe `challengeId`, contenido visible y `validUntil`; nunca recibe
`grading`, decisión correcta ni explicación previa.

## Transacción de intento

Una nueva respuesta usa `TransactWriteItems` sobre ambas tablas:

1. `ConditionCheck` de cuenta activa.
2. `ConditionCheck` de perfil activo y propiedad del adulto.
3. `ConditionCheck` del consentimiento `core` vigente.
4. `Update` del reto condicionado a `status = issued`, `validUntil > now` y
   `revision` esperada; cambia a `answered`.
5. `Put` del intento con `attribute_not_exists(PK)`.
6. `Update` del progreso condicionado por `revision`.
7. `Put` del registro de idempotencia con `attribute_not_exists(PK)`.

El caso de uso calcula score y respuesta desde reto y progreso leídos de forma
consistente. Si falla cualquier condición, no se aplica ninguna escritura. Un
reto expirado o respondido no admite otro intento calificable.

Las mutaciones de consentimiento comprueban cuenta activa y usan la misma
transacción para idempotencia, estado vigente y evento inmutable.

## TTL, retención y backups

TTL se habilita con `expiresAt`. Como la eliminación física es asíncrona, el
backend siempre aplica expiración lógica con `validUntil` o la regla del caso de
uso.

Política inicial:

| Tipo de dato | Retención |
|---|---|
| cuenta y perfil | hasta completar su borrado |
| consentimiento vigente y eventos | hasta borrar la cuenta |
| progreso resumido | hasta borrar el perfil |
| validez de reto nuevo | 30 minutos mediante `validUntil` |
| reto y localizador | 7 días mediante `expiresAt`, para reintentos seguros |
| intento detallado | 30 días mediante `expiresAt`; luego permanece solo el resumen |
| idempotencia de intento y consentimiento | 7 días mediante `expiresAt` |
| `DeletionJob` e idempotencia de borrado | sin TTL mientras están activos; eliminación explícita al completar |
| artefactos de IA | no se persisten |

Las duraciones son variables tipadas en Terraform, pero sus valores por defecto
son iguales en `dev` y `prod` hasta una revisión documentada. Reducirlas no puede
romper el contrato de idempotencia.

Backups:

- `dev`: PITR deshabilitado; los datos son descartables y se prueban borrados.
- `prod`: PITR con ventana de 7 días, sujeto a revisión legal previa. Un restore
  se hace en una tabla aislada, con acceso restringido y un nuevo ciclo de
  borrado antes de cualquier reconexión.
- No se crean backups manuales sin política de expiración y owner.

## Exportación

El adulto autenticado puede exportar sus datos sin un GSI:

1. Derivar `parentRef` desde el access token.
2. Consultar la partición adulta para cuenta, consentimientos y perfiles.
3. Consultar por páginas cada `CHILD#{childId}` descubierto.
4. Excluir `grading`, idempotencia, jobs internos, secretos y cualquier dato de
   otro adulto.
5. Entregar un archivo con cursor opaco o generación asincrónica controlada si
   supera el límite HTTP.

La exportación contiene datos visibles del perfil, progreso resumido e intentos
mínimos aún retenidos. Toda página vuelve a comprobar cuenta activa y ownership.
No se registra el contenido exportado.

## Borrado

### Inicio transaccional de perfil

Una sola `TransactWriteItems`:

1. `ConditionCheck` de cuenta activa.
2. `Update` del perfil de `active` a `deleting`, condicionado por revisión.
3. `Put` de `DeletionJob` con `requestId` estable.
4. `Put` de idempotencia `inProgress` con la misma clave y `requestId`.

Así una caída no deja un perfil bloqueado sin job reanudable.

### Limpieza de perfil

1. Consultar `CHILD#{childId}` por páginas y eliminar sus items en lotes.
2. Consultar y eliminar todos los `ChallengeLocator` del niño desde la partición
   adulta, aunque el challenge ya no exista.
3. Consultar la idempotencia con prefijo
   `SCOPE#CHILD#{childId}#IDEMP#` y eliminar todos los registros excepto la clave
   idempotente del borrado en curso.
4. Ejecutar limpieza externa aprobada cuando corresponda.
5. Finalizar con una sola `TransactWriteItems` que:
   - actualiza `ParentAccount.profileCount` si la cuenta sigue activa y conserva
     la revisión esperada;
   - elimina el `ChildProfile` condicionado a `status = deleting`;
   - elimina el `DeletionJob` del request actual;
   - elimina la clave idempotente activa del mismo request.
6. Emitir una métrica sin identidad ni payload.

La clave activa nunca se elimina durante los lotes anteriores. Un retry posterior
que encuentra el perfil ausente devuelve éxito idempotente sin recrear un
registro con datos eliminados.

### Inicio y limpieza de cuenta

El inicio usa una transacción que cambia `ParentAccount.status` de `active` a
`deleting`, crea `DeletionJob` e idempotencia `inProgress`. Desde ese momento
toda mutación normal falla por condición.

El worker:

1. Consulta la partición adulta y captura la lista de perfiles.
2. Limpia cada partición infantil y sistema externo permitido.
3. Repite la `Query` adulta para recoger elementos creados antes del bloqueo.
4. Elimina perfiles, localizadores, consentimientos, eventos y cualquier job
   subordinado, preservando `ParentAccount`, el `DeletionJob` de cuenta y su
   clave idempotente activa.
5. Consulta la partición adulta de idempotencia y elimina todos los registros
   excepto la clave del borrado de cuenta en curso.
6. Elimina la cuenta Cognito. Hasta que Cognito confirme, `ParentAccount` sigue
   en `deleting` y el job permanece reanudable.
7. Después de confirmar Cognito, finaliza con una sola `TransactWriteItems` que
   elimina `ParentAccount`, el `DeletionJob` y la clave idempotente activa.
8. Emite una métrica sin identidad.

Si Cognito o la transacción final fallan, el worker conserva estado durable y
puede reintentar. El worker recibe la clave determinista del job; nunca descubre
trabajo mediante `Scan`.

Objetivo operativo inicial: comenzar inmediatamente y completar dentro de 24
horas. Un job sin progreso genera una alarma y no expira. El mecanismo de
consentimiento y el SLA definitivo requieren revisión legal antes de producción.

El identificador analítico y su borrado se definen en ADR-004. No se crea un
item de Mixpanel hasta que ese ADR establezca finalidad, retención y revocación.

## Capacidad y costo

Valores iniciales para `dev`:

| Tabla | RCU | WCU |
|---|---:|---:|
| dominio | 5 | 5 |
| idempotencia | 2 | 2 |
| **total** | **7** | **7** |

No se habilita autoscaling ni GSI hasta medir tráfico, throttling y consumo de
transacciones. Producción requiere estimación y alarmas propias. Estos valores
no prometen costo cero; dependen de la cuenta y el modelo comercial vigente.

## IAM y límites de confianza

- `api-core` obtiene solo acciones necesarias sobre las dos tablas:
  `GetItem`, `Query`, `PutItem`, `UpdateItem`, `DeleteItem`, `BatchWriteItem` y
  `TransactWriteItems` según el caso de uso.
- La política no concede `dynamodb:Scan`.
- `api-ia` no recibe acceso a las tablas en el modelo inicial.
- Solo `api-core` puede leer la versión activa del secreto HMAC.
- DynamoDB no sustituye autorización: el caso de uso deriva `parentRef`, valida
  ownership y usa expresiones condicionales.
- No se registran items, cuerpos, tokens, IDs, `requestHash` ni exports en logs o
  errores.
- `responseSnapshot` se valida mediante lista permitida antes de persistirlo.

## Alternativas descartadas

### Una tabla por entidad

Multiplica capacidad mínima, IAM, Terraform y operaciones de borrado sin aportar
valor a los patrones actuales.

### Una única tabla para dominio e idempotencia

Es viable, pero mezcla capacidad y retención de datos técnicos de alta rotación
con el dominio. Dos tablas mantienen transacciones atómicas y ajustes
independientes.

### GSI por `challengeId`

Agrega costo y consistencia eventual. El localizador bajo la partición adulta
preserva ownership y evita una búsqueda global.

### DynamoDB on-demand

Reduce planificación inicial, pero no aprovecha el presupuesto provisionado del
MVP. Cambiarlo requiere una decisión explícita de costo.

## Consecuencias

### Positivas

- Todos los accesos usan claves conocidas o `Query` acotado.
- Ownership queda ligado al adulto autenticado.
- Intento, progreso e idempotencia cambian atómicamente.
- Localizadores e idempotencia pueden eliminarse por adulto o perfil.
- El borrado bloquea escrituras nuevas y puede reanudarse.
- TTL limpia efímeros sin decidir autorización ni validez.
- El modelo comienza sin GSI y con capacidad provisionada pequeña.

### Costos y riesgos

- El localizador agrega una escritura por reto y se conserva siete días.
- Las transacciones consumen más capacidad que escrituras independientes.
- La clave HMAC requiere custodia y rotación controlada.
- El borrado por páginas necesita worker, alarmas y pruebas de fallos.
- PITR puede conservar datos borrados hasta siete días en `prod`.
- Los campos finales de progreso dependen de reglas de dominio pendientes.

## Decisiones diferidas

No bloquean el esquema físico ni su implementación inicial:

1. Tamaño de ventanas recientes y reglas definitivas de puntaje/dificultad.
2. Máximo de perfiles por adulto.
3. Formato HTTP final de exportación.
4. Persistencia o descarte de artefactos sanitizados generados por IA.
5. Identificador analítico revocable y limpieza mediante ADR-004.
6. Capacidad y autoscaling de producción basados en medición.
7. Revisión legal de retención, backups y SLA antes de producción.

## Verificación requerida durante implementación

- Contract tests de cada repository contra una tabla compatible con DynamoDB.
- Dos adultos que demuestren ausencia de IDOR.
- Carrera de dos intentos con la misma y distinta `Idempotency-Key`.
- Reto expirado y respondido sin doble score.
- Borrado cuando el challenge expiró antes que su localizador.
- Limpieza de toda la idempotencia por perfil y cuenta.
- Cuenta en `deleting` que rechaza perfiles, consentimientos, retos e intentos.
- Fallo inyectado en cada etapa de borrado y reanudación por cursor.
- TTL numérico y rechazo por `validUntil` antes del borrado físico.
- Exportación sin `grading`, secretos ni datos de otra cuenta.
- Ningún item, error o log contiene fecha adulta, token, email, chat o texto libre
  infantil.
- Terraform: `fmt -check`, `validate` y `test` antes de cualquier `plan/apply`.
