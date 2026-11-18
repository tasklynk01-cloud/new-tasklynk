#!/bin/bash
# Cloudflare Pages Build Script
# This script ensures proper build setup for Cloudflare Pages deployment

echo "🚀 Starting Cloudflare Pages build..."

# Update lockfile if needed (Cloudflare uses bun)
echo "📦 Updating dependencies lockfile..."
bun install

# Build the Next.js application for Cloudflare Pages
echo "🔨 Building Next.js application for Cloudflare..."
NODE_ENV=production npx @cloudflare/next-on-pages

echo "✅ Build completed successfully!"
echo "📦 Output directory: .vercel/output/static"
