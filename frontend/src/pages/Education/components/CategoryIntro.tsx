import type { EducationCategory } from '../../../types/education'
import { categoryText } from '../../../types/education'
import { HiddenBadge } from './EduBits'
import type { Lang } from './eduTone'

// ── 분야 소개 (필터를 골랐을 때만) ─────────────────────
export const CategoryIntro = ({ category, language, isAdmin }: { category: EducationCategory; language: Lang; isAdmin: boolean }) => {
  const tagline = categoryText(category, 'tagline', language)
  const description = categoryText(category, 'description', language)
  if (!tagline && !description && !(isAdmin && !category.is_active)) return null
  return (
    <div className="edu-intro">
      {tagline && (
        <p className="text-[15px] lg:text-[17px] font-bold text-ink-strong">
          {tagline}
          {!category.is_active && isAdmin && <HiddenBadge />}
        </p>
      )}
      {description && (
        <p className="mt-1.5 text-[14px] lg:text-[16px] leading-[1.75] text-[var(--text-body)] whitespace-pre-line">{description}</p>
      )}
    </div>
  )
}
