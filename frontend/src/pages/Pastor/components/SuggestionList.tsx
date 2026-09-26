// 오늘 연락하면 좋은 분 — 목회 비서 화면과 목회자 홈이 공유.
// 이유(reason) 칩이 곧 '왜 이분인가'의 설명이다. 기록을 남기면 다음 조회부터 해당 이유가 풀린다.
// compact(홈)에서도 전화·기록 버튼은 그대로 — 홈에서 이름을 보고 성도 상세까지 들어가지 않고 바로 연락이 끝나야 한다.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReasonTone, Suggestion } from '../../../api/pastor'
import { EmptyHint } from '../../Admin/components/StatCards'
import VisitComposer from './VisitComposer'
import { Avatar } from './ui'

const TONE_CHIP: Record<ReasonTone, string> = {
  urgent: 'bg-[var(--amber-soft)] text-[var(--amber)]',
  care: 'bg-[var(--brand-soft)] text-brand',
  joy: 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/70',
}

const TONE_ICON: Record<ReasonTone, string> = {
  urgent: 'priority_high',
  care: 'favorite_border',
  joy: 'celebration',
}

const SuggestionList = ({ items, compact = false }: { items: Suggestion[]; compact?: boolean }) => {
  const [recording, setRecording] = useState<Suggestion | null>(null)

  if (items.length === 0) {
    return <EmptyHint text="오늘은 특별히 챙길 분이 없습니다. 평안한 하루 되세요" />
  }

  return (
    <>
      <ul className="space-y-2">
        {items.map(s => (
          <li
            key={s.user_id}
            className="flex gap-3 px-3.5 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/70 dark:bg-white/[0.02]"
          >
            <Avatar name={s.name} url={s.avatar_url} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link to={`/pastor/members/${s.user_id}`} className="text-[15px] font-bold text-ink-strong hover:text-brand">
                  {s.name}
                </Link>
                {s.church_title && <span className="text-[12px] font-semibold text-brand">{s.church_title}</span>}
                {s.district && <span className="text-[12px] text-gray-600 dark:text-white/60">{s.district}</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(compact ? s.reasons.slice(0, 2) : s.reasons).map(r => (
                  <span
                    key={r.code + r.label}
                    className={`inline-flex items-center gap-0.5 text-[12px] font-semibold px-2 py-0.5 rounded-md ${TONE_CHIP[r.tone]}`}
                  >
                    <span className="material-icons-outlined text-[13px]">{TONE_ICON[r.tone]}</span>
                    {r.label}
                  </span>
                ))}
                {compact && s.reasons.length > 2 && (
                  <span className="text-[12px] text-gray-500 self-center">외 {s.reasons.length - 2}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 self-center">
              {s.phone && (
                <a
                  href={`tel:${s.phone}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 dark:text-white/65 hover:bg-[var(--brand-soft)] hover:text-brand"
                  aria-label={`${s.name}님께 전화`}
                  title={s.phone}
                >
                  <span className="material-icons-outlined text-[18px]">call</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setRecording(s)}
                className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-white/[0.1] text-[12px] font-semibold text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand"
              >
                <span className="material-icons-outlined text-[15px]">edit_note</span>
                기록
              </button>
            </div>
          </li>
        ))}
      </ul>

      {recording && (
        <VisitComposer
          memberId={recording.user_id}
          memberName={recording.name}
          onClose={() => setRecording(null)}
        />
      )}
    </>
  )
}

export default SuggestionList
