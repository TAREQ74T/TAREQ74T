import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function gitOutput(command: string): string | null {
  try {
    return execSync(command, {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim()
  } catch {
    return null
  }
}

const buildHash = gitOutput('git rev-parse --short HEAD') ?? 'unknown'
const buildDirty =
  (gitOutput('git status --porcelain --untracked-files=no') ?? '') !== ''

export default defineConfig({
  define: {
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
    'import.meta.env.VITE_BUILD_DIRTY': JSON.stringify(
      buildDirty ? 'true' : 'false',
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'app-icon.svg'],
      manifest: {
        name: 'مصحف الهدى',
        short_name: 'مصحف الهدى',
        description: 'مصحف الهدى — تطبيق قرآن كريم يعمل دون اتصال',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        theme_color: '#0f3b2e',
        background_color: '#ffffff',
        icons: [
          {
            src: '/app-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ttf,otf,woff,woff2,png,ico,json}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  server: {
    allowedHosts: ['.monkeycode-ai.live']
  }
})
