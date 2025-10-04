import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
  resolve: {
    alias: {
      // FIX: `__dirname` is not available in ES modules. Replaced with an equivalent using `import.meta.url` to ensure the path alias works correctly.
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './'),
    },
  },
})
