import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
  {
    // All browser storage goes through src/lib/storage.ts. appDatabase.ts is exempt
    // for now because lab/introduce-repository-seam is restructuring that file.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/storage.ts", "src/data/appDatabase.ts", "src/test/**", "src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "localStorage", message: "Use src/lib/storage.ts instead." }],
      "no-restricted-properties": [
        "error",
        { object: "window", property: "localStorage", message: "Use src/lib/storage.ts instead." },
      ],
    },
  },
);
