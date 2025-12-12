import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Google GenAI SDK requires process.env.API_KEY to be defined
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})