import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferred = writable<BeforeInstallPromptEvent | null>(null);

const installedState = writable(false);

export const installed = { subscribe: installedState.subscribe };

export const canPrompt = derived(deferred, (d) => d !== null);

if (browser) {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (standalone) installedState.set(true);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred.set(e as BeforeInstallPromptEvent);
  });

  window.addEventListener('appinstalled', () => {
    installedState.set(true);
    deferred.set(null);
  });
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export async function promptInstall(): Promise<InstallOutcome> {
  const ev = get(deferred);
  if (!ev) return 'unavailable';
  try {
    await ev.prompt();
    const choice = await ev.userChoice;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  } catch {
    return 'dismissed';
  } finally {
    deferred.set(null);
  }
}
