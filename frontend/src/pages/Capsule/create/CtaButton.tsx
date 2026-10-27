// /capsule/new 아래 줄의 큰 버튼 — 눌리는 입체(바닥 그림자) 버튼. 글자 한 줄만.
// 2026-10-27 알약(아이콘·화살표·양옆 반짝 선) 모양을 잠깐 썼다가 이 모양으로 되돌림.
// icon 은 호출부 호환용으로만 받는다(그리지 않음).
export type CtaIcon = 'mail' | 'calendar' | 'pen' | 'box' | 'link' | 'home'

const CtaButton = ({
  label,
  ghost = false,
  amber = false,
  disabled = false,
  onClick,
}: {
  label: string
  icon?: CtaIcon
  ghost?: boolean
  amber?: boolean
  disabled?: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`cw-btn ${ghost ? 'cw-btn--ghost' : ''} ${amber ? 'cw-btn--amber' : ''}`}
  >
    {label}
  </button>
)

export default CtaButton
