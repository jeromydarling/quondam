import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy background, warm off-white text, single accent.
        night: {
          950: "#0a0f1c",
          900: "#0e1525",
          800: "#141c30",
          700: "#1c2640",
          600: "#2a3554",
        },
        cream: {
          50: "#f7f3ea",
          100: "#efe7d4",
          300: "#cdc1a3",
          500: "#9b8f72",
        },
        accent: {
          DEFAULT: "#e8b86d", // warm amber
          dim: "#a87f3f",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      minHeight: {
        tap: "44px",
      },
      minWidth: {
        tap: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
