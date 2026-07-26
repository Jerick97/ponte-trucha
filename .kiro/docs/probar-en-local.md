# Probar todo en local

Owner: **Francis**. Última verificación: 25-jul-2026.

Hay dos formas de correr el producto en una laptop. La primera es la del
producto completo; la segunda sirve para trabajar el backend sin emulador.

| Camino | Qué ejercita | Cuándo |
|---|---|---|
| **A. Contra el emulador (Floci)** | Cognito, API Gateway, Lambda, DynamoDB y Secrets Manager reales del emulador; login real del adulto | demo, integración frontend↔backend |
| **B. API en memoria** | FastAPI con repositories en memoria y un token de juguete | TDD del backend, sin Docker |

Nada de esto toca AWS real ni cuesta dinero.

## A. Camino completo: frontend conectado al backend emulado

### 1. Levantar el emulador y desplegar

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

backend/.venv/bin/python backend/scripts/package_lambdas.py
terraform -chdir=infra/environments/dev init -backend=false
terraform -chdir=infra/environments/dev apply
```

### 2. Comprobar el backend de punta a punta

```bash
npm run probar:floci
```

Verifica que existan las tablas, el User Pool y las dos APIs, y luego recorre el
flujo con **login real de Cognito**: cuenta, consentimientos por finalidad,
perfil infantil, reto sin respuesta correcta, intento, reintento idempotente,
progreso, respuesta curada del estafador, aislamiento entre dos adultos (IDOR) y
borrado.

### 3. Configurar el frontend

```bash
npm run entorno:floci      # escribe .env.local desde los outputs de Terraform
npm run dev                # reinicia el dev server si ya estaba corriendo
```

`.env.local` solo lleva identificadores públicos (URL del API, id del User Pool y
del app client). El dev server publica dos rutas en su propio origen porque el
emulador no responde con headers CORS:

- `/api` → `…/restapis/{apiId}/$default/_user_request_` (API Gateway);
- `/cognito` → `cognito-idp` del User Pool.

### 4. Crear una cuenta adulta para entrar

El emulador no entrega el correo de verificación, así que el código de
confirmación no llega a ninguna parte. Dos opciones:

```bash
# a) cuenta lista para «Ya tengo cuenta»
backend/.venv/bin/python backend/scripts/cuenta_floci.py crear papa@ejemplo.local 'Trucha-Local-2026!'

# b) registrarse desde el navegador y confirmar por CLI
backend/.venv/bin/python backend/scripts/cuenta_floci.py confirmar papa@ejemplo.local
```

En AWS real este paso no existe: Cognito envía el código al correo del adulto y
la pantalla de confirmación del onboarding lo acepta.

### 5. Jugar

Landing → age gate → cuenta del adulto → consentimientos → perfil → teléfono.
Desde ahí, cada reto, cada intento y el progreso vienen del backend:

- el banco de escenarios lo lee la Lambda, no el navegador;
- el puntaje y la racha los calcula el servidor;
- las señales y la lección llegan recién con el resultado del intento;
- la conversación con el estafador solo se ofrece si el adulto activó el permiso
  de IA server-side.

Para verlo en DynamoDB:

```bash
backend/.venv/bin/python -c "import boto3,os;print(boto3.client('dynamodb',endpoint_url=os.environ['AWS_ENDPOINT_URL']).scan(TableName='ptk-domain-dev')['Count'])"
```

### Qué es específico del emulador

Tres concesiones, todas apagadas fuera del emulador y cubiertas por pruebas:

1. **Issuer del authorizer.** El emulador firma los tokens con su propio host, no
   con el endpoint AWS del User Pool (`issuer_base_url_override` en
   `infra/modules/identity`).
2. **Claims y scopes.** No propaga `requestContext.authorizer` ni emite scopes de
   resource server, porque no implementa Hosted UI. Con `use_floci = true`, las
   Lambdas verifican el access token contra el JWKS del User Pool y toman los
   scopes del ambiente (`local_gateway_claims.py`). En AWS real hay una
   precondición de Terraform que impide activar ese puente.
3. **Login.** ADR-002 usa Hosted UI + Authorization Code + PKCE; el emulador solo
   soporta `USER_PASSWORD_AUTH`.

## B. Camino corto: API en memoria

```bash
npm run probar:local      # levanta el API, recorre el flujo y lo apaga
npm run api:local         # http://127.0.0.1:8000 para curl o Bruno
```

`backend/scripts/dev_server.py` reemplaza al authorizer traduciendo
`Authorization: Bearer ptk-local.<sub>` al header de contexto. Es un atajo de
autenticación, así que está contenido:

- vive en `backend/scripts/`, fuera de `src/`, y un test verifica que no entra al
  zip de Lambda;
- se niega a arrancar si detecta `DOMAIN_TABLE_NAME`, `IDEMPOTENCY_TABLE_NAME`,
  `HMAC_SECRET_ARN` o `AWS_LAMBDA_FUNCTION_NAME`;
- escucha en `127.0.0.1` y solo acepta CORS de `localhost:5173`;
- para probar un 403 por scope: `X-Dev-Scopes: profiles.read`.

**No exponer ese puerto a la red ni usarlo con datos reales.**

## Verificación en CI

```bash
npm run lint && npm run test && npm run validar:escenarios && npm run build

cd backend && source .venv/bin/activate
pytest -q
ruff check . && ruff format --check .
pyright

terraform fmt -check -recursive infra
terraform -chdir=infra/environments/dev validate
terraform -chdir=infra/modules/api test
terraform -chdir=infra/modules/identity test
terraform -chdir=infra/modules/data test
terraform -chdir=infra/environments/dev test
```
