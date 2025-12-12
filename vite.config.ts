import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  const apiKey = env.API_KEY || env.VITE_API_KEY || "AIzaSyC9FzUEt9-stjGR-e15uKij_ciqUnZBft8";
  const clientId = env.CLIENT_ID || "406619892352-hj8fduiu6vvji54tqj0v50pm3m18fc03.apps.googleusercontent.com";

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.CLIENT_ID': JSON.stringify(clientId)
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser'
    }
  }
})