import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        consent: fileURLToPath(new URL('./oauth/consent/index.html', import.meta.url)),
        welcome: fileURLToPath(new URL('./welcome/index.html', import.meta.url)),
      },
    },
  },
  test: { environment: 'jsdom', clearMocks: true },
})