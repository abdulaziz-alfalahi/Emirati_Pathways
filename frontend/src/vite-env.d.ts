/// <reference types="vite/client" />

// Extend as needed for your env vars. Having this ensures `import.meta.env` is typed.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected at build/start time by vite.config.ts `define`.
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
