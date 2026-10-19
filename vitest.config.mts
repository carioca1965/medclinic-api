import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      // Recorte: somente a camada de regra de negocio (arquivos *.service.ts).
      include: ["src/**/*.service.ts"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});
