import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@recall/graphite': resolve(__dirname, '../../packages/graphite/src'),
      '@recall/prose': resolve(__dirname, '../../packages/prose/src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        prose: resolve(__dirname, 'prose.html'),
      },
    },
  },
})
