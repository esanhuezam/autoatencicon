import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/nomade-kafe/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 10000,
  }
})
