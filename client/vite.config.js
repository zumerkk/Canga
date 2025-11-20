import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  // Define global constants
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  
  plugins: [
    react(),
    // Bundle analyzer - production build'de bundle boyutlarını analiz et
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  // Allow .js files to contain JSX
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  
  // Path aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@contexts': resolve(__dirname, 'src/contexts'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  
  // Build optimizations
  build: {
    // Chunk size uyarı limitini artır
    chunkSizeWarningLimit: 1000,
    
    // Manual chunk splitting - büyük kütüphaneleri ayrı chunk'lara böl
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-utils': ['axios', 'date-fns'],
          
          // App chunks
          'components-layout': [
            './src/components/Layout/Sidebar.js',
            './src/components/Layout/Header.js',
            './src/components/Layout/Layout.js'
          ],
          'components-charts': [
            './src/components/Charts/EmployeeChart.js',
            './src/components/Charts/ShiftChart.js'
          ],
        },
        
        // Chunk dosya isimlendirme
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.js', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        // Asset dosya isimlendirme
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // Minification ayarları
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Production'da console.log'ları kaldır
        drop_debugger: true,
      },
    },
    
    // Source map ayarları
    sourcemap: false, // Production'da source map'leri kaldır
  },
  
  // Development server ayarları
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  
  // Preview server ayarları
  preview: {
    port: 3000,
    open: true,
  },
});