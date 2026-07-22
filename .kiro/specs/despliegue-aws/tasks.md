# Implementation Plan: Despliegue en AWS y entregables

## Overview

Owner: **Francis** (infra), con Clau (video) y Jerick (capturas).
Regla del brief: **deploy temprano**, día 3-4, no el domingo.

Tareas centrales: 12 · Opcionales: 3.

## Tasks

### Fase 1: Infraestructura base (día 3-4)

- [ ] 1. Crear el bucket S3 privado
  - Sin website hosting, sin acceso público
  - _Requisitos: 1.2_

- [ ] 2. Crear la distribución CloudFront con OAC
  - Default root object `index.html`
  - Errores 403 y 404 → `/index.html` con status 200
  - Compresión activada, precio clase 100
  - _Requisitos: 1.2, 1.3_

- [ ] 3. Primer despliegue de prueba
  - `npm run build` + `aws s3 sync` + invalidación
  - Verificar que el juego carga y se juega en la URL pública
  - _Requisitos: 1.1, 1.3, 1.5_

- [ ] 4. Escribir `scripts/desplegar.sh`
  - `set -e`, lint + test + build antes de subir, invalidación e impresión de URL
  - _Requisitos: 5.1, 5.2, 5.3_

### Fase 2: Lambda de fallback (día 5)

- [ ] 5. Crear el rol IAM mínimo
  - Solo `AWSLambdaBasicExecutionRole`
  - _Requisitos: 2.1_

- [ ] 6. Desplegar la Lambda del estafador
  - Runtime `nodejs22.x`, timeout 10 s, memoria 256 MB
  - Concurrencia reservada en 5
  - _Requisitos: 2.1, 2.5_

- [ ] 7. Configurar la Function URL y CORS
  - `ORIGEN_PERMITIDO` apuntando al dominio de CloudFront
  - _Requisitos: 2.2_

- [ ] 8. Cargar las variables de entorno y verificar logs
  - `MISTRAL_API_KEY` fuera del repo; confirmar que los logs no traen el chat
  - _Requisitos: 2.3, 2.4_

### Fase 3: Seguridad del repositorio

- [x] 9. Configurar `.gitignore` y `.env.example`
  - Ignorar `.env`, `.env.local`, `.env.deploy`, `dist/`, `node_modules/`
  - _Requisitos: 3.1, 3.4_

- [x] 10. Hook de escaneo de secretos antes de comandos de shell
  - `.kiro/hooks/seguridad-secrets.kiro.hook`
  - _Requisitos: 3.3_

- [ ] 11. Revisión final de variables públicas
  - Confirmar que ninguna `VITE_*` contiene un secreto
  - _Requisitos: 3.2_

### Fase 4: Entregables (domingo)

- [ ] 12. Diagrama de arquitectura
  - Generarlo con el MCP `aws-diagram` y exportarlo a `docs/arquitectura.png`
  - _Requisitos: 4.2_

- [x] 13. README completo
  - Qué es, URL, cómo correr, arquitectura, uso de Kiro, reparto del equipo
  - _Requisitos: 4.1_

- [ ] 14. Grabar y editar el video de 3 minutos
  - Seguir el guion de `.kiro/docs/guion-video.md`
  - Mostrar specs, hooks y steering en pantalla
  - _Requisitos: 4.3, 4.4_

- [ ] 15. Prueba final en dispositivo ajeno
  - Abrir la URL desde un celular fuera de la red del equipo
  - _Requisitos: 4.5, 1.5_

- [ ] 16*. Revisar el costo real en Cost Explorer
  - Confirmar USD 0 y dejar la captura para el video
  - _Requisitos: 2.5_

- [ ] 17*. GitHub Action de despliegue en push a `main`
  - Solo si sobra tiempo; el script manual ya cumple
  - _Requisitos: 5.1_

- [ ] 18*. Dominio propio en Route 53
  - Opcional; la URL de CloudFront es suficiente para entregar
  - _Requisitos: 1.3_
