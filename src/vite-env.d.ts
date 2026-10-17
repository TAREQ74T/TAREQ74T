/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_HASH?: string
  readonly VITE_BUILD_DIRTY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
