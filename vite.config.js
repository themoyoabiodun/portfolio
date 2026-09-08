import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Served from https://themoyoabiodun.github.io/portfolio/ — only nest
  // under the repo name for the production build, so local dev stays at "/".
  base: command === "build" ? "/portfolio/" : "/",
  plugins: [react(), tailwindcss()],
}));
