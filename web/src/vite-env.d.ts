/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the FGS leaderboard API. Unset disables score submission. */
  readonly VITE_FGS_LEADERBOARD_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
