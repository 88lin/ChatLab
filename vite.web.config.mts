/**
 * Web 版 Vite 构建配置
 *
 * 用于构建 CLI serve Web 的 SPA 前端（不含 Electron 依赖）。
 * 输出到 dist-web/，由 chatlab serve 托管。
 *
 * 与 Electron renderer 构建的关键区别：
 * - __IS_ELECTRON__ = false（使用 FetchAdapter 而非 window.chatApi）
 * - 不包含 electron/preload 和 electron/main
 * - 输出目录独立（dist-web/ vs out/renderer/）
 */

import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  root: 'src/',
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/'),
      '~': resolve(__dirname, 'src/'),
      '@openchatlab': resolve(__dirname, 'packages'),
      '@electron/shared': resolve(__dirname, 'electron/shared'),
      '@electron/preload': resolve(__dirname, 'electron/preload'),
    },
  },
  define: {
    __IS_ELECTRON__: JSON.stringify(false),
    __IS_BROWSER_STANDALONE__: JSON.stringify(false),
  },
  plugins: [
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'pink',
          neutral: 'zinc',
        },
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts-wordcloud')) return 'vendor-echarts-wordcloud'
          if (id.includes('node_modules/zrender')) return 'vendor-zrender'
          if (id.includes('node_modules/echarts')) return 'vendor-echarts'
          if (id.includes('node_modules/@nuxt/ui')) return 'vendor-nuxt-ui'
          if (id.includes('node_modules/reka-ui')) return 'vendor-reka-ui'
          if (id.includes('node_modules/@zumer/snapdom')) return 'vendor-snapdom'
          return undefined
        },
      },
    },
  },
  server: {
    port: 3401,
    proxy: {
      '/_web': 'http://localhost:3400',
      '/api': 'http://localhost:3400',
    },
  },
})
