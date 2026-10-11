import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**"],
    },
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "@stylistic": stylistic,
            react: reactPlugin,
            "react-hooks": reactHooks,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "@stylistic/indent": ["error", 4],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/semi": ["error", "always"],
            "@stylistic/space-before-function-paren": ["error", "never"],
            // React 17+ JSX transform doesn't require React in scope.
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    "args": "all",
                    "argsIgnorePattern": "^_+$",
                    "caughtErrors": "all",
                    "caughtErrorsIgnorePattern": "^_+$",
                    "destructuredArrayIgnorePattern": "^_+$",
                    "varsIgnorePattern": "^_+$",
                    "ignoreRestSiblings": true
                }
            ],
            "@typescript-eslint/no-unsafe-member-access": ["error", { allowOptionalChaining: true }],
            "@typescript-eslint/no-import-type-side-effects": "error",
            "@typescript-eslint/consistent-type-imports": "error",
        },
    },
    {
        files: ["**/*.test.{ts,tsx}", "tests/**/*.ts"],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node,
            },
        },
    },
    {
        files: ["*.config.{js,ts}", "*.config.cjs"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
);
