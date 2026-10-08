/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06070a",
        surface: "#0c0d14",
        "surface-raised": "#12141f",
        "surface-card": "#161926",
        monad: {
          purple: "#836EF9",
          violet: "#6E54FF",
          berry: "#A0055D",
          emerald: "#00F59B",
          cyan: "#00E5FF",
          dark: "#140e2b",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
