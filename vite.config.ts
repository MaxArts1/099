import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Если вы публикуете на https://<USERNAME>.github.io/<REPO>/
  // раскомментируйте строку ниже и замените <REPO> на название вашего репозитория
  // base: '/vash-repo-name/',
})