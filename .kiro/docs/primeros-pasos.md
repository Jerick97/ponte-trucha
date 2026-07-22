# Primeros pasos

Para los tres integrantes. Cinco minutos y estás corriendo el juego.

## 1. Requisitos

- Node 20 o superior (`node -v`)
- Git
- Chrome reciente (para probar el LLM on-device)

## 2. Arranque

```bash
git clone https://github.com/Jerick97/ponte-trucha.git
cd ponte-trucha
npm install
cp .env.example .env.local     # en Windows: copy .env.example .env.local
npm run dev
```

Abre `http://localhost:5173`. El juego funciona sin configurar nada: el chat del
estafador usará el guion local hasta que haya LLM disponible.

## 3. Verificar que todo está bien

```bash
npm run lint
npm run test
npm run validar:escenarios
```

Los tres en verde = tu entorno está sano.

## 4. Activar el LLM on-device (Chrome)

1. Abre `chrome://flags`.
2. Activa **Prompt API for Gemini Nano** y **Optimization Guide On Device Model**.
3. Reinicia Chrome y espera a que el modelo se descargue.
4. En la consola: `await LanguageModel.availability()` debe devolver `"available"`.

Si no está disponible, el juego usa el fallback automáticamente. No es un error.

## 5. Cómo trabajamos

1. Elige una tarea de `.kiro/specs/<tu-feature>/tasks.md`.
2. Crea una rama: `git checkout -b feat/nombre-corto`.
3. Programa siguiendo `.kiro/steering/estandares-de-codigo.md`.
4. Verifica con los comandos de arriba.
5. Commit en español: `agrega tratamiento visual por canal`.
6. Pull request a `main`. Merge cuando la URL pública sigue funcionando.

## 6. Qué carpeta es de quién

- **Jerick** → `src/components/`, `src/index.css`
- **Francis** → `src/llm/`, `infra/`
- **Clau** → `src/data/`, `src/game/`

Compartidos (avisar antes de tocar): `src/types/`, `src/store/`, `src/App.tsx`.

## 7. Si algo falla

| Problema | Solución |
|---|---|
| `npm install` falla | Verifica Node 20+; borra `node_modules` y `package-lock.json` |
| El validador de escenarios falla | Lee el `id` y el motivo; casi siempre es un fragmento que no aparece literal en el mensaje |
| Tailwind no aplica estilos | Confirma que `src/index.css` empieza con `@import 'tailwindcss'` |
| El chat responde siempre lo mismo | Es el guion local: no hay LLM disponible. Revisa el paso 4 |
