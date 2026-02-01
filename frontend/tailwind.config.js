/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0095f6",
        "background-light": "#ffffff",
        "background-dark": "#000000",
        "surface-light": "#fafafa",
        "surface-dark": "#121212",
        "border-light": "#dbdbdb",
        "border-dark": "#262626",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
}
