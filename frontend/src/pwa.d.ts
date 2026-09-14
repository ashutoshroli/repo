/// <reference types="@vite-pwa/sveltekit" />

declare module 'virtual:pwa-info' {
  export interface PwaInfo {
    webManifest: {
      href: string;
      useCredentials: boolean;
      linkTag: string;
    };
    pwaInDevEnvironment: boolean;
  }
  export const pwaInfo: PwaInfo | undefined;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisteredSW?: (swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  }
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
