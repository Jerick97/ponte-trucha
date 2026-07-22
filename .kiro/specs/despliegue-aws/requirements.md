# Requirements Document

> Despliegue en AWS y entregables del hackathon

## Introduction

El criterio "Software funcional y entregables" pesa 30 % y exige **URL pública,
repositorio con README y video de 3 minutos**. El criterio "Uso de AWS y Kiro"
pesa 10 % y se cubre con hosting estático en S3 + CloudFront y la Lambda de
fallback.

Regla del brief que respetamos: **deploy temprano** (día 3-4), no al final.

Owner: **Francis**, con Clau en el video y Jerick en las capturas.

## Glossary

- **OAC**: Origin Access Control, la forma actual de que CloudFront lea un bucket S3 privado.
- **Invalidación**: purga de la caché de CloudFront tras un nuevo build.
- **Function URL**: endpoint HTTPS directo de una Lambda, sin API Gateway.
- **Free tier**: capa gratuita de AWS; el proyecto debe costar USD 0.

## Requirements

### Requisito 1: Hosting estático

**Historia de Usuario:** Como jurado, quiero abrir una URL y jugar sin instalar nada, para poder evaluar el proyecto en un minuto.

#### Criterios de Aceptación

1. CUANDO se ejecuta `npm run build` ENTONCES el sistema DEBERÁ producir un `dist/` completamente estático
2. CUANDO se sube `dist/` a S3 ENTONCES el bucket DEBERÁ permanecer privado y servirse solo vía CloudFront con OAC
3. CUANDO un usuario abre la URL de CloudFront ENTONCES el juego DEBERÁ cargar por HTTPS
4. CUANDO se despliega una versión nueva ENTONCES el sistema DEBERÁ invalidar la caché de CloudFront
5. CUANDO se abre la URL en un móvil ENTONCES el juego DEBERÁ ser jugable sin zoom ni scroll horizontal

### Requisito 2: Lambda de fallback

**Historia de Usuario:** Como equipo, quiero que el fallback del LLM esté desplegado y acotado en costo, para que ningún abuso genere una factura.

#### Criterios de Aceptación

1. CUANDO se despliega la Lambda ENTONCES DEBERÁ tener runtime `nodejs22.x`, timeout de 10 s y concurrencia reservada de 5
2. CUANDO se configura la Function URL ENTONCES `ORIGEN_PERMITIDO` DEBERÁ apuntar al dominio de CloudFront, no a `*`
3. CUANDO se guarda la API key del proveedor ENTONCES DEBERÁ estar en variables de entorno de la Lambda y nunca en el repo
4. CUANDO la Lambda escribe logs ENTONCES NO DEBERÁ incluir contenido del chat
5. CUANDO se revisa el costo al cierre del hackathon ENTONCES DEBERÁ ser USD 0 dentro del free tier

### Requisito 3: Seguridad del repositorio

**Historia de Usuario:** Como equipo, quiero que sea imposible subir una credencial por accidente, para no quemar una API key en público.

#### Criterios de Aceptación

1. CUANDO se hace commit ENTONCES `.env`, `.env.local` y `dist/` DEBERÁN estar ignorados
2. CUANDO existe una variable `VITE_*` ENTONCES DEBERÁ contener solo datos públicos (una URL), nunca un secreto
3. CUANDO se ejecuta un comando de shell desde Kiro ENTONCES un hook DEBERÁ escanear el repo en busca de secretos
4. CUANDO se publica el repositorio ENTONCES DEBERÁ incluir `.env.example` con las claves vacías

### Requisito 4: Entregables del hackathon

**Historia de Usuario:** Como jurado, quiero encontrar todo lo pedido sin buscar, para poder puntuar rápido.

#### Criterios de Aceptación

1. CUANDO se abre el repositorio ENTONCES el README DEBERÁ incluir: qué es, URL pública, cómo correrlo, arquitectura, uso de Kiro y reparto del equipo
2. CUANDO se revisa el README ENTONCES DEBERÁ mostrar el diagrama de arquitectura
3. CUANDO se entrega el video ENTONCES DEBERÁ durar máximo 3 minutos y seguir el guion del brief
4. CUANDO se muestra el uso de Kiro en el video ENTONCES DEBERÁN verse en pantalla specs, hooks y steering
5. CUANDO se entrega ENTONCES la URL pública DEBERÁ estar viva y probada en un dispositivo ajeno al equipo

### Requisito 5: Automatización del despliegue

**Historia de Usuario:** Como equipo cansado a las 2 a. m., quiero desplegar con un comando, para no equivocarme en pasos manuales.

#### Criterios de Aceptación

1. CUANDO se ejecuta el script de despliegue ENTONCES DEBERÁ construir, sincronizar con S3 e invalidar CloudFront en un solo paso
2. CUANDO el build falla ENTONCES el script NO DEBERÁ subir nada
3. CUANDO se despliega ENTONCES el script DEBERÁ imprimir la URL final
