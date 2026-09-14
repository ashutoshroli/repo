import { derived } from 'svelte/store';
import { themeId } from './theme';
import { skinForTheme } from '$lib/skins/registry';
import type { Skin } from '$lib/skins/types';

export const activeSkin = derived(themeId, ($id): Skin => skinForTheme($id));
