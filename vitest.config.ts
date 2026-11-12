import { defineConfig } from "vitest/config";

// 계산 규칙(lib/credit)만 자동으로 채점한다. 화면은 직접 확인한다. (DESIGN 8장)
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
