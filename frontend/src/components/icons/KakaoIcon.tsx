// 카카오 말풍선 심볼 — 브랜드 가이드대로 노란 바탕(#fee500) 버튼 위에 검은 말풍선으로 쓴다
const KakaoIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 3.5C7 3.5 3 6.63 3 10.5c0 2.48 1.65 4.66 4.14 5.9l-.84 3.07c-.08.28.24.5.48.34l3.66-2.43c.51.07 1.03.1 1.56.1 5 0 9-3.13 9-7s-4-7-9-7Z" />
  </svg>
)

export default KakaoIcon
