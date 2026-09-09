import tailwindcss from '@tailwindcss/vite';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import { nitro } from 'nitro/vite';

export default defineConfig({
  plugins: [tailwindcss(), vinext(), nitro()],
});
