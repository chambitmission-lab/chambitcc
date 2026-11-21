import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { TitleStatus, TitleTier, TitleCategory } from '../../api/titles'
import { TitleUnlockModal } from '../../components/titles/TitleUnlockModal'

/**
 * /#/dev/title-unlock — 칭호 해금 팝업(E안 기록 카드). ?key=eutychus_escape 로 칭호를 고른다.
 * 표본: 히든+희귀도(rarity) · 퍼즐 · 전설 · 희귀도 없는 구버전 응답.
 */
type Sample = Pick<TitleStatus, 'key' | 'name' | 'icon' | 'category' | 'tier' | 'description' | 'hidden' | 'rarity'>
const SAMPLES: Sample[] = [
  { key: 'eutychus_escape', name: '유두고 탈출', icon: '🪟', category: 'hidden', tier: 'bronze', hidden: true,
    description: '설교 중에 졸다가 3층 창문에서 떨어진 유두고(행 20:9)… 당신은 식곤증 마의 시간에 오히려 말씀을 붙잡았습니다. 이제 창가에 앉아도 안전해요!',
    rarity: { holder_count: 12, holder_rank: 12, member_count: 184 } },
  { key: 'puzzle_cross', name: '다 이루었다', icon: '✝️', category: 'puzzle', tier: 'gold', hidden: false,
    description: '우리를 위해 다 이루신 십자가의 사랑 앞에, 마지막 조각을 조용히 내려놓았습니다.',
    rarity: { holder_count: 3, holder_rank: 3, member_count: 184 } },
  { key: 'bible_conqueror', name: '성경 통독의 전설', icon: '🏆', category: 'pattern', tier: 'legendary', hidden: false,
    description: '창세기 1장부터 요한계시록 마지막 장까지, 66권 전권 완독! 당신의 이름이 전설로 새겨졌습니다.',
    rarity: { holder_count: 1, holder_rank: 1, member_count: 184 } },
  { key: 'dawn_riser', name: '새벽을 깨우는 자', icon: '🌄', category: 'time', tier: 'silver', hidden: false,
    description: '알람 다섯 개와 싸워 이긴 새벽! 닭보다 먼저 눈 뜬 부지런쟁이.' },
]

const toStatus = (s: Sample): TitleStatus => ({
  ...s,
  category: s.category as TitleCategory,
  tier: s.tier as TitleTier,
  category_label: '',
  hint: '',
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
