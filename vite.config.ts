import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built app runs from any address (a domain root or a subfolder)
  base: './',
  // `npm run dev` also listens on the local network, so a phone on the same Wi-Fi can open it
  server: { host: true },
})
