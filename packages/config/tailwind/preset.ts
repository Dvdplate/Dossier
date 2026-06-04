import type { Config } from "tailwindcss";

/**
 * DOSSIER "007 First Light" palette.
 *
 * Usage discipline (from spec §2a):
 *   dark base ~75%, cold/gunmetal structure ~20%, amber reserved ~5%
 *   amber: only focus card (index 0), single primary action/screen, active nav, focus rings
 *   alert: errors/destructive only
 */
const preset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        blackops: "rgb(var(--color-blackops) / <alpha-value>)",
        midnight: "rgb(var(--color-midnight) / <alpha-value>)",
        steel: "rgb(var(--color-steel) / <alpha-value>)",
        gunmetal: "rgb(var(--color-gunmetal) / <alpha-value>)",
        ash: "rgb(var(--color-ash) / <alpha-value>)",
        amber: "rgb(var(--color-amber) / <alpha-value>)",
        alert: "rgb(var(--color-alert) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      ringColor: {
        DEFAULT: "rgb(var(--color-amber) / 1)",
      },
    },
  },
};

export default preset;
