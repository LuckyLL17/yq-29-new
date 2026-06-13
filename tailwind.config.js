/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        surface: {
          base: "var(--bg-base)",
          panel: "var(--bg-panel)",
          elevated: "var(--bg-elevated)",
          inset: "var(--bg-inset)",
          hover: "var(--bg-hover)",
          active: "var(--bg-active)",
          input: "var(--bg-input)",
        },
        edge: {
          base: "var(--border-base)",
          subtle: "var(--border-subtle)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
      },
    },
  },
  plugins: [],
};
