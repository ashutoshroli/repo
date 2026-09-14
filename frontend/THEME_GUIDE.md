# Theme and skin guide

The portal is **skin-based**. Choosing a theme does not just recolour the page —
it swaps the whole portal: the chrome around every page and every page itself.
All of it runs on one shared data layer, so no business logic is ever duplicated
between looks.

There are two separate concepts, and keeping them apart is the whole design:

| | What it is | How many |
| --- | --- | --- |
| **Skin** | A complete layout — a `Shell` plus an implementation of all 8 pages | 5 |
| **Theme** | A named entry in the gallery: picks a skin and supplies a palette | 18 |

Many themes share one skin. *Sunrise*, *Warm Night*, *Midnight* and *Pastel Zen*
are all the `premium` layout wearing different palettes.

## The 5 skins

| Skin | Look |
| --- | --- |
| `premium` | Warm glass, live Chhath sunrise background |
| `classic` | Flat and clean: dark budget card, two stat boxes, vertical list |
| `slate` | Enterprise: five-column budget grid, bordered cards |
| `aurora` | Glassmorphism, animated aurora mesh, bento grid |
| `festival` | Celebratory: maroon and marigold gold, decorative borders |

## The 18 themes

| Theme id | Skin | Mode |
| --- | --- | --- |
| `sunrise` | premium | light |
| `warm-night` | premium | dark |
| `midnight` | premium | dark |
| `pastel-zen` | premium | light |
| `classic-light` | classic | light |
| `slate-light` | slate | light |
| `slate-dark` | slate | dark |
| `executive-pro` | slate | light |
| `aurora` | aurora | dark |
| `neon-noir` | aurora | dark |
| `cyber-lime` | aurora | dark |
| `sunset-vapor` | aurora | dark |
| `mint-frost` | aurora | dark |
| `midnight-glass` | aurora | dark |
| `festival` | festival | light |
| `festival-dark` | festival | dark |
| `heritage-serif` | festival | light |
| `heritage-serif-dark` | festival | dark |

## How a theme becomes a rendered page

```
themes.ts          THEMES[] — id, label key, light/dark mode, gallery swatch
    │
skinMap.ts         THEME_SKIN_ID: themeId ──▶ skinId   (pure, no Svelte imports)
    │
registry.ts        SKINS: skinId ──▶ Skin component bundle
    │
stores/theme.ts    themeId store — persists the choice, sets data-theme + .dark
stores/skin.ts     activeSkin = derived(themeId, skinForTheme)
    │
routes/            +layout.svelte renders $activeSkin.Shell
                   +page.svelte   renders $activeSkin.pages.<Name>
```

`skinMap.ts` is deliberately free of Svelte imports so the mapping can be unit
tested on its own; `registry.ts` is the only module that pulls in components.

Routes stay thin — a whole page route is just:

```svelte
<script lang="ts">
  import { activeSkin } from '$lib/stores/skin';
  let Page = $derived($activeSkin.pages.Expenses);
</script>

<Page />
```

The root layout keys on the skin id, so switching theme cross-fades the entire
shell rather than leaving stale chrome behind.

## The skin contract

A skin must supply a shell and all eight pages (`src/lib/skins/types.ts`):

```ts
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
  Shell: SkinShell;   // Component<{ children: Snippet }>
  pages: SkinPages;
}
```

The `Shell` owns everything around the page: background, header, navigation,
footer and floating UI.

**Skins must not contain business logic.** Fetching, caching, year selection,
totals and rankings all live in `lib/api` and `lib/stores`; a skin reads them and
decides only how things look. If you find yourself recomputing a total inside a
skin, it belongs in `lib/api/derive.ts` instead — that is where the unit tests
are.

## Theme tokens

Palettes are CSS custom properties set per theme in `src/app.css`, inside
`@layer base`, keyed on `[data-theme='<id>']`. `:root` and `:root.dark` hold the
light and dark baselines; each theme block overrides only what differs.

| Token | Meaning |
| --- | --- |
| `--surface-bg` | card background, **space-separated RGB triplet** |
| `--surface-alpha` | card background opacity |
| `--surface-border` | card border colour, RGB triplet |
| `--surface-border-alpha` | card border opacity |
| `--accent` | brand accent, RGB triplet |
| `--accent-2` | secondary accent (used by the festival skin) |
| `--page-from`, `--page-via`, `--page-to` | the page background gradient stops |
| `--page-sun` | `1` shows the sunrise glow, `0` hides it |

Colours are stored as `255 159 69`, not `#FF9F45`, so components can compose
alpha with `rgb(var(--accent) / 0.7)`. Keep that format.

Consumers:

