<script lang="ts">
  import { page } from '$app/stores';
  import { tr } from '$lib/stores/lang';
  import { NAV_MORE, NAV_MORE_PATHS } from './nav';
  import { MoreHorizontal, X, ChevronRight, Bell } from '@lucide/svelte';
  import { fade, fly } from 'svelte/transition';
  import InstallButton from './InstallButton.svelte';
  import NotificationsView from './NotificationsView.svelte';
  import { unreadCount } from '$lib/stores/notifications';

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node);
      }
    };
  }

  interface Props {
    itemClass?: string;
    activeClass?: string;
    idleClass?: string;
    triggerClass?: string;
    iconBadge?: boolean;
  }
  let {
    itemClass = 'flex-1',
    activeClass = 'text-brand-500',
    idleClass = 'text-slate-500 dark:text-slate-400',
    triggerClass = 'flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition',
    iconBadge = false
  }: Props = $props();

  let open = $state(false);
  const isMoreActive = $derived(NAV_MORE_PATHS.some((h) => $page.url.pathname.startsWith(h)));

  let view = $state<'menu' | 'notifications'>('menu');

  function openSheet() {
    view = 'menu';
    open = true;
  }

  let lastPath = $state($page.url.pathname);
  $effect(() => {
    if ($page.url.pathname !== lastPath) {
      lastPath = $page.url.pathname;
      open = false;
    }
  });

  $effect(() => {
    if (!open) view = 'menu';
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  });

  const isItemActive = (href: string) => $page.url.pathname.startsWith(href);

  let activeTheme = $state('sunrise');
  let isDark = $state(false);
  $effect(() => {
    if (open && typeof document !== 'undefined') {
      const root = document.documentElement;
      activeTheme = root.getAttribute('data-theme') || 'sunrise';
      isDark = root.classList.contains('dark');
    }
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative {itemClass}">
  <button
    type="button"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-label={$tr('nav_more')}
    onclick={() => (open ? (open = false) : openSheet())}
    class="{triggerClass} {open || isMoreActive ? activeClass : idleClass}"
  >
    {#if iconBadge}
      <span class="grid h-9 w-12 place-items-center rounded-xl transition {open || isMoreActive ? 'bg-brand-500/10 dark:bg-brand-500/20' : ''}">
        <MoreHorizontal class="h-5 w-5" aria-hidden="true" />
      </span>
    {:else}
      <MoreHorizontal class="h-5 w-5" aria-hidden="true" />
    {/if}
    {$tr('nav_more')}
  </button>
</div>

{#if open}
  <div
    use:portal
    data-theme={activeTheme}
    class:dark={isDark}
    class="fixed inset-0 z-[100] md:hidden"
    role="dialog"
    aria-modal="true"
    aria-label={$tr('nav_more')}
  >
    <button
      type="button"
      class="absolute inset-0 h-full w-full cursor-default bg-black/60 backdrop-blur-sm"
      aria-label="Close menu"
      tabindex="-1"
      onclick={() => (open = false)}
      transition:fade={{ duration: 180 }}
    ></button>

    <div
      class="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-black/10 text-slate-700 shadow-2xl dark:border-white/10 dark:text-slate-200"
      style="
        background-color: var(--page-to, var(--page-from));
        background-image: linear-gradient(rgb(var(--surface-bg) / var(--surface-alpha, 1)), rgb(var(--surface-bg) / var(--surface-alpha, 1)));
        padding-bottom: env(safe-area-inset-bottom);
      "
      transition:fly={{ y: 340, duration: 260 }}
    >
      <div class="flex justify-center pt-2.5">
        <span class="h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20"></span>
      </div>
      <div class="flex items-center justify-between px-5 pb-2 pt-2.5">
        <h2 class="text-base font-black text-slate-900 dark:text-white">
          {view === 'menu' ? $tr('nav_more') : ''}
        </h2>
        <button
          type="button"
          onclick={() => (open = false)}
          aria-label="Close"
          class="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {#if view === 'menu'}
        <div class="flex items-center gap-2 border-b border-black/10 px-5 pb-3 dark:border-white/10">
          <InstallButton />
          <button
            type="button"
            onclick={() => (view = 'notifications')}
            aria-label={$tr('notif_title')}
            title={$tr('notif_title')}
            class="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition active:scale-95"
            style="background: rgb(var(--accent) / 0.16); color: rgb(var(--accent));"
          >
            <Bell class="h-5 w-5" aria-hidden="true" />
            {#if $unreadCount > 0}
              <span
                class="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-black text-white"
                style="background: rgb(var(--accent));"
              >
                {$unreadCount > 9 ? '9+' : $unreadCount}
              </span>
            {/if}
          </button>
        </div>
        <nav class="px-2 pb-3">
          {#each NAV_MORE as item}
            {@const Icon = item.icon}
            {@const active = isItemActive(item.href)}
            <a
              href={item.href}
              aria-current={active ? 'page' : undefined}
              onclick={() => (open = false)}
              class="flex items-center gap-3.5 rounded-xl px-3 py-3.5 text-[15px] font-semibold transition
                {active ? '' : 'text-slate-800 hover:bg-black/[0.05] dark:text-slate-100 dark:hover:bg-white/5'}"
              style={active
                ? 'color: rgb(var(--accent)); background: rgb(var(--accent) / 0.12);'
                : ''}
            >
              <span
                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style="background: rgb(var(--accent) / 0.16); color: rgb(var(--accent));"
              >
                <Icon class="h-5 w-5" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1">{$tr(item.key)}</span>
              <ChevronRight class="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            </a>
          {/each}
        </nav>
      {:else}
        <NotificationsView onback={() => (view = 'menu')} onclose={() => (open = false)} />
      {/if}
    </div>
  </div>
{/if}
