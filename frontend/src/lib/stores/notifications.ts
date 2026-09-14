import { writable, derived } from 'svelte/store';
import { listInbox, markInboxRead, clearInbox, type InboxItem } from '$lib/notifications';

const items = writable<InboxItem[]>([]);

export const inbox = { subscribe: items.subscribe };

export const unreadCount = derived(items, (rows) => rows.reduce((n, r) => n + (r.read ? 0 : 1), 0));

export async function refreshInbox(): Promise<void> {
  items.set(await listInbox());
}

export async function markAllRead(): Promise<void> {
  await markInboxRead();
  await refreshInbox();
}

export async function clearAll(): Promise<void> {
  await clearInbox();
  await refreshInbox();
}

export function initInbox(): () => void {
  void refreshInbox();

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  const onMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string } | null;
    if (data && data.type === 'push-received') void refreshInbox();
  };
  navigator.serviceWorker.addEventListener('message', onMessage);
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}
