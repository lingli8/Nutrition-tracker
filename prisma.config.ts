import { defineConfig } from "@prisma/client/generator-helper"

export default defineConfig({
  generator: {
    name: "client",
    provider: "prisma-client-js",
  },
  seed: "tsx lib/db-seed.ts",
})
