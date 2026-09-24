import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // The /sites/ pages import browser/stylus/sites/*.user.css raw — the shipped
  // files, one directory above the simulator root.
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts']
  }
});
