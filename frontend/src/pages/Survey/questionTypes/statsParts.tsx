// 통계 카드 본문 조각 — 보기별 막대·숫자 요약·별점 요약·주관식 목록. 종류 전략이 조합해 쓴다.
import type { SurveyQuestionStat } from '../../../types/survey'
import { formatDateTime } from '../surveyFormat'
import { STAR_PATH } from './fieldStyles'

/* 보기별 가로 막대 — 퍼센트가 아니라 "몇 명"이 먼저 읽히게 한다 */
export const OptionBars = ({ stat }: { stat: SurveyQuestionStat }) => {
  const top = Math.max(...stat.options.map((o) => o.count), 1)
  return (
    <div className="space-y-2">
      {stat.options.map((option) => {
        const ratio = option.count / top
        const leading = option.count > 0 && option.count === top
        return (
          <div key={option.id}>
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className={`text-[13.5px] ${leading ? 'font-semibold text-ink-strong' : 'text-ink'}`}>
                {option.label}
              </span>
              <span className="shrink-0 text-[12.5px] tabular-nums text-ink-muted">
                <strong className={leading ? 'text-brand' : 'text-ink-strong'}>{option.count}명</strong>
                <span className="ml-1">{option.percent}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${leading ? 'bg-brand' : 'bg-brand/45'}`}
                style={{ width: `${Math.max(ratio * 100, option.count > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* 숫자 요약 — 셔틀 인원처럼 "총 몇 명인가"가 결론인 문항 */
export const NumberSummary = ({ stat }: { stat: SurveyQuestionStat }) => {
  if (!stat.number) return null
  const unit = stat.unit ?? ''
  const tiles: { label: string; value: string; accent?: boolean }[] = [
    { label: '합계', value: `${stat.number.total}${unit}`, accent: true },
    { label: '평균', value: `${stat.number.average}${unit}` },
    { label: '최소', value: `${stat.number.min}${unit}` },
    { label: '최대', value: `${stat.number.max}${unit}` },
  ]
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`rounded-xl px-2 py-2.5 text-center ${
            tile.accent
              ? 'bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]'
              : 'bg-gray-50 dark:bg-white/[0.04] border border-transparent'
          }`}
        >
          <p className="text-[10.5px] font-semibold text-ink-muted mb-0.5">{tile.label}</p>
          <p className={`text-[14px] font-bold tabular-nums ${tile.accent ? 'text-brand' : 'text-ink-strong'}`}>
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export const RatingSummary = ({ stat }: { stat: SurveyQuestionStat }) => {
  if (!stat.number) return null
  const average = stat.number.average
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="flex items-center gap-0.5 text-[#f4b400]">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} width="18" height="18" viewBox="0 0 24 24" fill={average >= n - 0.5 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d={STAR_PATH} />
          </svg>
        ))}
      </div>
      <span className="text-[15px] font-bold text-ink-strong tabular-nums">{average}</span>
      <span className="text-[12.5px] text-ink-muted">({stat.number.count}명 응답)</span>
    </div>
  )
}

export const TextAnswers = ({ stat, showNames }: { stat: SurveyQuestionStat; showNames: boolean }) => {
  if (!stat.texts.length) return null
  return (
    <div className="space-y-2">
      {stat.texts.map((text, i) => (
        <div
          key={`${text.response_id}-${i}`}
          className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5"
        >
          <p className="text-[13.5px] text-ink-strong leading-relaxed whitespace-pre-wrap break-words">
            {text.value}
          </p>
          {(showNames && text.user_name) || text.created_at ? (
            <p className="mt-1.5 text-[11px] text-ink-muted">
              {showNames && text.user_name ? `${text.user_name} · ` : ''}
              {formatDateTime(text.created_at)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
