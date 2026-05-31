import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // 使用相对路径
    assetsDir: 'assets',
    emptyOutDir: true,
    // 使用相对路径引用
    assetsInlineLimit: 0
  },
  server: {
    port: 5173,
    // 允许加载 JSX 文件
    headers: {
      'Content-Type': 'application/javascript',
    },
  },
  // 确保使用相对路径
  base: './'
})
