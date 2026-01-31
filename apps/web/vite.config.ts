import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [tsconfigPaths(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
    server: {
      port: 3001,
      proxy: {
        "/api": {
          target: env.VITE_CONVEX_SITE_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
