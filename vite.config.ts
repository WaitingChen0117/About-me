import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Project Pages: https://waitingchen0117.github.io/About-me/
export default defineConfig({
  base: '/About-me/',
  plugins: [react()],
})
