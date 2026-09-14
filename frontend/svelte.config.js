import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '200.html',
      precompress: false,
      strict: false
    }),
    alias: {
      $lib: './src/lib'
    },
    prerender: {
      handleHttpError: ({ status, path, message }) => {
        if (status === 404) return;
        throw new Error(message + ` (${path})`);
      }
    }
  }
};

export default config;
