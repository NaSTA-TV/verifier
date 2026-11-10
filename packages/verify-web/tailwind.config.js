const _plugin = require("tailwindcss/plugin");

// const mantineVariantsPlugin = plugin(function ({ addVariant }) {
//   addVariant("success", `&[data-variant="success"]`);
//   addVariant("danger", `&[data-variant="danger"]`);
//   addVariant("warning", `&[data-variant="warning"]`);
// });

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [
    // require("@tailwindcss/forms")({
    //   strategy: "class",
    // }),
    // require("tailwindcss-animate"),
    // mantineVariantsPlugin,
  ],
  darkMode: ["class", '[data-mantine-color-scheme="dark"]'],
};
