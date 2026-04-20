import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Proxy chỉ dùng khi dev local (không ảnh hưởng production)
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output thư mục dist
    outDir: "dist",
    // Sourcemap tắt ở production
    sourcemap: false,
  },
});
