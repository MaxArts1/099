import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ИЗМЕНЕНИЕ: Используем относительный путь './'
  // Это позволяет сайту работать на GitHub Pages с ЛЮБЫМ названием репозитория
  base: './',
})