- `.surface` in `@layer components` builds every card from `--surface-*`
- `LiveBackground.svelte` builds the gradient from `--page-*` and the sun glow
  from `--page-sun`
- `.chat-orb` tints itself from `--accent`

Some skins add their own scoped tokens — `--aurora-b1…b4` and `--aurora-bg` for
the animated mesh, `--fest-banner-from/-to`, `--fest-ink` and `--fest-pos` for
festival banners. Skins also keep shared class strings next to themselves
(`skins/aurora/glass.ts`, `skins/festival/fest.ts`) rather than repeating long
Tailwind chains.

## Tailwind side

`tailwind.config.ts`:

- `darkMode: 'class'` — **required**, the toggle is manual, not media-driven
- `content: ['./src/**/*.{html,js,svelte,ts}']`
- `brand` ramp built around the portal accent `#F27A1A`, plus `gold`, `navy`,
  `ink`, `success`, `info`, `danger`, `warning`
- fonts: `sans` Inter, `hand` Kalam, `serif` Playfair Display (the heritage
  themes' headings)
- keyframes and animations: `sunrise`, `floatUp`, `ripple`, `pulseDot`,
  `marquee`, `aurora`

> Tailwind scans your source for class names, and it cannot tell code from prose.
> A comment mentioning "the container" is enough to make Tailwind emit a
> `.container` utility nobody uses. Harmless, but it is why the generated CSS can
> shrink when comments are removed.

## Adding a theme (new palette, existing layout)

Five files, and the fifth is the one people forget.

1. **`src/lib/themes.ts`** — append to `THEMES`:

   ```ts
   {
     id: 'my-theme',
     labelKey: 'theme_my_theme',
     mode: 'dark',
     originKey: 'theme_origin_new',
     swatch: ['#0a0f1e', '#141b30', '#7c5cff']   // [bg, surface, accent]
   }
   ```

2. **`src/app.css`** — add the vars block, overriding only what changes:

   ```css
   [data-theme='my-theme'] {
     --surface-bg: 20 27 48;
     --surface-alpha: 0.55;
     --accent: 124 92 255;
     --page-from: #0a0f1e;
     --page-via: #0d1430;
     --page-to: #131a3a;
     --page-sun: 0;
   }
   ```

3. **`src/lib/skins/skinMap.ts`** — map it to a skin:

   ```ts
   'my-theme': 'aurora',
   ```

   Without this the theme silently falls back to `DEFAULT_SKIN_ID` (`premium`).

4. **`src/lib/i18n.ts`** — add `theme_my_theme` and, if it is a new grouping,
   `theme_origin_*`, in both `en` and `hi`.

5. **`src/app.html`** — add the id to the `LIGHT` or `DARK` map in the no-flash
   script. This duplicates the theme list on purpose: the script runs before
   Svelte loads so the saved theme applies before first paint. Miss this step and
   the theme still works, but a returning visitor gets a flash of the wrong
   palette on every load. `themes.ts` and `app.html` must stay in step.

## Adding a skin (new layout)

1. Create `src/lib/skins/<id>/` with `Shell.svelte` and `pages/` containing all
   eight page components.
2. Export the bundle from `src/lib/skins/<id>/index.ts`:

   ```ts
   import type { Skin } from '../types';
   import Shell from './Shell.svelte';
   import Home from './pages/Home.svelte';
   // …the other seven

   export const mySkin: Skin = {
     id: 'my-skin',
     Shell,
     pages: { Home, Expenses, Loans, Committee, Downloads, Decade, Donate, Verify }
   };
   ```

3. Add the id to the `SkinId` union in `skinMap.ts`.
4. Register the bundle in the `SKINS` record in `registry.ts`.
5. Point at least one theme at it via `THEME_SKIN_ID`.

`SkinId` is a union type, so steps 3 and 4 fail the type-check if you do one and
forget the other. That is intentional.

## How a theme gets chosen

- The palette icon in the header opens the gallery; tapping a card applies the
  theme immediately and persists it.
- Returning visitor with a saved, still-valid theme → that theme.
- First visit, device prefers dark → `warm-night`; prefers light → `sunrise`.
- First visit, no signal from the device → a random pick between those two.

`pickDefaultTheme(prefersDark, rnd)` in `themes.ts` is pure and takes its random
number as an argument, so this is testable.

Persistence keys in `localStorage`:

| Key | Holds |
| --- | --- |
| `cpm_public_v5_theme` | the selected theme id |
| `cpm_public_lang` | `en` or `hi` |

An unrecognised saved id is ignored rather than trusted — `isValidThemeId` gates
it — so removing a theme cannot leave visitors stuck on a broken palette.

## Checks

```bash
npm run check   # svelte-check; catches a missing SkinId or page
npm test        # unit tests for the pure data layer
npm run build   # static build
```
