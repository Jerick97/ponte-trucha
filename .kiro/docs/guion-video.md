# Guion del video — 3 minutos

Owner: **Clau**. Grabación con la app **desplegada**, nunca en `localhost`.
Los criterios que este video debe tocar están en la sección 9 del brief.

## 0:00 – 0:20 · El problema

> "¿Sabías que a un niño le pueden robar su cuenta de Roblox con un solo mensaje?"

- Cifras de fraude digital infantil en Latinoamérica.
- Punto clave: las herramientas que existen son para adultos, en inglés, y son
  quizzes estáticos. Los papás no pueden advertir de algo que no ven.

**En pantalla:** mensajes reales de estafa dentro de un chat de juego.

## 0:20 – 1:50 · Demo en vivo

1. Se abre la URL pública en un celular. Carga en segundos, sin instalar nada.
2. Llega un mensaje: *"Robux gratis, solo pon tu contraseña"*. Se decide **Es trampa**.
3. Aparece el feedback: se **resaltan las señales** y se explica la lección en
   lenguaje de niño.
4. Llega un mensaje **legítimo** y se marca como de confianza: aquí se explica
   que no enseñamos a desconfiar de todo, sino a distinguir.
5. **El momento wow:** el niño le responde al estafador y el LLM improvisa,
   presiona, mete prisa. Se corta la conversación y se muestra que rendirse es
   parte de la lección.
6. Racha, puntaje y **nivel de trucha** compartible.

**Regla de edición:** esta sección se graba de un tirón, sin cortes, para que se
vea que el producto funciona de verdad.

## 1:50 – 2:40 · Cómo lo construyó Kiro

**En pantalla, mostrando el editor:**

- `.kiro/specs/` — las cuatro features con requirements en formato EARS, design y
  tasks. "No escribimos código hasta tener el requisito escrito."
- `.kiro/steering/` — tono infantil y seguridad infantil aplicados en cada
  edición, sin repetirlo en cada prompt.
- `.kiro/hooks/` — el hook que valida el banco de escenarios y el que protege los
  guardrails. Se muestra un error del validador atrapando un escenario mal escrito.

**Por qué el LLM on-device es innovador y seguro:**

- Corre en el navegador del niño con la Prompt API de Chrome (Gemini Nano).
- Cero latencia, cero costo por token, **cero datos del niño saliendo del dispositivo**.
- Es exactamente lo que un producto infantil necesita.
- Y si el navegador no lo soporta, hay fallback a AWS Lambda: el juego nunca se rompe.

**La seguridad se cuenta como fortaleza:** el juego cubre estafas y fraudes,
nunca simula acoso ni manipulación personal. Es una decisión de diseño.

## 2:40 – 3:00 · Arquitectura y cierre

- Diagrama: navegador → CloudFront → S3; y el camino del fallback a Lambda.
- Costo de operación: USD 0 en free tier.
- Roadmap en una línea: dificultad adaptativa, leaderboard, modo docente.

**Cierre:**

> "Ponernos trucha desde niños, para no caer de grandes."

## Checklist de grabación

- [ ] La URL pública funciona desde un dispositivo fuera de la red del equipo.
- [ ] Chrome con la Prompt API activa para mostrar el plan A.
- [ ] Captura de respaldo del juego por si la red falla en la grabación.
- [ ] Se ven en pantalla: specs, hooks y steering.
- [ ] Duración final ≤ 3:00.
