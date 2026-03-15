import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  envDir: '.',
  define: {
    __API_URL__: JSON.stringify(mode === 'production' ? '/api' : 'http://localhost:3001/api'),
  },
}));
