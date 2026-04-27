import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cloudflare plugin - uncomment when deploying to Cloudflare
// import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})