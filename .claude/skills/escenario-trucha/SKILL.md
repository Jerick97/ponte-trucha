---
name: escenario-trucha
description: Crea, revisa o corrige escenarios del banco de Ponte Trucha Kids (src/data/escenarios.json). Úsala cuando se pida "agrega un escenario", "escribe una estafa nueva", "un mensaje legítimo", "revisa el tono del banco" o cuando falle npm run validar:escenarios. Aplica el tono infantil, las reglas de seguridad y valida antes de dar por terminado.
license: MIT
---

# Escenario Trucha

Owner del contenido: **Clau**. Esta skill produce escenarios que pasan el
validador a la primera.

## Antes de escribir

Lee, en este orden:

1. `.kiro/steering/tono-infantil.md` — cómo se le habla a un niño de 8 a 13.
2. `.kiro/steering/seguridad-infantil.md` — los temas que no se tocan nunca.
3. `.kiro/specs/banco-escenarios/design.md` — la tabla de familias y su cuota.
4. `src/data/escenarios.json` — para no repetir un gancho que ya existe.

## Reglas duras (el validador las revisa)

1. `id` en kebab-case, único.
2. Si `tipo` es `legitimo` → `respuestaCorrecta: "confianza"` y
   `permiteConversacion: false`. En cualquier otro caso → `"trampa"`.
3. **Cada `fragmento` de señal debe aparecer literal en el `mensaje`.** Es el
   error más común: copia y pega el fragmento desde el mensaje, no lo reescribas.
4. `mensaje` ≤ 240 caracteres, sin saltos de línea.
5. `leccion` ≤ 18 palabras, sin jerga técnica.
6. Si `permiteConversacion: true` → hace falta `perfilEstafador` completo.
7. Máximo 3 señales por escenario.

## Reglas de escritura

- El mensaje debe sonar a un chat real: faltas de ortografía leves, mayúsculas
  sueltas, emojis moderados. Un mensaje demasiado bien escrito no engaña a nadie
  y no enseña nada.
- Cada escenario enseña **una** regla, no tres.
- La explicación de la señal se dirige al niño, en segunda persona.
- Prohibido: phishing, malware, dominio, ciberdelincuente, "peligro", "te van a
  robar todo".

## Plantilla

```json
{
  "id": "kebab-case-unico",
  "tipo": "monedas-gratis | sorteo-falso | robo-de-cuenta | hack-con-virus | link-tramposo | suplantacion-de-amigo | legitimo",
  "canal": "chat-juego | whatsapp | correo | discord | sms",
  "dificultad": 1,
  "remitente": { "nombre": "", "avatar": "🎮", "verificado": false },
  "mensaje": "",
  "respuestaCorrecta": "trampa",
  "senales": [{ "fragmento": "copiado literal del mensaje", "explicacion": "" }],
  "leccion": "",
  "permiteConversacion": false,
  "perfilEstafador": {
    "disfraz": "",
    "tacticas": ["prisa", "premio"],
    "objetivo": ""
  }
}
```

## Cierre obligatorio

Después de editar el banco, ejecuta:

```bash
npm run validar:escenarios
```

No des la tarea por terminada con errores. Los **avisos** sí se pueden dejar,
pero se mencionan al usuario.

## Al terminar

Reporta en dos líneas: qué escenario se agregó, qué familia cubre y cómo quedó
el balance de legítimos vs estafas según la salida del validador.
