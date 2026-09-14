export const DEFAULTS = Object.freeze({
  PUBLIC_API_BASE: 'https://chhath-public-worker.shaharpura.com',
  PUBLIC_RENDER_CHAT_URL: 'https://chhath-server-render.onrender.com/public-chat',
  PUBLIC_MGMT_LOGIN_URL: 'https://mgmt-chhath.shaharpura.com/',
  PUBLIC_SITE_URL: 'https://chhath.shaharpura.com',
  PUBLIC_VAPID_KEY: 'BFoFsfDkYfYdHbKwGBZ7xtbOaXAKQRiCRwkXF4Nuz23q6fyidU-0VHjv3fhBA8177tavQfe2-dWGYcgKsWgVp-s'
});

export type ConfigKey = keyof typeof DEFAULTS;

export interface ResolvedConfig {
  apiBase: string;
  renderChatUrl: string;
  mgmtLoginUrl: string;
  siteUrl: string;
  vapidKey: string;
}

const stripTrailingSlash = (v: string) => v.replace(/\/+$/, '');

export function resolveConfig(env: Partial<Record<ConfigKey, string | undefined>>): ResolvedConfig {
  const pick = (key: ConfigKey): string => {
    const v = env[key];
    return v === undefined || v === null || String(v).trim() === '' ? DEFAULTS[key] : String(v).trim();
  };
  return {
    apiBase: stripTrailingSlash(pick('PUBLIC_API_BASE')),
    renderChatUrl: pick('PUBLIC_RENDER_CHAT_URL'),
    mgmtLoginUrl: pick('PUBLIC_MGMT_LOGIN_URL'),
    siteUrl: stripTrailingSlash(pick('PUBLIC_SITE_URL')),
    vapidKey: pick('PUBLIC_VAPID_KEY')
  };
}

function readEnv(): Partial<Record<ConfigKey, string | undefined>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return {
      PUBLIC_API_BASE: import.meta.env?.PUBLIC_API_BASE,
      PUBLIC_RENDER_CHAT_URL: import.meta.env?.PUBLIC_RENDER_CHAT_URL,
      PUBLIC_MGMT_LOGIN_URL: import.meta.env?.PUBLIC_MGMT_LOGIN_URL,
      PUBLIC_SITE_URL: import.meta.env?.PUBLIC_SITE_URL,
      PUBLIC_VAPID_KEY: import.meta.env?.PUBLIC_VAPID_KEY
    };
  } catch {
    return {};
  }
}

export const config: ResolvedConfig = resolveConfig(readEnv());

export const apiUrl = (action: string, extra = ''): string =>
  `${config.apiBase}/?action=${encodeURIComponent(action)}${extra}`;

export default config;
