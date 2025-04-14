import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/e-folio/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
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
})



