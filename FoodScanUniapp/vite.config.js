import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  base: './',   // ⭐⭐⭐ 关键：让资源路径改为相对路径（fix H5 在子路径 404）
  plugins: [
    uni(),
  ],
})
