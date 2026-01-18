import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    watch: !process.env.CI,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});


