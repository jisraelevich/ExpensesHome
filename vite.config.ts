import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer TypeScript sources over stale compiled .js copies sitting next to them
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
})
