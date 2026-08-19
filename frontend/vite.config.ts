import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Fail with a clear error instead of silently falling back to 5174.
    // The backend's CORS allowlist is pinned to this exact port, so a port
    // change would silently break every request to the API.
    strictPort: true,
  },
})
