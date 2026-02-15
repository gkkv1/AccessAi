import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: false,
    hmr: {
      clientPort: 443, // Use HTTPS port for HMR when accessing through ngrok
    },
    // Disable host checking to allow ngrok and other proxies
    cors: true,
    allowedHosts: ['all'], // Allow all hosts (including ngrok URLs)
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
