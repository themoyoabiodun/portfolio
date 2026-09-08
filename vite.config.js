import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Served from the themoyoabiodun.com custom domain at the root.
  base: "/",
  plugins: [react(), tailwindcss()],
});
