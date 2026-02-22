import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-hover": "rgb(var(--color-primary-hover) / <alpha-value>)",
        "primary-fg": "rgb(var(--color-primary-fg) / <alpha-value>)",
        "primary-fg-muted": "rgb(var(--color-primary-fg-muted) / <alpha-value>)",
        "primary-badge": "rgb(var(--color-primary-badge) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "card-bg": "rgb(var(--color-card-bg) / <alpha-value>)",
        "card-border": "rgb(var(--color-card-border) / <alpha-value>)",
        "table-hover": "rgb(var(--color-table-hover) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--color-muted-fg) / <alpha-value>)",
        "input-border": "rgb(var(--color-input-border) / <alpha-value>)",
        "input-highlight": "rgb(var(--color-input-highlight) / <alpha-value>)",
        "accent-green": "rgb(var(--color-accent-green) / <alpha-value>)",
        "accent-green-bg": "rgb(var(--color-accent-green-bg) / <alpha-value>)",
        "accent-red": "rgb(var(--color-accent-red) / <alpha-value>)",
        "accent-red-bg": "rgb(var(--color-accent-red-bg) / <alpha-value>)",
        "thead-accent": "rgb(var(--color-thead-accent) / <alpha-value>)",
        "warning-bg": "rgb(var(--color-warning-bg) / <alpha-value>)",
        "warning-fg": "rgb(var(--color-warning-fg) / <alpha-value>)",
        "warning-border": "rgb(var(--color-warning-border) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
export default config;
