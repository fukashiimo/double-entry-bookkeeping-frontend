import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/double-entry-bookkeeping/',
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  optimizeDeps: {
    include: ['@mantine/core', '@mantine/hooks', '@mantine/charts']
  }
})