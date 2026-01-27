import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Production build optimizations
  build: {
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    
    // Code splitting for better loading performance
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'blockchain-vendor': ['wagmi', 'viem', '@coinbase/onchainkit', '@tanstack/react-query'],
        }
      },
      // Suppress pure annotation warnings
      onwarn(warning, warn) {
        // Ignore pure annotation warnings from ox library
        if (warning.code === 'INVALID_ANNOTATION' && warning.message.includes('/*#__PURE__*/')) {
          return;
        }
        warn(warning);
      }
    },
    
    // Increase chunk size warning limit to 2MB (blockchain libraries are large)
    chunkSizeWarningLimit: 2000,
    
    // Source maps for production debugging (optional)
    sourcemap: false,
  },
  
  // Development server configuration
  server: {
    port: 3000,
    // Note: COOP/COEP headers removed to allow Coinbase Wallet SDK and Base Account SDK to work
    // These SDKs require COOP to NOT be 'same-origin'
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    // Note: COOP/COEP headers removed to allow Coinbase Wallet SDK and Base Account SDK to work
  },
  
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
