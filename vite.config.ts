import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEYS': JSON.stringify(process.env.GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEYS || ''),
      'process.env.CEREBRAS_API_KEY': JSON.stringify(process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || ''),
      'process.env.CEREBRAS_MODEL': JSON.stringify(process.env.CEREBRAS_MODEL || 'gpt-oss-120b'),
      'process.env.GROQ_API_KEY': JSON.stringify(process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || ''),
      'process.env.GROQ_MODEL': JSON.stringify(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || ''),
      'process.env.OPENROUTER_API_KEY_1': JSON.stringify(process.env.OPENROUTER_API_KEY_1 || process.env.VITE_OPENROUTER_API_KEY_1 || ''),
      'process.env.OPENROUTER_MODEL': JSON.stringify(process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'),
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'lucide-react', 'motion/react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
