import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".tools/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["src/ui/Icon.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react", "lucide-react/*"],
              message:
                "Use o componente central src/ui/Icon.tsx para os ícones do Ecovit.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportExpression[source.value=/^lucide-react(\\/|$)/]",
          message:
            "Não carregue o catálogo dinamicamente. Use src/ui/Icon.tsx.",
        },
        {
          selector:
            "CallExpression[callee.name='require'][arguments.0.value=/^lucide-react(\\/|$)/]",
          message:
            "Use o componente central src/ui/Icon.tsx para os ícones do Ecovit.",
        },
      ],
    },
  },
);
