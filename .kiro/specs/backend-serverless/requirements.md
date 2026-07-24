# Requisitos — Backend serverless

**Owner:** Francis  
**Estado:** aprobado para planificación; implementación pendiente

## Requisitos EARS

### R1 — API serverless

- EL SISTEMA DEBE exponer una API HTTPS versionada bajo `/v1`.
- CUANDO una ruta protegida recibe un access token inválido o sin scope, API
  Gateway DEBE rechazarla antes de invocar Lambda.
- EL SISTEMA DEBE ejecutarse en Lambda Python con dominio independiente de AWS.
- EL SISTEMA NO DEBE requerir EC2, RDS, VPC ni NAT Gateway en el MVP.

### R2 — Persistencia

- EL SISTEMA DEBE persistir consentimiento, perfiles, progreso, retos emitidos,
  intentos e idempotencia en DynamoDB.
- CUANDO se accede a un perfil, EL SISTEMA DEBE comprobar ownership desde el
  adulto autenticado.
- CUANDO un dato efímero vence, DynamoDB DEBE poder eliminarlo mediante TTL.
- EL SISTEMA NO DEBE usar `Scan` en una ruta de usuario.

### R3 — Emisión de retos

- CUANDO el frontend solicita un siguiente reto, EL SISTEMA DEBE elegir un canal,
  dificultad y escenario elegibles según progreso, banda y no repetición.
- EL SISTEMA DEBE soportar `roblox`, `sms`, `email` y `whatsapp`.
- EL RETO NO DEBE incluir la respuesta correcta ni la explicación antes del
  intento.
- SI la IA no está consentida, disponible o validada, EL SISTEMA DEBE usar el
  banco curado.

### R4 — Intentos y progreso

- CUANDO se envía un intento nuevo, EL SISTEMA DEBE calificarlo y actualizar
  progreso de forma autoritativa.
- CUANDO se repite la misma `Idempotency-Key`, EL SISTEMA DEBE devolver el mismo
  resultado sin sumar puntos.
- SI un reto expiró o fue respondido, EL SISTEMA DEBE rechazar otro intento
  calificable.
- EL SISTEMA DEBE conservar la mezcla de trampas y mensajes confiables.

### R5 — Adaptación

- EL SISTEMA DEBE adaptar dificultad con reglas deterministas y explicables.
- CUANDO el desempeño demuestra dominio sostenido, EL SISTEMA PUEDE subir un
  nivel dentro de la banda permitida.
- CUANDO hay errores repetidos, EL SISTEMA DEBE estabilizar o bajar dificultad
  sin castigar ni etiquetar al niño.
- EL SISTEMA NO DEBE crear perfiles psicológicos ni usar texto libre para
  inferir atributos sensibles.

### R6 — IA segura

- CUANDO se use IA server-side, EL SISTEMA DEBE comprobar consentimiento vigente.
- EL SISTEMA DEBE desidentificar y limitar la entrada antes de Bedrock.
- TODA salida generada DEBE pasar por schema, reglas de alcance y guardrails.
- SI un guardrail falla, EL SISTEMA DEBE descartar la salida y usar contenido
  curado.
- EL SISTEMA NO DEBE persistir prompt, respuesta o chat.

### R7 — Contrato y calidad

- EL SISTEMA DEBE publicar un contrato OpenAPI 3.1 revisado.
- LOS ERRORES DEBEN seguir RFC 9457.
- CADA comportamiento de dominio DEBE construirse con TDD.
- EL BACKEND DEBE respetar la regla de dependencias y los patrones aprobados en
  steering.

### R8 — Infra y costo

- TODA infraestructura DEBE definirse con Terraform y tener tests.
- EL SISTEMA DEBE incluir presupuesto, alarmas y límites de concurrencia/cuotas.
- SI una dependencia externa falla, EL SISTEMA DEBE degradar sin romper el loop
  curado.
- LOS RECURSOS DEBEN incluir tags de proyecto, ambiente, owner y costo.

## Aceptación

- El flujo completo funciona con dos adultos sin fuga entre perfiles.
- Un retry de intento no duplica score.
- Cada canal pasa contract tests de Factory y esquema.
- Una salida IA insegura cae en fallback curado.
- OpenAPI coincide con la implementación.
- Terraform pasa fmt, validate y tests antes de plan/apply.

