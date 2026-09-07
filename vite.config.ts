import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    reportCompressedSize: false,
  },
  server: {
    // Listen on all interfaces so the tunnel can reach the dev server.
    host: true,
    /*
     * Cloudflare Quick Tunnels mint a fresh random `*.trycloudflare.com`
     * hostname on every restart, so pinning the current one would break on the
     * next run. A leading-dot entry matches the whole suffix.
     *
     * Deliberately not `allowedHosts: true` — that disables host checking
     * entirely and reopens the DNS-rebinding hole this check exists to close.
     */
    allowedHosts: ['.trycloudflare.com'],
  },
  preview: {
    host: true,
    allowedHosts: ['.trycloudflare.com'],
  },
})
