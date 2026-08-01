/* 로그인·회원가입 공용 인라인 아이콘 — 스트로크 1.8의 Lucide 계열 톤.
   아이콘 폰트를 쓰지 않아 첫 페인트에 글리프가 늦게 뜨는 문제가 없다. */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

/** 비밀번호 보기 토글 — off=true면 사선이 그어진 "숨김" 상태 */
export const EyeIcon = ({ off }: { off: boolean }) => (
  <svg {...base} className="w-[1.15rem] h-[1.15rem]">
    {off ? (
      <>
        <path d="M10.6 5.1A9.9 9.9 0 0 1 12 5c5 0 9 4.5 10 7a15.4 15.4 0 0 1-2.9 3.9" />
        <path d="M6.6 6.7C4 8.3 2.5 10.7 2 12c1 2.5 5 7 10 7 1.9 0 3.6-.6 5-1.5" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        <path d="m3 3 18 18" />
      </>
    ) : (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
)

/** 인라인 메시지 앞 원형 아이콘 — 경고(!) / 안내(i) / 완료(✓) */
export const StatusIcon = ({ tone }: { tone: 'error' | 'info' | 'success' }) => (
  <svg {...base} className="w-4 h-4 mt-[1px] shrink-0">
    <circle cx="12" cy="12" r="9" />
    {tone === 'success' ? (
      <path d="m8.5 12.2 2.4 2.4 4.6-4.8" />
    ) : tone === 'info' ? (
      <>
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ) : (
      <>
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    )}
  </svg>
)
