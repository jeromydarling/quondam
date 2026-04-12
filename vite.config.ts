/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GH Pages serves the site at https://<user>.github.io/quondam/, so the
// production build must use /quondam/ as the public base. In dev we keep
// the root so localhost:5173/ still works.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/quondam/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
}));
