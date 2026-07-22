/// <reference types="vite/client" />

/** Variables de entorno publicas del frontend. Aqui NUNCA va un secreto. */
interface ImportMetaEnv {
  /** URL de la Lambda de fallback del estafador. Vacia = solo on-device o guion local. */
  readonly VITE_LLM_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
