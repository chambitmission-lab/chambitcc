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
        "ig-red": "#ed4956",
        "background-light": "#ffffff",
        "background-dark": "#0b0b12",
        "surface-light": "#fafafa",
        "surface-dark": "#15151d",
        "card-dark": "#1c1c26",
        "border-light": "#dbdbdb",
        "border-dark": "#23232e",
        "accent-purple": "#a855f7",
        "accent-pink": "#ec4899",
      },
      fontFamily: {
        display: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
}
