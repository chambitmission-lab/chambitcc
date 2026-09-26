// 설문 상징 아이콘 — 홈 배너(엔트리 번들)가 surveyUi 전체를 끌지 않도록 따로 둔다
/** 설문지 한 장 — 목록 카드·히어로·홈 배너가 함께 쓰는 상징 */
export const ClipboardIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4H6.5A1.5 1.5 0 0 0 5 5.5v14A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-14A1.5 1.5 0 0 0 17.5 4H16" />
    <rect x="8" y="2.6" width="8" height="3.2" rx="1.1" />
    <polyline points="9.2 12 10.8 13.6 14.8 9.6" />
    <path d="M9.2 17.4h5.6" />
  </svg>
)
