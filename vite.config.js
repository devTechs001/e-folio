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
    base: mode === 'development' ? '/' : (env.GITHUB_PAGES === 'true' ? '/e-folio/' : '/'),
  
    // Resolve configuration
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
        // Remove these - they cause issues:
        // react: path.resolve(__dirname, 'node_modules/react'),
        // 'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
      }
    },
    
    // Build configuration
    build: {
      modulePreload: { polyfill: false },
      target: 'esnext',
      minify: mode === 'production' ? 'terser' : false,
      sourcemap: mode !== 'production',
      assetsDir: 'assets',
      rollupOptions: {
        // REMOVE or FIX the external function - it's breaking your build
        // external: (id) => {
        //   // This is externalizing ALL node_modules
        //   return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`)) ||
        //         (/^[^./]/.test(id) && !id.startsWith('@/'));
        // },
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor'
              }
              if (id.includes('axios') || id.includes('date-fns') || id.includes('framer-motion')) {
                return 'utility-vendor'
              }
              return 'other-vendor'
            }
          },
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
      port: 3000,
      strictPort: true,
      open: true,
      host: true,
      cors: true
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