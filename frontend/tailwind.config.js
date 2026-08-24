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
        // 라이트 앱 바탕 — 순백이면 흰 카드·헤더가 바탕에 잠겨 층이 사라지므로
        // theme.css --app-canvas(#f1f3f6)와 같은 쿨 그레이 캔버스를 깐다 (토스 문법).
        // 값 변경 시 index.css --ig-secondary-background(light)·index.html 크리티컬
        // 인라인 배경/theme-color·ThemeContext theme-color 와 반드시 함께 맞출 것.
        "background-light": "#f1f3f6",
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
        // 텍스트 스케일 — 다크에서 순백(#fff) 대신 --text-strong(#e5e2e1)을 쓰게 하는
        // 눈부심(halation) 방지 토큰. dark: 프리픽스 없이 text-ink-strong 등으로 사용.
        ink: {
          strong: "var(--text-strong)",
          DEFAULT: "var(--text-body)",
          muted: "var(--text-muted)",
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
        // 달력 드롭다운 등장 — 트리거 쪽에서 살짝 내려오며 또렷해진다
        "pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "streak-flame": "streak-flame 1.8s ease-in-out infinite",
        "streak-glow": "streak-glow 1.8s ease-in-out infinite",
        "pop-in": "pop-in 0.14s ease-out",
      },
    },
  },
  plugins: [],
}
