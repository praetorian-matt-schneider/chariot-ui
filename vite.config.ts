import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import mkcert from 'vite-plugin-mkcert';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  server: {
    port: 3000,
    https: {
      key: './certs/cert.key', // auto generated using mkcert
      cert: './certs/cert.crt', // auto generated using mkcert
    },
  },
  plugins: [
    react(),
    checker({
      typescript: true,
    }),
    mkcert(),
    tsconfigPaths(),
  ],
  build: {
    outDir: 'build',
  },
});
