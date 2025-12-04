import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import basicSsl from '@vitejs/plugin-basic-ssl'

// List of dependencies to externalize
const externalDeps = [
  'emoji-picker-react',
  'remark-math',
  'rehype-katex',
  'katex',
  'react-markdown',
  'react-syntax-highlighter'
]

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
    }),
    // Enable HTTPS in development
    mode === 'development' && basicSsl()
  ].filter(Boolean),
  
  // Base URL configuration
  base: env.GITHUB_PAGES === 'true' ? '/e-folio/' : '/',
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  
  // Build configuration
  esbuild: {
    jsxInject: `import React from 'react'`,
    minify: mode === 'production',
    sourcemap: mode !== 'production'
  },
  
  // Production build specific settings
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: mode !== 'production',
    assetsDir: 'assets',
    rollupOptions: {
      external: (id) => {
        // Externalize node_modules and the listed dependencies
        return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`)) ||
               /^[^./]/.test(id) && !id.startsWith('@/');
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor: ['axios', 'date-fns', 'framer-motion']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/ttf|woff2?/i.test(extType)) {
            return `assets/fontawesome/fontawesome-icons/webfonts/[name][extname]`
          }
          if (extType === 'css') {
            return `assets/fontawesome/fontawesome-icons/css/[name][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
    },
  },
  // Server configuration
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    https: mode === 'development',
    host: true
  },
  
  publicDir: 'public',
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})



