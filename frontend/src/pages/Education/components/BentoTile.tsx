import type { EducationCategory } from '../../../types/education'
import { categoryText } from '../../../types/education'
import { EduGlyph } from '../EduIcons'
import { toneVars, type Lang } from './eduTone'

// 주일학교·청년부처럼 '부서'로 부르는 분야 — 나머지는 '과정'
const DEPARTMENT_KEYS = new Set(['sunday-school', 'youth'])

// ── 벤토 타일 ─────────────────────────────────────────
// 첫 타일은 기존 히어로 삽화(양들의 교실)가 무대 — 위쪽은 카드색 페이드(글자 자리), 바닥에 교실.
// 개수가 DB 에 따라 바뀌므로 빈칸이 생기지 않게 span 을 계산한다.
//   모바일(2열): 첫 타일 2칸, 나머지가 홀수면 마지막 2칸
//   PC(4열·첫 타일 2×2): 첫 타일 옆 2×2 자리를 먼저 채우고, 그 아래 줄은 4칸 단위
const tileSpanClass = (index: number, total: number) => {
  if (index === 0) return total === 1 ? 'is-art is-solo' : 'is-art'
  const rest = total - 1
  const pos = index - 1 // 0-based among rest
  const cls: string[] = []
  if (rest % 2 === 1 && pos === rest - 1) cls.push('m-wide')
  if (rest <= 4) {
    // 첫 타일 옆 2열×2행 자리
    if (rest === 1) cls.push('d-side-full')
    else if (rest === 2) cls.push('d-wide')
    else if (rest === 3 && pos === 2) cls.push('d-wide')
  } else if (pos >= 4) {
    const tail = rest - 4
    const lastRow = tail % 4
    const firstOfLastRow = 4 + tail - (lastRow || 4)
    if (pos >= firstOfLastRow && lastRow !== 0) {
      if (lastRow === 1) cls.push('d-full')
      else if (lastRow === 2) cls.push('d-wide')
      else if (lastRow === 3 && pos === rest - 1) cls.push('d-wide')
    }
  }
  return cls.join(' ')
}

export const BentoTile = ({
  category,
  index,
  total,
  language,
  isAdmin,
  selected,
  onClick,
}: {
  category: EducationCategory
  index: number
  total: number
  language: Lang
  isAdmin: boolean
  selected: boolean
  onClick: () => void
}) => {
  const ko = language === 'ko'
  const n = category.programs.length
  const unit = DEPARTMENT_KEYS.has(category.key) ? (ko ? '부서' : 'depts') : ko ? '과정' : 'programs'
  const isArt = index === 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`edu-tile ${tileSpanClass(index, total)} ${selected ? 'is-selected' : ''} ${!category.is_active ? 'opacity-60' : ''}`}
      style={toneVars(index)}
    >
      <span className="edu-tile-count">
        {ko ? `${n}개 ${unit}` : `${n} ${unit}`}
        {!category.is_active && isAdmin && <span className="ml-1">· 숨김</span>}
      </span>
      {!isArt && (
        <span className="edu-tile-mark" aria-hidden="true">
          <EduGlyph emoji={category.emoji} size={84} />
        </span>
      )}
      <span className="edu-tile-name">{categoryText(category, 'name', language)}</span>
      {categoryText(category, 'tagline', language) && (
        <span className="edu-tile-tagline">{categoryText(category, 'tagline', language)}</span>
      )}
    </button>
  )
}
