import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// dvh 폴백 — 모달·시트 높이 상한은 dvh(주소창을 뺀 "지금 보이는" 높이)로 적는다.
// vh 는 모바일에서 주소창이 숨은 큰 화면 기준이라 90vh 가 실제 보이는 높이보다 커져
// 시트 아래가 잘리거나 필요 없는 내부 스크롤이 생겼다.
// dvh 를 모르는 옛 브라우저(iOS 15.3 이하·Chrome 107 이하)는 선언을 통째로 버려 상한이 사라지므로,
// dvh 선언 바로 앞에 같은 값의 vh 선언을 자동으로 끼워 넣는다(Tailwind 임의값 클래스·손수 쓴 CSS 모두).
// 이미 같은 속성의 폴백이 앞줄에 있으면 건드리지 않는다.
const dvhFallback = () => ({
  postcssPlugin: 'dvh-fallback',
  Declaration(decl) {
    if (!/\ddvh\b/.test(decl.value)) return
    const prev = decl.prev()
    if (prev && prev.type === 'decl' && prev.prop === decl.prop) return
    decl.cloneBefore({ value: decl.value.replace(/(\d)dvh\b/g, '$1vh') })
  },
})
dvhFallback.postcss = true

export default {
  plugins: [tailwindcss(), dvhFallback(), autoprefixer()],
}
