// 개발 전용 미리보기 (/dev/achievements, DEV 빌드에서만 라우팅) —
// 백엔드 없이 업적 모달의 잠금/임박/해금 상태를 바로 확인한다.
import { useState } from 'react'
import type { Achievement } from '../../../types/achievement'
import { ACHIEVEMENTS } from '../../../types/achievement'
import AchievementModal from './AchievementModal'

const base = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!

// 시나리오: 시작 직후 / 중반 / 해금 임박 / 해금(초과 달성) / 해금(다음 목표 없음)
const SAMPLES: Array<{ label: string; achievement: Achievement; celebrate: boolean }> = [
  { label: '잠금 · 14%', celebrate: false, achievement: { ...base('bible_100'), unlocked: false, progress: 14 } },
  { label: '잠금 · 52%', celebrate: false, achievement: { ...base('prayer_count_50'), unlocked: false, progress: 26 } },
  { label: '잠금 · 86% (임박)', celebrate: false, achievement: { ...base('streak_7'), unlocked: false, progress: 6 } },
  { label: '해금 · 초과달성 + 폭죽', celebrate: true, achievement: { ...base('prayer_time_30'), unlocked: true, progress: 535 } },
  { label: '해금 · 최종 단계', celebrate: false, achievement: { ...base('bm_score_3000'), unlocked: true, progress: 3200 } },
]

// '다음 목표' 티저 계산용 목록 — 같은 유형 상위 단계는 잠금 상태로 제공
const POOL: Achievement[] = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: false, progress: 0 }))

const AchievementModalPreview = () => {
  const [selected, setSelected] = useState<{ achievement: Achievement; celebrate: boolean } | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark p-6">
      <h1 className="text-lg font-bold text-ink-strong mb-4">업적 모달 미리보기 (dev)</h1>
      <div className="flex flex-col gap-2 max-w-xs">
        {SAMPLES.map((s) => (
          <button
            key={s.label}
            onClick={() => setSelected(s)}
            className="px-4 py-2.5 rounded-xl text-left text-[14px] font-semibold bg-white dark:bg-card-dark border border-gray-200 dark:border-white/10 text-ink-strong hover:border-brand transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>

      <AchievementModal
        achievement={selected?.achievement ?? null}
        achievements={POOL}
        celebrate={selected?.celebrate ?? false}
        onSelect={(a) => setSelected({ achievement: a, celebrate: false })}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

export default AchievementModalPreview
