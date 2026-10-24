import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite only treats .jsx files as JSX by default.
// Because this project keeps components in plain .js files,
// we tell Vite (and its dependency scanner) to read .js files as JSX too.
export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
})
