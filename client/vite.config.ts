import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext'
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  preview: {
    port: parseInt(process.env.PORT || '4173'),
    host: '0.0.0.0'
  }
})
