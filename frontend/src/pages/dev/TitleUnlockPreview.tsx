import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { TitleStatus, TitleTier, TitleCategory } from '../../api/titles'
import { TitleUnlockModal } from '../../components/titles/TitleUnlockModal'

/**
 * /#/dev/title-unlock — 칭호 해금 팝업(B1 풀아트 카드). ?key=puzzle_cross 로 칭호를 고른다.
 * 표본: 퍼즐 칭호(그림) · 퍼즐 마스터(모자이크) · 그림 없는 칭호(선화 기본 카드).
 */
const SAMPLES: Array<Pick<TitleStatus, 'key' | 'name' | 'icon' | 'category' | 'tier' | 'description'>> = [
  { key: 'puzzle_creation', name: '첫째 날의 빛', icon: '🌅', category: 'puzzle', tier: 'silver',
    description: '빛이 있으라! 아홉 조각을 다 맞추고 나니, 세상이 처음 열리던 그 아침을 본 것 같아요.' },
  { key: 'puzzle_cross', name: '다 이루었다', icon: '✝️', category: 'puzzle', tier: 'gold',
    description: '우리를 위해 다 이루신 십자가의 사랑 앞에, 마지막 조각을 조용히 내려놓았습니다.' },
  { key: 'puzzle_master', name: '구속사 퍼즐 마스터', icon: '🧩', category: 'puzzle', tier: 'legendary',
    description: '창조에서 부활까지, 열 장의 그림이 하나의 이야기로 이어졌어요.' },
  { key: 'dawn_riser', name: '새벽을 깨우는 자', icon: '🌄', category: 'time', tier: 'bronze',
    description: '새벽 시간에 말씀을 읽었어요.' },
]

const toStatus = (s: (typeof SAMPLES)[number]): TitleStatus => ({
  ...s,
  category: s.category as TitleCategory,
  tier: s.tier as TitleTier,
  category_label: '',
  hint: '',
  hidden: false,
  earned: true,
  earned_at: null,
  equipped: false,
  progress: null,
})

export default function TitleUnlockPreview() {
  const key = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('key')
  const [current, setCurrent] = useState<TitleStatus | null>(
    toStatus(SAMPLES.find((s) => s.key === key) ?? SAMPLES[0]),
  )
  return (
    <div style={{ padding: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {SAMPLES.map((s) => (
        <button key={s.key} type="button" onClick={() => setCurrent(toStatus(s))}>{s.name}</button>
      ))}
      <AnimatePresence>
        {current && (
          <TitleUnlockModal
            key={current.key}
            title={current}
            remaining={0}
            onEquip={() => setCurrent(null)}
            onClose={() => setCurrent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
