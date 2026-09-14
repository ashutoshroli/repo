import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { loadPortalData, type PortalResult } from '$lib/api/client';
import { EMPTY_PORTAL_DATA, type PortalData } from '$lib/api/schema';
import { availableYears, ALL_YEARS, type YearSel } from '$lib/api/derive';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PortalState {
  status: LoadStatus;
  data: PortalData;
  stale: boolean;
  savedAt: number;
  version: string;
  failed: boolean;
}

const initialState: PortalState = {
  status: 'idle',
  data: EMPTY_PORTAL_DATA,
  stale: false,
  savedAt: 0,
  version: '',
  failed: false
};

export const portalState = writable<PortalState>(initialState);

export const year = writable<YearSel>(new Date().getFullYear());

export const years = derived(portalState, ($s) => availableYears($s.data));

let started = false;

export async function initPortal(force = false): Promise<void> {
  if (!browser) return;
  if (started && !force) return;
  started = true;

  portalState.update((s) => ({ ...s, status: 'loading' }));

  const result: PortalResult = await loadPortalData({ force });
  const yrs = availableYears(result.data);
  const failed = result.savedAt === 0 && !result.stale ? false : false;
  const cold = result.savedAt === 0 && (result.data.collections?.length ?? 0) === 0;

  portalState.set({
    status: cold ? 'error' : 'ready',
    data: result.data,
    stale: result.stale,
    savedAt: result.savedAt,
    version: result.version,
    failed: cold
  });

  const current = get(year);
  if (!yrs.includes(current as number) && current !== ALL_YEARS) {
    const nowYear = new Date().getFullYear();
    year.set(yrs.includes(nowYear) ? nowYear : yrs[0]);
  }
}

export async function refreshPortal(): Promise<void> {
  await initPortal(true);
}
