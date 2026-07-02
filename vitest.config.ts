import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      ".build/**",
      // Reference source-app checkouts live beside the template but are not part
      // of it; never scan their tests (they have their own toolchains).
      "yaptask/**",
      "tmplt/**",
      "dotdot/**",
    ],
  },
});
