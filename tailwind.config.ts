import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d8d8dd",
          300: "#b4b4bd",
          400: "#8b8b98",
          500: "#6b6b7a",
          600: "#545462",
          700: "#44444f",
          800: "#2c2c34",
          900: "#1a1a1f",
          950: "#0f0f12",
        },
        accent: {
          50: "#eef4ff",
          100: "#dbe7fe",
          200: "#bfd4fe",
          300: "#93b6fd",
          400: "#608efa",
          500: "#3b6cf4",
          600: "#2650e8",
          700: "#213dd4",
          800: "#2233ab",
          900: "#213086",
        },
        warn: {
          50: "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          600: "#ea580c",
        },
        medical: {
          50: "#fef2f2",
          100: "#fee2e2",
          400: "#f87171",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(15, 15, 18, 0.08), 0 1px 2px -1px rgba(15,15,18,0.06)",
        floating: "0 12px 32px -8px rgba(15, 15, 18, 0.18), 0 4px 12px -4px rgba(15,15,18,0.10)",
      },
      borderRadius: {
        xl2: "1.125rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
        "pop-in": "pop-in 120ms ease-out",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
