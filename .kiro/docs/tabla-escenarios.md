# Banco de escenarios — tabla para el video y el README

> Owner: Clau. Generada del banco real (`src/data/escenarios.json`).
> Estado actual: **11 escenarios · 5 canales · 8 estafas + 3 legítimos (27%)**.
> El chat con el estafador está habilitado en 5 escenarios.

## Tabla completa (ordenada por dificultad, como aparecen en la partida)

| # | Canal | Remitente | Qué dice (resumen) | Veredicto | Señal que lo delata | Lección | Chat |
|---|---|---|---|---|---|---|---|
| 1 | Roblox (chat-juego) | RobuxKing_Oficial 👑 | Regala 10 000 Robux si pones tu usuario y contraseña | 🔴 Trampa | "tu contraseña" · "los primeros 5" | Nadie regala monedas a cambio de tu contraseña | Sí |
| 2 | SMS | Roblox ✅ (verificado) | "Tu código es 481 209. Nunca lo compartas." | 🟢 Confianza | "Nunca compartas este código" | Un mensaje real te informa; uno falso te pide algo | No |
| 3 | WhatsApp | +51 9** *** 412 🎁 | Ganaste una skin, paga S/ 5 de envío con el Yape de tu mamá | 🔴 Trampa | "paga S/ 5 de envío" · "el Yape de tu mamá" | Un premio de verdad nunca te cobra para entregártelo | Sí |
| 4 | Correo (Gmail) | Premios GamerZone 🎁 | *Asunto: ¡Ganaste una tarjeta de juego de $50!* — reclama con tu nombre y dirección | 🔴 Trampa | "Fuiste elegido" · "hoy mismo" | Si nunca entraste a un sorteo, no puedes ganarlo | No |
| 5 | Correo (Gmail) | Miss Rosario (colegio) 📚 | *Asunto: Recordatorio: feria de ciencias del viernes* — traigan la maqueta | 🟢 Confianza | "Les recuerdo" · "Traigan su maqueta" | Un correo real te avisa cosas; no te pide nada tuyo | No |
| 6 | Discord | Moderador \| Staff 🛡️ (verificado) | "Soy admin, detectamos un hackeo, mándame tu clave o la bloqueamos en 10 min" | 🔴 Trampa | "Mandame tu clave" · "en 10 minutos" | Un admin nunca te pide tu clave, ni aunque tenga insignia | Sí |
| 7 | Roblox (chat-juego) | xX_ModsPro_Xx 👾 | "Descarga este archivo para vidas infinitas, no lo bajes de la tienda" | 🔴 Trampa | "Descarga este archivo" · "No lo bajes de la tienda" | Los juegos y apps solo se bajan de la tienda oficial | No |
| 8 | Roblox (chat-juego) | Valeria_09 🎮 | "Entra al server que armamos partida con los del salón" | 🟢 Confianza | "armamos partida" · "no te demores" | No todo mensaje apurado es estafa: revisa si te piden algo tuyo | No |
| 9 | Correo (Gmail) | Soporte Roblox 🎧 | *Asunto: Tu cuenta Roblox será suspendida hoy* — responde con tu usuario y clave | 🔴 Trampa | "tu usuario y tu clave" · "antes de las 6pm" | El soporte de verdad nunca te pide tu clave por correo | Sí |
| 10 | SMS | ROBLOX-PREMIOS 🔗 | "Tu cuenta ganó, reclama en robl0x-premios.com antes que expire" | 🔴 Trampa | "robl0x-premios.com" · "antes que expire" | Lee la dirección letra por letra: una sola cambiada ya es trampa | No |
| 11 | WhatsApp | Mateo (colegio) 🧒 | "Perdí mi cel, te llega un código de 6 números, pásamelo porfa" | 🔴 Trampa | "pasámelo porfa" · "perdí mi cel" | El código que llega a tu celular no se comparte con nadie | Sí |

## Cobertura por canal (las 5 apps se pueden probar en partida)

| Canal / App | Escenarios | Trampa | Legítimo |
|---|---|---|---|
| Roblox (chat-juego) | 3 | 2 | 1 |
| WhatsApp | 2 | 2 | 0 |
| SMS (Mensajes) | 2 | 1 | 1 |
| Discord | 1 | 1 | 0 |
| Correo (Gmail) | 3 | 2 | 1 |

## Familias de estafa cubiertas

Monedas gratis · Sorteo falso · Robo de cuenta · Hack con virus · Link tramposo ·
Suplantación de amigo · (+ mensajes legítimos).

## Recomendados para grabar el video (secuencia sugerida)

1. **#1 Robux gratis** (Roblox) — la estafa más clásica, gancho inmediato, y
   permite mostrar el chat con el estafador (el momento del LLM).
2. **#2 Código real de Roblox** (SMS legítimo) — para mostrar que el juego enseña
   a **distinguir**, no a desconfiar de todo.
3. **#10 Link robl0x con cero** (SMS) — la señal visual del dominio cambiado se
   lee muy bien en cámara.
4. **#5 Correo del colegio** (Gmail legítimo) — muestra la app de Gmail y refuerza
   el mensaje "un correo real no te pide nada tuyo".

## Notas de contenido (para tu revisión, Clau)

- **#6 Discord** y **#2 SMS** son los únicos con remitente "verificado": buen
  material para enseñar que la insignia no garantiza nada.
- Los 3 correos ya tienen **asunto propio** (obligatorio en el canal desde este
  cambio). El de soporte y el de sorteo usan el asunto como gancho; el del colegio
  suena a recordatorio real.
- Pendiente si se decide crecer el banco: el spec `banco-escenarios` apunta a 20
  (13 estafa + 7 legítimo). Hoy vamos 11.
