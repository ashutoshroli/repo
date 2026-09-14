<script lang="ts">
  interface Props { still?: boolean; }
  let { still = false }: Props = $props();
  const blobs = [
    { v: 'var(--aurora-b1, #7c5cff)', x: '12%', y: '8%', s: 360, d: '0s' },
    { v: 'var(--aurora-b2, #22d3ee)', x: '70%', y: '4%', s: 320, d: '3s' },
    { v: 'var(--aurora-b3, #f472b6)', x: '55%', y: '55%', s: 380, d: '6s' },
    { v: 'var(--aurora-b4, #f59e0b)', x: '5%', y: '60%', s: 300, d: '9s' }
  ];
</script>

<div
  class="pointer-events-none fixed inset-0 -z-10 overflow-hidden aurora-base"
  aria-hidden="true"
>
  {#each blobs as b}
    <div
      class="absolute rounded-full blur-[70px] {still ? '' : 'animate-aurora'}"
      style="left:{b.x}; top:{b.y}; width:{b.s}px; height:{b.s}px; background:{b.v}; opacity:.55; animation-delay:{b.d};"
    ></div>
  {/each}
  <div class="absolute inset-0 aurora-base-overlay"></div>
</div>

<style>
  .aurora-base {
    background: var(--aurora-bg, #0a0f1e);
  }
  .aurora-base-overlay {
    background: color-mix(in srgb, var(--aurora-bg, #0a0f1e) 40%, transparent);
  }
</style>
