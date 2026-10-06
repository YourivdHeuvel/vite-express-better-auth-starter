import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // Must match BETTER_AUTH_URL, so fail instead of silently picking another port.
      port: Number(env.CLIENT_PORT ?? 5173),
      strictPort: true,
      proxy: {
        '/api': `http://localhost:${env.PORT ?? 3000}`,
      },
    },
  }
})
