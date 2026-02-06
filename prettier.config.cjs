/** @type {import("prettier").Config} */
module.exports = {
  plugins: ["prettier-plugin-svelte"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: "lf",
  overrides: [{ files: "*.md", options: { proseWrap: "preserve" } }],
};
