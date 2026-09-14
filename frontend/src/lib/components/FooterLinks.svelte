<script lang="ts">
  import { tr } from '$lib/stores/lang';
</script>

<nav class="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs" aria-label="Footer">
  <a href="/guide" class="underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100">{$tr('guide_footer_link')}</a>
  <span class="opacity-40" aria-hidden="true">·</span>
  <a href="/privacy" class="underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100">{$tr('footer_privacy')}</a>
  <span class="opacity-40" aria-hidden="true">·</span>
  <a href="/terms" class="underline decoration-dotted underline-offset-2 opacity-80 hover:opacity-100">{$tr('footer_terms')}</a>
</nav>
