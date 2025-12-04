import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// List of dependencies to externalize
const externalDeps = [
  'emoji-picker-react',
  'remark-math',
  'rehype-katex',
  'katex',
  'react-markdown',
  'react-syntax-highlighter'
]

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: []
      }
    })
  ],
  // Use /e-folio/ for GitHub Pages, / for other deployments
  base: process.env.GITHUB_PAGES === 'true' ? '/e-folio/' : '/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      external: (id) => {
        // Externalize node_modules and the listed dependencies
        return externalDeps.some(dep => id === dep || id.startsWith(`${dep}/`)) ||
               /^[^./]/.test(id) && !id.startsWith('@/');
      },
      output: {
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
  publicDir: 'public',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
  ,
  resolve: {
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  }
})



