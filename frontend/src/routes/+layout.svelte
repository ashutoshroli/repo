<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { initPortal } from '$lib/stores/portal';
  import { config } from '$lib/config';
  import { activeSkin } from '$lib/stores/skin';
  import { themeGalleryOpen, closeThemeGallery } from '$lib/stores/ui';
  import Chatbot from '$lib/components/Chatbot.svelte';
  import AnnouncementPopup from '$lib/components/AnnouncementPopup.svelte';
  import ThemeGallery from '$lib/components/ThemeGallery.svelte';
  import { pwaInfo } from 'virtual:pwa-info';
  import { listenForSubscriptionChange } from '$lib/push';
  import { initInbox } from '$lib/stores/notifications';
  import { startSync } from '$lib/sync';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { children } = $props();

  let Shell = $derived($activeSkin.Shell);

  let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

  $effect(() => {
    if (!browser) return;
    const rec = $page.url.searchParams.get('record');
    if (rec && $page.url.pathname !== '/verify') {
      void goto(`/verify?record=${encodeURIComponent(rec)}`, { replaceState: true });
    }
  });

  onMount(() => {
    initPortal();
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
    const stopSync = startSync();
    const stopPushListener = listenForSubscriptionChange();
    const stopInbox = initInbox();
    return () => {
      stopSync();
      stopPushListener();
      stopInbox();
    };
  });
</script>

<svelte:head>
  <link rel="canonical" href={config.siteUrl} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags — trusted build-time string -->
  {@html webManifestLink}
</svelte:head>

{#key $activeSkin.id}
  <div in:fade={{ duration: 220 }}>
    <Shell>
      {@render children()}
    </Shell>
  </div>
{/key}

<Chatbot />
<AnnouncementPopup />
<ThemeGallery open={$themeGalleryOpen} onclose={closeThemeGallery} />
