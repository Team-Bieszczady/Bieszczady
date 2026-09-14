import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // devtools() MUST come first: it injects source before @vitejs/plugin-react transforms
  // the code, and it is what strips <TanStackDevtools> out of the production build.
  plugins: [devtools(), react(), tailwindcss()],
  server: {
    port: 5173,
    // Fail with a clear error instead of silently falling back to 5174.
    // The backend's CORS allowlist is pinned to this exact port, so a port
    // change would silently break every request to the API.
    strictPort: true,
  },
})
