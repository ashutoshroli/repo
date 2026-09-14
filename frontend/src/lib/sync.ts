import { refreshPortal } from '$lib/stores/portal';

const SYNC_TAG = 'chhath-refresh';
const PERIODIC_TAG = 'chhath-periodic-refresh';
const PERIODIC_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

const MIN_REFRESH_GAP_MS = 30_000;
let lastRefresh = 0;

function refreshIfDue(): void {
  const now = Date.now();
  if (now - lastRefresh < MIN_REFRESH_GAP_MS) return;
  lastRefresh = now;
  void refreshPortal().catch(() => {});
}

export function startSync(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onOnline = () => refreshIfDue();
  const onVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) refreshIfDue();
  };

  window.addEventListener('online', onOnline);
  document.addEventListener('visibilitychange', onVisible);

  void registerBackgroundSync();
  void registerPeriodicSync();

  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export async function registerBackgroundSync(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    if (!reg.sync) return false;
    await reg.sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

export async function registerPeriodicSync(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;

    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      periodicSync?: {
        register: (tag: string, opts: { minInterval: number }) => Promise<void>;
        getTags?: () => Promise<string[]>;
      };
    };
    if (!reg.periodicSync) return false;

    const perms = navigator.permissions as
      | { query?: (d: { name: string }) => Promise<{ state: string }> }
      | undefined;
    if (perms && typeof perms.query === 'function') {
      try {
        const status = await perms.query({ name: 'periodic-background-sync' as PermissionName });
        if (status.state !== 'granted') return false;
      } catch {
        return false;
      }
    }

    if (typeof reg.periodicSync.getTags === 'function') {
      const tags = await reg.periodicSync.getTags();
      if (tags && tags.includes(PERIODIC_TAG)) return true;
    }

    await reg.periodicSync.register(PERIODIC_TAG, { minInterval: PERIODIC_MIN_INTERVAL_MS });
    return true;
  } catch {
    return false;
  }
}
