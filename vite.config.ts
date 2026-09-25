import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const BUILD_ID = 'build_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
const BUILD_TIME = new Date().toISOString();

function generateVersionJsonPlugin() {
  return {
    name: 'generate-version-json',
    buildStart() {
      const publicDir = path.resolve(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const versionData = {
        buildId: BUILD_ID,
        version: '2.6.0',
        builtAt: BUILD_TIME
      };
      fs.writeFileSync(
        path.resolve(publicDir, 'version.json'),
        JSON.stringify(versionData, null, 2),
        'utf-8'
      );
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateVersionJsonPlugin()],
  define: {
    __APP_BUILD_ID__: JSON.stringify(BUILD_ID),
    __APP_BUILD_TIME__: JSON.stringify(BUILD_TIME)
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti') || id.includes('tailwind-merge') || id.includes('clsx')) {
              return 'vendor-utils';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
