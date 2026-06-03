import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#08080A",
        "bg-2": "#0B0B0E",
        onyx: "#121318",
        "onyx-2": "#16171D",
        "onyx-hi": "#1B1C23",
        line: "#27272A",
        "line-soft": "#1E1E22",
        "line-hi": "#34343A",
        text: "#E4E4E7",
        "text-dim": "#A1A1AA",
        "text-low": "#71717A",
        "text-min": "#52525B",
        accent: "#00FF66",
        "accent-dim": "#00B84A",
        cyan: "#00E5FF",
        amber: "#FFB020",
        redline: "#FF3B3B",
      },
      fontFamily: {
        display: ["Space Grotesk", "SF Pro Display", "Inter", "sans-serif"],
        sans: ["Inter", "SF Pro Text", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 18px rgba(0,255,102,0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
