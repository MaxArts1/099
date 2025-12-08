import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Базовый путь должен точно совпадать с названием вашего репозитория на GitHub
  // Для репозитория https://github.com/MaxArts1/sochi-ac он должен быть '/sochi-ac/'
  base: '/sochi-ac/',
})