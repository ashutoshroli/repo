import { browser } from '$app/environment';

const DB_NAME = 'chhath-notifications';
const DB_VERSION = 1;
const STORE = 'items';

export interface InboxItem {
  id: number;
  title: string;
  body: string;
  url: string;
  tag: string;
  receivedAt: number;
  read: 0 | 1;
}

export function inboxSupported(): boolean {
  return browser && typeof indexedDB !== 'undefined';
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!inboxSupported()) {
      reject(new Error('no indexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('receivedAt', 'receivedAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('indexedDB open failed'));
  });
}

export async function listInbox(): Promise<InboxItem[]> {
  if (!inboxSupported()) return [];
  try {
    const db = await open();
    return await new Promise<InboxItem[]>((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result ?? []) as InboxItem[];
        rows.sort((a, b) => (b.receivedAt ?? 0) - (a.receivedAt ?? 0));
        resolve(rows);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function markInboxRead(): Promise<void> {
  if (!inboxSupported()) return;
  try {
    const db = await open();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const cursorReq = tx.objectStore(STORE).openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        const row = cursor.value as InboxItem;
        if (!row.read) cursor.update({ ...row, read: 1 });
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
  }
}

export async function clearInbox(): Promise<void> {
  if (!inboxSupported()) return;
  try {
    const db = await open();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    });
  } catch {
  }
}
