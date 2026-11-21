import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const full = mode === "full";
  const proxy = { "/api": "http://127.0.0.1:8787" };
  return {
    plugins: [react()],
    base: "./",
    resolve: {
      alias: {
        "#playground": fileURLToPath(
          new URL(full ? "./src/FullApp.tsx" : "./src/App.tsx", import.meta.url),
        ),
      },
    },
    ...(full && {
      server: { proxy },
      preview: { proxy },
      build: { outDir: "../../.tools/full-web", emptyOutDir: true },
    }),
  };
});
