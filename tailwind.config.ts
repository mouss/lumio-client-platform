import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lumio: {
          black: "#050505",
          white: "#FFFFFF",
          blue: "#0054A6",
          "blue-light": "#4D9FE8",
        },
      },
      fontFamily: {
        sans: [
          "RNS Sanz",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
