import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Ensure maplibre-gl is pre-bundled to avoid CommonJS/ESM interop issues
    include: ['maplibre-gl']
  }
});