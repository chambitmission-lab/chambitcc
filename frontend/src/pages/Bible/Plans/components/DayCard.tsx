// ── 하루치 카드 ──
// 상태별 시각 위계: 완료(과거) = 딤드 / 오늘 = 블루 하이라이트 / 예정(미래) = 아웃라인 원 + 차분한 텍스트
// PC(lg+)는 어르신 기준으로 글씨·원·누르는 영역을 키우고, 완료는 딤드 대신 "✓ 읽음" 글자로도 알린다
// (흐리게만 하면 읽은 날 글씨가 안 보인다)
import type { PlanDay } from '../../../../types/biblePlan'
import { ChatIcon as CommentIcon, SparkleIcon as SparklesIcon } from '../PlanIcons'
import { SERMON_DEFAULT_LABEL, formatPlanDay, sermonSummary } from '../planSchedule'

const DayCard = ({
  domId,
  day,
  grad,
  subscribed,
  isToday,
  busy,
  onToggle,
  onRead,
  onReflect,
  showReflect = true,
}: {
  domId?: string
  day: PlanDay
  grad: string
  subscribed: boolean
  isToday: boolean
  busy: boolean
  onToggle: () => void
  onRead: () => void
  onReflect: () => void
  // 개인 플랜(나만의 플랜)은 AI 묵상이 없어 false — 묵상 영역 자체를 숨긴다
  showReflect?: boolean
}) => {
  const isPast = day.completed && !isToday
  const isFuture = subscribed && !day.completed && !isToday
  // AI 묵상·묵상 프롬프트는 "읽은(읽는) 날"에만 — 미래 일차에 미리 노출하면 플로우가 어색하고 카드만 길어진다.
  // 미구독 상태에서는 둘러보기용 미리보기로 그대로 열어둔다.
  const showReflectionArea = showReflect && (!subscribed || day.completed || isToday)
  // 달력 고정 플랜만 날짜가, 설교 정보가 등록된 일차만 설교 줄이 붙는다 (기존 플랜은 둘 다 없음)
  const dateLabel = formatPlanDay(day.scheduled_date)
  const sermonText = sermonSummary(day.sermon)

  return (
    <div
      id={domId}
      className={[
        'relative overflow-hidden rounded-2xl border transition-all',
        'bg-white/80 dark:bg-card-dark shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        isToday
          ? 'border-blue-300/60 dark:border-blue-400/40 ring-1 ring-blue-300/40 dark:ring-blue-400/25'
          : 'border-gray-200/70 dark:border-white/[0.08]',
        isPast ? 'opacity-55 lg:opacity-80' : '',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative z-10 flex items-center gap-3 p-3.5 lg:gap-4 lg:p-4">
        {/* 완료 토글 / 일자 */}
        {subscribed ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            aria-label={day.completed ? '완료 취소' : '완료'}
            className={[
              'shrink-0 w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-[13px] lg:text-[16px] transition-all',
              day.completed
                ? `bg-gradient-to-br ${grad} text-white shadow-[0_4px_12px_-4px_rgba(49,130,246,0.55)]`
                : isToday
                  ? 'border-2 border-blue-400/70 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20'
                  : 'border-2 border-gray-200 dark:border-white/[0.13] bg-transparent text-gray-400 dark:text-white/40 hover:border-blue-400/50 hover:text-blue-500 dark:hover:text-blue-300',
            ].join(' ')}
          >
            {day.completed ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 lg:w-6 lg:h-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              day.day_number
            )}
          </button>
        ) : (
          <div className="shrink-0 w-9 h-9 lg:w-12 lg:h-12 rounded-full border-2 border-gray-200 dark:border-white/[0.13] text-gray-400 dark:text-white/45 flex items-center justify-center font-bold text-[13px] lg:text-[16px]">
            {day.day_number}
          </div>
        )}

        {/* 본문 정보 */}
        <button type="button" onClick={onRead} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 lg:gap-2">
            {isToday && (
              <span className="text-[9.5px] lg:text-[13px] font-bold px-1.5 py-0.5 lg:px-2.5 lg:py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 tracking-[0.05em]">
                오늘
              </span>
            )}
            <span className="text-[10px] lg:text-[14px] font-semibold text-gray-400 dark:text-white/40 lg:text-gray-500 lg:dark:text-white/55">
              {day.day_number}일차{dateLabel ? ` · ${dateLabel}` : ''}
            </span>
            {subscribed && day.completed && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[13px] font-bold text-brand">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                읽음
              </span>
            )}
          </div>
          {day.title && (
            <p
              className={`text-[14px] lg:text-[18px] font-bold tracking-[-0.01em] truncate lg:whitespace-normal lg:line-clamp-2 mt-0.5 lg:mt-1 ${
                isFuture ? 'text-gray-600 dark:text-white/65' : 'text-ink-strong'
              }`}
            >
              {day.title}
            </p>
          )}
          <p
            className={`text-[12px] lg:text-[17px] lg:font-semibold truncate lg:whitespace-normal mt-0.5 lg:mt-1 ${
              isFuture
                ? 'text-blue-600/70 dark:text-blue-300/60'
                : 'text-blue-600 dark:text-blue-300/90'
            }`}
          >
            {day.passages.map((p) => p.reference).filter(Boolean).join(' · ')}
          </p>
          {sermonText && (
            <p className="text-[11.5px] lg:text-[14.5px] truncate mt-0.5 lg:mt-1 text-gray-500 dark:text-white/50">
              <span className="font-semibold text-gray-600 dark:text-white/65">
                {day.sermon?.label || SERMON_DEFAULT_LABEL}
              </span>
              {' · '}
              {sermonText}
            </p>
          )}
        </button>

        {/* 읽기 화살표 */}
        <button
          type="button"
          onClick={onRead}
          aria-label="본문 읽기"
          className="shrink-0 w-8 h-8 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] lg:w-6 lg:h-6">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 묵상 영역 — 완료했거나 오늘인 일차에만 (미구독 시엔 미리보기로 항상) */}
      {showReflectionArea && (
      <div className="relative z-10 px-3.5 pb-3 -mt-1 lg:px-4 lg:pb-4">
        {day.reflection_prompt && (
          <p className="text-[12.5px] lg:text-[15.5px] leading-[1.6] lg:leading-[1.7] text-gray-600 dark:text-white/65 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2 lg:px-4 lg:py-3 mb-2 lg:mb-2.5">
            <CommentIcon size={13} className="inline-block -mt-px mr-1 align-middle opacity-70" />
            {day.reflection_prompt}
          </p>
        )}
        {/* 묵상은 카드 안에 펼치지 않고 전용 읽기 시트(ReflectionSheet)로 연다 */}
        <button
          type="button"
          onClick={onReflect}
          className="inline-flex items-center gap-1.5 text-[12px] lg:text-[15px] lg:py-1.5 font-semibold text-blue-600 dark:text-blue-300 hover:underline"
        >
          <SparklesIcon size={14} />
          AI 묵상 읽기
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      )}
    </div>
  )
}

export default DayCard
