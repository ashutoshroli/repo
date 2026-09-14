import { writable } from 'svelte/store';

export const themeGalleryOpen = writable(false);

export function openThemeGallery() {
  themeGalleryOpen.set(true);
}
export function closeThemeGallery() {
  themeGalleryOpen.set(false);
}
