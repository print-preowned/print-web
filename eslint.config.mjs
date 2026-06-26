import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Forbid cross-imports between admin, (customer), and seller app folders
  {
    files: ["src/app/admin/**/*.ts", "src/app/admin/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/(customer)/*", "@/app/(customer)/**"], message: "Do not import from (customer) into admin." },
            { group: ["@/app/seller/*", "@/app/seller/**"], message: "Do not import from seller into admin." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/(customer)/**/*.ts", "src/app/(customer)/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/admin/*", "@/app/admin/**"], message: "Do not import from admin into (customer)." },
            { group: ["@/app/seller/*", "@/app/seller/**"], message: "Do not import from seller into (customer)." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/seller/**/*.ts", "src/app/seller/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/app/admin/*", "@/app/admin/**"], message: "Do not import from admin into seller." },
            { group: ["@/app/(customer)/*", "@/app/(customer)/**"], message: "Do not import from (customer) into seller." },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
