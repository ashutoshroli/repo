<script lang="ts">
  import { Download, Check, Info } from '@lucide/svelte';
  import { tr } from '$lib/stores/lang';
  import { canPrompt, installed, promptInstall } from '$lib/stores/install';

  let busy = $state(false);
  let showHint = $state(false);

  $effect(() => {
    if ($canPrompt) showHint = false;
  });

  async function install() {
    if (busy) return;
    if (!$canPrompt) {
      showHint = true;
      return;
    }
    busy = true;
    try {
      if ((await promptInstall()) !== 'accepted') showHint = true;
    } finally {
      busy = false;
    }
  }
</script>

{#if $installed}
  <span class="inline-flex items-center gap-2 rounded-lg bg-success/15 px-4 py-2 text-sm font-bold text-success">
    <Check class="h-4 w-4" aria-hidden="true" />
    {$tr('guide_install_installed')}
  </span>
{:else}
  <button
    type="button"
    onclick={install}
    disabled={busy}
    class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 active:scale-95 disabled:opacity-60"
  >
    <Download class="h-4 w-4" aria-hidden="true" />
    {busy ? $tr('guide_install_busy') : $tr('guide_install_btn')}
  </button>

  {#if showHint}
    <p class="mt-2 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
      <span>{$tr('guide_install_manual_hint')}</span>
    </p>
  {/if}
{/if}
