/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        card: "#121217",
        border: "#27272a",
        primary: "#38bdf8",
        accent: "#818cf8",
        muted: "#71717a",
      },
    },
  },
  plugins: [],
};

