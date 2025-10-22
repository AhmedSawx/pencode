import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tsconfigPaths from 'vite-tsconfig-paths';

import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'vue-codemirror',
      'codemirror',
      '@codemirror/lang-javascript',
      '@codemirror/theme-one-dark',
      '@codemirror/lint',
      '@codemirror/autocomplete',
    ],
  },
  plugins: [vue(), tsconfigPaths(), tailwindcss()],
});
