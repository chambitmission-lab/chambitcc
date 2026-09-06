// 설문 통계 — 관리자 결과 화면과 성도용 결과 요약이 함께 쓴다.
// showNames=false 면 주관식 답변의 작성자 이름을 숨긴다(백엔드도 내려주지 않는다).
import type { SurveyQuestionStat, SurveyStats } from '../../types/survey'
import { cardCls, formatDateTime } from './surveyShared'

interface Props {
  stats: SurveyStats
  showNames?: boolean
}

/* 보기별 가로 막대 — 퍼센트가 아니라 "몇 명"이 먼저 읽히게 한다 */
const OptionBars = ({ stat }: { stat: SurveyQuestionStat }) => {
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
const NumberSummary = ({ stat }: { stat: SurveyQuestionStat }) => {
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

const RatingSummary = ({ stat }: { stat: SurveyQuestionStat }) => {
  if (!stat.number) return null
  const average = stat.number.average
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="flex items-center gap-0.5 text-[#f4b400]">
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} width="18" height="18" viewBox="0 0 24 24" fill={average >= n - 0.5 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
          </svg>
        ))}
      </div>
      <span className="text-[15px] font-bold text-ink-strong tabular-nums">{average}</span>
      <span className="text-[12.5px] text-ink-muted">({stat.number.count}명 응답)</span>
    </div>
  )
}

const TextAnswers = ({ stat, showNames }: { stat: SurveyQuestionStat; showNames: boolean }) => {
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

const QuestionStatCard = ({
  stat,
  order,
  showNames,
}: {
  stat: SurveyQuestionStat
  order: number
  showNames: boolean
}) => {
  const isChoice = stat.type === 'single' || stat.type === 'multi'
  const isNumeric = stat.type === 'number' || stat.type === 'rating'
  const isFrequency = stat.type === 'time' || stat.type === 'date'

  return (
    <div className={`${cardCls} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-[3px] shrink-0 w-5 h-5 rounded-full bg-[var(--brand-soft)] text-brand text-[11px] font-bold flex items-center justify-center tabular-nums">
            {order}
          </span>
          <p className="text-[14.5px] font-semibold text-ink-strong leading-snug">{stat.title}</p>
        </div>
        <span className="shrink-0 text-[11.5px] text-ink-muted tabular-nums">
          {stat.answered_count}명 응답
        </span>
      </div>

      {stat.answered_count === 0 ? (
        <p className="text-[13px] text-ink-muted py-2">아직 응답이 없습니다</p>
      ) : (
        <>
          {stat.type === 'rating' ? <RatingSummary stat={stat} /> : null}
          {stat.type === 'number' ? (
            <div className="mb-3">
              <NumberSummary stat={stat} />
            </div>
          ) : null}
          {(isChoice || isNumeric || isFrequency) && stat.options.length > 0 ? (
            <OptionBars stat={stat} />
          ) : null}
          {stat.texts.length > 0 ? (
            <div className={isChoice ? 'mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]' : ''}>
              {isChoice ? (
                <p className="text-[11.5px] font-semibold text-ink-muted mb-2">기타 직접 입력</p>
              ) : null}
              <TextAnswers stat={stat} showNames={showNames} />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

const SurveyStatsView = ({ stats, showNames = false }: Props) => (
  <div className="space-y-3">
    <div className={`${cardCls} px-4 py-3.5 flex items-center justify-between`}>
      <div>
        <p className="text-[11.5px] font-semibold text-ink-muted">참여 인원</p>
        <p className="text-[22px] font-bold text-brand tabular-nums leading-tight">
          {stats.response_count}
          <span className="text-[14px] text-ink-muted font-semibold ml-1">명</span>
        </p>
      </div>
      <p className="text-[12px] text-ink-muted text-right">
        문항 {stats.questions.length}개
      </p>
    </div>

    {stats.questions.map((stat, i) => (
      <QuestionStatCard
        key={stat.question_id}
        stat={stat}
        order={i + 1}
        showNames={showNames}
      />
    ))}
  </div>
)

export default SurveyStatsView
