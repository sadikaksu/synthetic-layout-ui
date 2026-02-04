import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/synthetic-layout-ui/',
  plugins: [react()],
})
