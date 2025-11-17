const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", ...fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          foreground: "rgb(var(--color-on-primary) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-on-accent) / <alpha-value>)",
        },
        background: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-alt) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        pill: "999px",
      },
      boxShadow: {
        "brand-soft": "0 20px 45px rgba(13, 90, 190, 0.18)",
        "brand-hard": "0 10px 30px rgba(10, 42, 87, 0.25)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #1ec8ff 0%, #1b6dff 100%)",
        "accent-gradient": "linear-gradient(135deg, #ff7d8c 0%, #f34760 100%)",
      },
    },
  },
  plugins: [],
}

