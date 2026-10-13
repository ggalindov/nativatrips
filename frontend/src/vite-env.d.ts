/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "mock" usa datos en memoria; "http" consume la API del backend. */
  readonly VITE_FUENTE_DATOS?: 'mock' | 'http';
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
