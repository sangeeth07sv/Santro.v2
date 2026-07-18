import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Night-bazaar indigo — nav, footer, dark surfaces, headings
        indigo: {
          50: "#f1effa",
          100: "#e1ddf2",
          400: "#5d4d99",
          600: "#382a63",
          700: "#2c2050",
          800: "#241b3e",
          900: "#181228",
        },
        // Marigold — the signature accent: CTAs, price tags, active states
        marigold: {
          50: "#fdf3e2",
          100: "#faf3d",
          300: "#f0c069",
          500: "#e8a33d",
          600: "#cf8a26",
          700: "#a86c1b",
        },
        // Paisley green — savings, in-stock, delivery/trust signals
        paisley: {
          50: "#e9f5f0",
          500: "#1f7a5c",
          600: "#186049",
        },
        ink: "#1a1610",
        surface: {
          DEFAULT: "#fffcf7", // paper
          muted: "#f4eedf", // sand
          dark: "#181228",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(24,18,40,0.08), 0 1px 2px rgba(24,18,40,0.05)",
        elevated: "0 14px 34px -12px rgba(232,163,61,0.35)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
