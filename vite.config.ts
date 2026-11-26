import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://127.0.0.1:3001" },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep large third-party libraries out of the entry chunk so they
        // cache independently and load only with the routes that use them.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("framer-motion")) return "motion";
          if (/node_modules\/(recharts|d3-[^/]+|victory-vendor)\//.test(id)) return "charts";
          if (id.includes("@tanstack")) return "query";
          if (/node_modules\/(zod|react-hook-form|@hookform)\//.test(id)) return "forms";
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "dates";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
