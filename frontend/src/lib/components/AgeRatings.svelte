<script lang="ts">
  import { BadgeCheck, Info } from '@lucide/svelte';
  import { tr } from '$lib/stores/lang';
  import { AGE_RATINGS, IARC_RATING_ID, IARC_VERSION, sourceKey } from '$lib/ratings';

  let extra = $derived([
    { label: $tr('rating_id_label'), value: IARC_RATING_ID, mono: true },
    { label: $tr('rating_type_label'), value: $tr('rating_type_iarc'), mono: false },
    { label: $tr('rating_version_label'), value: IARC_VERSION, mono: false }
  ]);
</script>

<section class="surface mt-8 p-5">
  <h2 class="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
    <BadgeCheck class="h-5 w-5" style="color: rgb(var(--accent));" aria-hidden="true" />
    {$tr('guide_ratings_h')}
  </h2>
  <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{$tr('guide_ratings_p')}</p>

  <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {#each AGE_RATINGS as r (r.id)}
      <div class="flex gap-3 rounded-xl border border-black/10 p-3 dark:border-white/10">
        <span
          class="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-black leading-none"
          style="background: rgb(var(--accent) / 0.14); color: rgb(var(--accent)); border: 1px solid rgb(var(--accent) / 0.35);"
          aria-hidden="true"
        >
          {r.mark}
        </span>
        <div class="min-w-0">
          <h3 class="truncate text-sm font-black text-slate-900 dark:text-white">
            {r.system}
            <span class="sr-only"> — {$tr(r.descKey)}</span>
          </h3>
          <p class="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{$tr(r.bodyKey)}</p>
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{$tr(r.regionKey)}</p>
          <p class="mt-1 text-xs font-bold" style="color: rgb(var(--accent));">{$tr(r.descKey)}</p>
          <p class="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {$tr('rating_col_source')}: {$tr(sourceKey(r.source))}
          </p>
        </div>
      </div>
    {/each}
  </div>

  <h3
    class="mt-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400"
  >
    <Info class="h-4 w-4" style="color: rgb(var(--accent));" aria-hidden="true" />
    {$tr('guide_ratings_extra_h')}
  </h3>
  <dl
    class="mt-2 divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10"
  >
    {#each extra as row}
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2">
        <dt class="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.label}</dt>
        <dd
          class="min-w-0 break-all text-right text-xs font-bold text-slate-800 dark:text-slate-100 {row.mono
            ? 'font-mono'
            : ''}"
        >
          {row.value}
        </dd>
      </div>
    {/each}
  </dl>

  <p class="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{$tr('guide_ratings_note')}</p>
</section>
