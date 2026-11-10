// 함께 기도하기 버튼 — 화면에서 골드를 쓰는 유일한 자리(기도의 온기).
// PC 는 작성자 줄 오른쪽에 글자와 함께, 모바일은 하단 입력 바 왼쪽에 둥근 아이콘으로 둔다(round).
import { useState } from 'react'
import { HandHeartIcon } from '../../../../components/icons/ActionIcons'

interface PrayerActionsProps {
  isPrayed: boolean
  isToggling: boolean
  onPrayerToggle: () => void
  /** 글자 없이 둥근 아이콘만 (모바일 하단 바) */
  round?: boolean
  className?: string
}

const PrayerActions = ({ isPrayed, isToggling, onPrayerToggle, round = false, className = '' }: PrayerActionsProps) => {
  const [isPopping, setIsPopping] = useState(false)
  const label = isPrayed ? '함께 기도했어요' : '함께 기도하기'

  const handlePrayerToggle = () => {
    onPrayerToggle()

    // 탭 순간에만 팝 애니메이션 (이미 기도된 상태로 로드될 때는 안 튀도록)
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 450)
  }

  return (
    <button
      type="button"
      onClick={handlePrayerToggle}
      disabled={isToggling}
      aria-pressed={isPrayed}
      aria-label={round ? label : undefined}
      title={round ? label : undefined}
      className={`pd-pray ${round ? 'pd-pray--round' : ''} ${className}`}
    >
      <HandHeartIcon size={round ? 24 : 20} filled={isPrayed} className={isPopping ? 'pd-pray__icon--pop' : undefined} />
      {!round && <span>{label}</span>}
    </button>
  )
}

export default PrayerActions
