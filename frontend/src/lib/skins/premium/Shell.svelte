<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import LiveBackground from '$lib/components/LiveBackground.svelte';
  import Header from '$lib/components/Header.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import StatusBanner from '$lib/components/StatusBanner.svelte';
  import { openThemeGallery } from '$lib/stores/ui';

  let { children } = $props();

  let stillBg = $state(false);
  onMount(() => {
    if (browser) stillBg = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  });
</script>

<LiveBackground still={stillBg} />

<div class="flex min-h-screen flex-col">
  <Header onThemeClick={() => openThemeGallery()} />
  <StatusBanner />

  <main class="mx-auto w-full max-w-6xl flex-1 px-3 pb-28 pt-3 md:pb-6">
    {@render children()}
  </main>

  <Footer />
</div>

<BottomNav />
