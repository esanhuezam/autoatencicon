import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/autoatencicon/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 10000,
  }
})
