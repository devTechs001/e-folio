import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react({
        fastRefresh: true,
        babel: {
          plugins: []
        }
      })
    ],
    
    // Base URL configuration
    // Netlify serves from root, GitHub Pages from /e-folio/
    base: process.env.NODE_ENV === 'production' ? '/e-folio/' : '/',
  
    // Resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    
    // Build configuration
    build: {
      modulePreload: { polyfill: false },
      target: 'esnext',
      minify: 'terser',  // Always use terser for better minification
      terserOptions: {
        compress: {
          drop_console: true,  // Remove console logs
          drop_debugger: true,  // Remove debugger statements
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error', 'console.trace']  // Remove specific console calls
        },
        mangle: {
          toplevel: true,  // Mangle top-level names
          keep_classnames: false,  // Don't preserve class names
          keep_fnames: false  // Don't preserve function names
        },
        format: {
          comments: false,  // Remove comments
          ascii_only: true  // Use only ASCII characters
        }
      },
      sourcemap: false,  // Disable source maps in production for security
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: undefined,  // Single bundle is harder to analyze
          inlineDynamicImports: true,  // Inline all imports
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const extType = info[info.length - 1].toLowerCase()
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/ttf|otf|woff2?/i.test(extType)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            if (/css/i.test(extType)) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      }
    },
    
    // Server configuration
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      host: true,
      cors: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    
    publicDir: 'public',
    
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    },
    
    // Define global variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.GITHUB_PAGES': JSON.stringify(env.GITHUB_PAGES || 'false')
    }
  }
})