/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_REAL_LLM?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
