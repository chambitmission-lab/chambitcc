import { useState } from 'react'
import LevelUpMoment from '../Profile/components/LevelUpMoment'
import { GLOW_LEVELS } from '../../types/achievement'

/**
 * /#/dev/level-up — 레벨업 축하 모먼트. ?lv=8 로 레벨을 고르고(기본 8), 닫으면 버튼으로 다시 연다.
 * 모바일 폭은 전체 화면, 1024px+ 는 9:16 카드 + 왼쪽 등불 목록.
 */
export default function LevelUpPreview() {
  const lv = Number(new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('lv') ?? 8)
  const level = GLOW_LEVELS.find((l) => l.level === lv) ?? GLOW_LEVELS[8]
  const next = GLOW_LEVELS.find((l) => l.level === level.level + 1)
  const [open, setOpen] = useState(true)
  return (
    <div style={{ padding: 24 }}>
      <button type="button" onClick={() => setOpen(true)}>
        레벨업 모먼트 다시 열기 (Lv.{level.level})
      </button>
      {open && (
        <LevelUpMoment
          level={level}
          pointsToNext={next ? Math.round((next.minPoints - level.minPoints) * 0.4) : null}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
