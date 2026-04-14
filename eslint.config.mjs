import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
      "lib/database.types.ts",
      "components/ui/**",
      "tests/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

