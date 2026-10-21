import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      // SvelteKit 3: configuration is passed directly to the Vite plugin
      adapter: adapter({
        runtime: 'nodejs22.x'
      }),
      compilerOptions: {
        // Enable runes mode for all project files (not node_modules)
        runes: ({ filename }: { filename: string }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      }
    })
  ],
  server: {
    port: 5173
  }
});
