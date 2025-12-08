#!/bin/bash

echo "🚀 Starting multi-platform deployment..."

# Deploy backend to Render
echo "📦 Deploying backend to Render..."
cd server
npm run build
cd ..

# Deploy frontend to all platforms
echo "🎨 Building frontend for all platforms..."

# GitHub Pages
echo "1️⃣ Building for GitHub Pages..."
npm run build
npx gh-pages -d dist

# Netlify
echo "2️⃣ Deploying to Netlify..."
npm run build
npx netlify deploy --prod --dir=dist

# Vercel
echo "3️⃣ Deploying to Vercel..."
npm run build
npx vercel --prod

echo "✅ Deployment complete!"
echo "🌐 GitHub Pages: https://username.github.io/e-folio"
echo "🌐 Netlify: https://your-site.netlify.app"
echo "🌐 Vercel: https://your-site.vercel.app"
echo "🔙 Backend API: https://e-folio-backend-server.onrender.com"