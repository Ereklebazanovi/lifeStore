import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // ამოწმებს, არის თუ არა production რეჟიმი (უფრო საიმედოა ვიდრე process.env)
  const isProduction = mode === 'production';

  return {
    plugins: [react(), tailwindcss()],

    // ✅ esbuild სწორ ადგილასაა (გარეთ) და იყენებს isProduction ცვლადს
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },

    build: {
      // minify: 'esbuild', // ეს default-ად ჩართულია, შეგიძლია არ დაწერო
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
            ui: ['lucide-react', 'framer-motion'],
            utils: ['zustand', 'react-router-dom'],
          },
        },
      },
    },

    server: {
      port: 3000,
      open: true,
    },
  };
});

