/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        foreground: "#ededed",
        primary: "#3ecf8e",
        muted: "#8b8b8b",
        card: "rgba(255,255,255,0.03)",
        border: "rgba(255,255,255,0.08)",
        destructive: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
