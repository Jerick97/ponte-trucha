# Requirements Document

> El banco curado continúa siendo la fuente segura y el fallback. La entrega
> remota, schemas por app, generación asistida y selección adaptativa pertenecen
> a `../backend-serverless/`. Apps MVP: Roblox, SMS, email y WhatsApp.

> Banco de escenarios y pipeline de contenido

## Introduction

El contenido **es** el producto. Un banco de ~20 escenarios curados (≈13 estafas
y ≈7 mensajes legítimos) en español latino neutro, escritos con el vocabulario
real de un niño que juega Roblox, Free Fire o Fortnite.

El brief lo dice explícitamente: los escenarios se generan y validan **con Kiro**
(specs por feature, hooks que validan el esquema JSON, steering para el tono
infantil) y quedan estáticos en el repo. Costo de ejecución ≈ cero.

Owner: **Clau** (contenido y lógica de negocio).

## Glossary

- **Banco**: el archivo `src/data/escenarios.json` completo.
- **Escenario**: un mensaje + su respuesta correcta + sus señales + su lección.
- **Señal delatora**: fragmento **literal** del mensaje que revela la trampa.
- **Mensaje legítimo**: mensaje real y seguro que el niño debe marcar como de confianza.
- **Validador**: `scripts/validar-escenarios.mjs`, ejecutado por un hook de Kiro.
- **Perfil de estafador**: semilla de personalidad que recibe el LLM.

## Requirements

### Requisito 1: Estructura y esquema

**Historia de Usuario:** Como desarrollador, quiero que todos los escenarios tengan la misma forma, para que la UI y el LLM los consuman sin casos especiales.

#### Criterios de Aceptación

1. CUANDO se agrega un escenario ENTONCES el sistema DEBERÁ exigir: `id`, `tipo`, `canal`, `dificultad`, `remitente`, `mensaje`, `respuestaCorrecta`, `senales`, `leccion`, `permiteConversacion`
2. CUANDO se define un `id` ENTONCES DEBERÁ ser kebab-case en minúsculas y único en todo el banco
3. CUANDO se define un `tipo` ENTONCES DEBERÁ ser uno de: `monedas-gratis`, `sorteo-falso`, `robo-de-cuenta`, `hack-con-virus`, `link-tramposo`, `suplantacion-de-amigo`, `legitimo`
4. CUANDO el `tipo` es `legitimo` ENTONCES `respuestaCorrecta` DEBERÁ ser `confianza`; en cualquier otro caso DEBERÁ ser `trampa`
5. CUANDO se guarda el archivo ENTONCES el sistema DEBERÁ rechazar campos que no existan en el esquema

### Requisito 2: Reglas de contenido verificables

**Historia de Usuario:** Como diseñadora de contenido, quiero que la herramienta atrape mis errores, para no descubrirlos en la demo.

#### Criterios de Aceptación

1. CUANDO una señal declara un `fragmento` ENTONCES ese texto DEBERÁ aparecer **literal** dentro del `mensaje`
2. CUANDO un `mensaje` supera 240 caracteres ENTONCES el validador DEBERÁ fallar
3. CUANDO `permiteConversacion` es `true` ENTONCES el escenario DEBERÁ incluir `perfilEstafador`
4. CUANDO el `tipo` es `legitimo` ENTONCES `permiteConversacion` DEBERÁ ser `false`
5. CUANDO menos del 25 % del banco son mensajes legítimos ENTONCES el validador DEBERÁ emitir un aviso
6. CUANDO una `leccion` supera 18 palabras ENTONCES el validador DEBERÁ emitir un aviso de tono

### Requisito 3: Cobertura del banco

**Historia de Usuario:** Como niño, quiero encontrarme con las trampas que existen de verdad en mis juegos, para reconocerlas cuando me lleguen.

#### Criterios de Aceptación

1. CUANDO el banco está completo ENTONCES DEBERÁ tener al menos 20 escenarios
2. CUANDO se cuentan los tipos ENTONCES cada familia de estafa DEBERÁ tener al menos 2 escenarios
3. CUANDO se cuentan los legítimos ENTONCES DEBERÁ haber entre 6 y 8
4. CUANDO se distribuye la dificultad ENTONCES DEBERÁ haber escenarios de nivel 1, 2 y 3
5. CUANDO se revisan los canales ENTONCES DEBERÁ haber al menos un escenario por cada canal soportado

### Requisito 4: Tono infantil

**Historia de Usuario:** Como niño de 8 años, quiero entender todo sin preguntarle a nadie qué significa una palabra.

#### Criterios de Aceptación

1. CUANDO se escribe cualquier texto visible ENTONCES DEBERÁ seguir `.kiro/steering/tono-infantil.md`
2. CUANDO se explica una señal ENTONCES la explicación NO DEBERÁ usar jerga técnica (phishing, malware, dominio)
3. CUANDO se escribe el feedback de un fallo ENTONCES NO DEBERÁ regañar ni usar lenguaje de miedo
4. CUANDO se escribe un mensaje legítimo ENTONCES DEBERÁ ser realmente seguro, no una trampa disfrazada

### Requisito 5: Automatización con Kiro

**Historia de Usuario:** Como equipo, quiero que el contenido se valide solo, para no gastar noches revisando JSON a mano.

#### Criterios de Aceptación

1. CUANDO alguien edita `src/data/escenarios.json` ENTONCES el hook de Kiro DEBERÁ ejecutar `npm run validar:escenarios`
2. CUANDO el validador falla ENTONCES el sistema DEBERÁ mostrar el `id` del escenario y el motivo exacto
3. CUANDO se pide a Kiro generar un escenario nuevo ENTONCES DEBERÁ aplicar el steering de tono y el de seguridad infantil
4. CUANDO el validador pasa ENTONCES DEBERÁ reportar cuántos escenarios hay y cuántos son legítimos
