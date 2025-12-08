import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Настройка для GitHub Pages. 
  // Предполагается, что ваш репозиторий называется 'sochi-ac'
  base: '/sochi-ac/',
})