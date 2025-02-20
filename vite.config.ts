import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/deepseek': {
        target: 'https://api.deepseek.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/deepseek/, '/v1/chat/completions'),
        secure: true,
        headers: {
          'Accept': 'application/json'
        }
      }
    }
  }
});
