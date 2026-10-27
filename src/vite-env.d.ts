/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional URL of the AI Worker (worker/). Empty → scripted mode only. */
  readonly VITE_AI_ENDPOINT?: string;
}
