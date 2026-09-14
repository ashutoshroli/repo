/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import { IARC_RATING_ID } from './src/lib/ratings';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        iarc_rating_id: IARC_RATING_ID,
        name: 'Navyuvak Chhath Puja Samiti',
        short_name: 'Chhath Puja',
        description:
          'Navyuvak Chhath Puja Samiti, Shaharpura — a read-only public transparency portal: every contribution, expense, loan and committee record, live and accountable. Faith • Unity • Transparency.',
        lang: 'en',
        dir: 'ltr',
        categories: ['finance', 'social', 'utilities'],
        theme_color: '#F27A1A',
        background_color: '#0b1020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        display_override: ['standalone', 'minimal-ui'],
        launch_handler: { client_mode: 'navigate-existing' },
        prefer_related_applications: false,
        related_applications: [],
        edge_side_panel: { preferred_width: 400 },
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        screenshots: [
          {
            src: '/screenshots/wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Navyuvak Chhath Puja Samiti — transparency portal'
          },
          {
            src: '/screenshots/narrow.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Navyuvak Chhath Puja Samiti — transparency portal'
          }
        ],
        shortcuts: [
          { name: 'Expenses', short_name: 'Expenses', description: 'View expense records', url: '/expenses' },
          { name: 'Loans', short_name: 'Loans', description: 'View surplus loans and guarantors', url: '/loans' },
          { name: 'Committee', short_name: 'Committee', description: 'View the committee members', url: '/committee' },
          { name: 'Downloads', short_name: 'Downloads', description: 'Find receipts and certificates', url: '/downloads' },
          { name: 'Donate Now', short_name: 'Donate', description: 'How to contribute', url: '/donate' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,woff2}'],
        importScripts: ['/push-sw.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              /(^|\.)workers\.dev$/.test(url.host) ||
              url.host === 'chhath-public-worker.shaharpura.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'chhath-api',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            urlPattern: ({ url }) => /fonts\.(googleapis|gstatic)\.com/.test(url.host),
            handler: 'CacheFirst',
            options: {
              cacheName: 'chhath-fonts',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});
