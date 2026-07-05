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
      keyframes: {
        // 스트릭 유지 시 불꽃 — 미세한 스케일 + 네온 글로우 맥동
        "streak-flame": {
          "0%, 100%": {
            transform: "scale(1)",
            filter: "drop-shadow(0 0 3px rgba(251,146,60,0.45))",
          },
          "50%": {
            transform: "scale(1.08)",
            filter:
              "drop-shadow(0 0 10px rgba(251,146,60,0.9)) drop-shadow(0 0 22px rgba(239,68,68,0.45))",
          },
        },
        // 숫자 주변 은은한 글로우 맥동 (스케일 없음)
        "streak-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 2px rgba(251,146,60,0.3))" },
          "50%": { filter: "drop-shadow(0 0 9px rgba(251,146,60,0.75))" },
        },
      },
      animation: {
        "streak-flame": "streak-flame 1.8s ease-in-out infinite",
        "streak-glow": "streak-glow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
