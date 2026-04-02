import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
    ],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/generated/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/__tests__/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
