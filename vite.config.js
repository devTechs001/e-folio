import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  const isGitHubPages = env.GITHUB_PAGES === 'true'
  // VITE_API_URL normally ends in /api. A proxy target must be the origin,
  // otherwise /api/foo becomes /api/api/foo. With no env (live preview) the
  // backend origin is the local Express port; the dev server proxies it.
  const configuredApi = env.VITE_API_URL || ''
  const backendTarget = (configuredApi.replace(/\/api\/?$/, '') || 'http://localhost:5000')
  
  return {
    plugins: [
      react({
        fastRefresh: true,
        babel: {
          plugins: []
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // The service worker used to precache 2289 files (~20 MB), mostly
          // 2155 FontAwesome SVGs and multi-megabyte demo images. That made
          // first install and every update visibly slow. Precache the app
          // shell only and cache the heavy assets lazily at runtime.
          globIgnores: [
            '**/assets/fontawesome/**',
            '**/assets/images/**',
            '**/dash.all.min*',
            '**/hls*',
            '**/*.map'
          ],
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /\/assets\/(images|fontawesome)\//i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-media-cache',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        manifest: {
          name: 'E-Folio Pro - Advanced Portfolio Platform',
          short_name: 'E-Folio',
          description: 'Modern portfolio platform with AI assistance, real-time chat, and advanced analytics.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          scope: isGitHubPages ? '/e-folio/' : '/',
          start_url: isGitHubPages ? '/e-folio/' : '/',
          icons: [
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        }
      })
    ],
    
    // Base URL configuration
    // Netlify serves from root, GitHub Pages from /e-folio/
    base: env.GITHUB_PAGES === 'true' ? '/e-folio/' : '/',
  
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
      // `terser` was configured but never declared in package.json, so every
      // production build failed with "terser not found". Vite's built-in
      // esbuild minifier needs no extra dependency and is considerably faster.
      minify: 'esbuild',
      sourcemap: false,  // Disable source maps in production for security
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['chart.js', 'react-chartjs-2', 'recharts'],
            animation: ['framer-motion', 'aos'],
            editor: ['ace-builds', 'react-ace'],
            icons: ['react-icons'],
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
    
    // Strip console/debugger calls in production builds without a plugin.
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },

    // Server configuration
    server: {
      port: 5173,
      strictPort: false,
      open: false,
      host: true,
      cors: true,
      // Permit the Arena live-preview host as well as local development.
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/socket.io': { target: backendTarget, changeOrigin: true, ws: true },
        '/uploads': { target: backendTarget, changeOrigin: true },
        '/portfolios': { target: backendTarget, changeOrigin: true }
      }
    },

    preview: {
      host: true,
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
    },
    
    publicDir: 'public',
    
    // Optimize dependencies
    optimizeDeps: {
      // Pre-bundle the heavy shared libraries at server start instead of
      // discovering them on the first page request (which forced a reload).
      include: [
        'react', 'react-dom', 'react-router-dom',
        'framer-motion', 'lucide-react', 'aos',
        'socket.io-client', 'qrcode', 'html2canvas',
        'chart.js', 'react-chartjs-2', 'recharts'
      ]
    },
    
    // Define global variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.GITHUB_PAGES': JSON.stringify(env.GITHUB_PAGES || 'false')
    }
  }
})