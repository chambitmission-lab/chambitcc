// 선거 상징 아이콘 — 홈 배너(엔트리 번들)가 electionUi 전체를 끌지 않도록 따로 둔다
/** 투표함 — 목록 카드·홈 배너·빈 상태가 함께 쓰는 상징 */
export const BallotIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11.5h16V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
    <path d="M8.5 11.5V5A1.5 1.5 0 0 1 10 3.5h4A1.5 1.5 0 0 1 15.5 5v6.5" />
    <polyline points="10.3 7.6 11.6 8.9 13.9 6.4" />
    <path d="M9.5 15.5h5" />
  </svg>
)
