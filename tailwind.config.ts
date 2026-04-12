import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy/charcoal background, warm cream text, amber + brass accents.
        ink: {
          950: "#070b15",
          900: "#0b1120",
          850: "#0f1626",
          800: "#141c30",
          700: "#1c2640",
          600: "#2a3554",
          500: "#3a4869",
        },
        cream: {
          50: "#f7f1e0",
          100: "#efe6cd",
          200: "#e3d6b1",
          300: "#cdbb8a",
          400: "#a8966a",
          500: "#857650",
        },
        amber: {
          DEFAULT: "#e8b86d",
          dim: "#a87f3f",
          deep: "#7a5827",
        },
        brass: {
          light: "#d9b779",
          DEFAULT: "#a4823f",
          dark: "#5e4920",
        },
        vu: {
          face: "#f3e7c4",
          rim: "#5e4920",
          ink: "#1a1408",
          red: "#a02a1a",
        },
      },
      fontFamily: {
        // Fraunces (variable, with optical-size + SOFT axis) does everything —
        // headlines at 72 px and body at 14 px from the same family.
        serif: [
          "Fraunces",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // Display sizes for the Player hero title
        display: ["clamp(2.25rem, 5vw + 1rem, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        hero: ["clamp(1.75rem, 3vw + 1rem, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
      maxWidth: {
        prose: "62ch",
      },
      boxShadow: {
        cover: "0 20px 50px -20px rgba(0,0,0,0.7), 0 8px 24px -12px rgba(0,0,0,0.6)",
        innerWarm: "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        // Subtle paper-grain noise overlay; layered as fixed background in
        // index.css. The SVG is inlined as a data URL so there's no extra
        // request.
        grain:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      },
    },
  },
  plugins: [],
};

export default config;
