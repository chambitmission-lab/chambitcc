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
        display: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "SUIT Variable", "SUIT", "Malgun Gothic", "맑은 고딕", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Apple SD Gothic Neo", "SUIT Variable", "SUIT", "Malgun Gothic", "맑은 고딕", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
}
