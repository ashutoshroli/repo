import type { Component, Snippet } from 'svelte';

export type SkinShell = Component<{ children: Snippet }>;

export interface SkinPages {
  Home: Component;
  Expenses: Component;
  Loans: Component;
  Committee: Component;
  Downloads: Component;
  Decade: Component;
  Donate: Component;
  Verify: Component;
}

export interface Skin {
  id: string;
  Shell: SkinShell;
  pages: SkinPages;
}
