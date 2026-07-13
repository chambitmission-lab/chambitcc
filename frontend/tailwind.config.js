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
        "background-dark": "#131313",
        "surface-light": "#fafafa",
        "surface-dark": "#1a1a1a",
        "card-dark": "#201f1f",
        "border-light": "#dbdbdb",
        "border-dark": "#2b2a2a",
        "accent-purple": "#a855f7",
        "accent-pink": "#ec4899",
        // 새벽 블루 글래스 테마 토큰 — 값은 src/styles/theme.css의 CSS 변수가
        // 라이트/다크를 분기한다. 컴포넌트에서는 dark: 프리픽스 없이 사용 가능.
        brand: {
          DEFAULT: "var(--brand)",
          dim: "var(--brand-dim)",
          on: "var(--on-brand)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          container: "var(--surface-container)",
          high: "var(--surface-container-high)",
        },
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
