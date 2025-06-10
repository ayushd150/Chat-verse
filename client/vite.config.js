// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Prevent server-only modules from being bundled
      'jsonwebtoken': false,
      'crypto': false,
      'buffer': 'buffer'
    }
  },
  optimizeDeps: {
    exclude: ['jsonwebtoken'] // Exclude from optimization
  }
})