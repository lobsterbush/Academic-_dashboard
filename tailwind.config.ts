import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Space Grotesk", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "SF Mono", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Primary accent colors matching charlescrabtree.org
        accent: {
          DEFAULT: "#0066cc",
          hover: "#0052a3",
          secondary: "#00a86b",
        },
        green: {
          DEFAULT: "#4A9B67",
          light: "#67B084",
          subtle: "rgba(74, 155, 103, 0.1)",
        },
        border: "var(--border)",
        muted: "var(--text-muted)",
      },
      boxShadow: {
        glass: "0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)",
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
      },
      backdropBlur: {
        glass: "20px",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
