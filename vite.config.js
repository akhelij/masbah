import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
        cleanupOutdatedCaches: false,
      },
      manifest : {
        name: "Pissina",
        short_name: "Pissina",
        description: "1er site de location de piscines entre particulier au Maroc",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        id: "/?source=pwa",
        start_url: "/?source=pwa",
        scope: "/",
        icons: [
          {
            src: "/icon_x144.png", // Replace with the actual path to your app's icon
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "/icon_x192.png", // Replace with the actual path to your app's icon
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon_x384.png", // Replace with the actual path to your app's icon
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/icon_x512.png", // Replace with the actual path to your app's icon
            sizes: "512x512",
            type: "image/png",
            purpose: 'any'
          },
          {
            src: '/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
          // Add more icons as needed
        ],
      }
    })
  ],
  resolve: {
      alias: {
      '@': path.resolve(__dirname, '/src'),
    },
  },  
})
