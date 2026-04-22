import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RecallProse',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'vue',
        '@tiptap/vue-3',
        '@tiptap/core',
        '@tiptap/pm',
        '@tiptap/starter-kit',
        '@tiptap/extension-underline',
        '@tiptap/extension-text-align',
        '@tiptap/extension-highlight',
        '@tiptap/extension-text-style',
        '@tiptap/extension-color',
        '@tiptap/extension-link',
        '@tiptap/extension-image',
        '@tiptap/extension-table',
        '@tiptap/extension-table-row',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        '@tiptap/extension-task-list',
        '@tiptap/extension-task-item',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-bubble-menu',
        '@tiptap/suggestion',
        'tippy.js'
      ],
      output: {
        globals: {
          vue: 'Vue'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name || ''
        }
      }
    }
  }
})
