// ── 하루치 카드 ──
// 상태별 시각 위계: 완료(과거) = 딤드 / 오늘 = 블루 하이라이트 / 예정(미래) = 아웃라인 원 + 차분한 텍스트
import type { PlanDay } from '../../../../types/biblePlan'
import type { ReflectionState } from '../../../../hooks/usePlanReflections'
import { normalizeReflection } from '../reflectionText'

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
  reflectionOpen,
  reflection,
  admin,
  regenerating,
  onEditReflection,
  onRegenerate,
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
  reflectionOpen: boolean
  reflection?: ReflectionState
  admin: boolean
  regenerating: boolean
  onEditReflection: () => void
  onRegenerate: () => void
}) => {
  const isPast = day.completed && !isToday
  const isFuture = subscribed && !day.completed && !isToday
  // AI 묵상·묵상 프롬프트는 "읽은(읽는) 날"에만 — 미래 일차에 미리 노출하면 플로우가 어색하고 카드만 길어진다.
  // 미구독 상태에서는 둘러보기용 미리보기로 그대로 열어둔다.
  const showReflectionArea = !subscribed || day.completed || isToday

  return (
    <div
      id={domId}
      className={[
        'relative overflow-hidden rounded-2xl border transition-all',
        'bg-white/80 dark:bg-card-dark shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        isToday
          ? 'border-blue-300/60 dark:border-blue-400/40 ring-1 ring-blue-300/40 dark:ring-blue-400/25'
          : 'border-gray-200/70 dark:border-white/[0.08]',
        isPast ? 'opacity-55' : '',
      ].join(' ')}
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative z-10 flex items-center gap-3 p-3.5">
        {/* 완료 토글 / 일자 */}
        {subscribed ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            aria-label={day.completed ? '완료 취소' : '완료'}
            className={[
              'shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] transition-all',
              day.completed
                ? `bg-gradient-to-br ${grad} text-white shadow-[0_4px_12px_-4px_rgba(49,130,246,0.55)]`
                : isToday
                  ? 'border-2 border-blue-400/70 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20'
                  : 'border-2 border-gray-200 dark:border-white/[0.13] bg-transparent text-gray-400 dark:text-white/40 hover:border-blue-400/50 hover:text-blue-500 dark:hover:text-blue-300',
            ].join(' ')}
          >
            {day.completed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              day.day_number
            )}
          </button>
        ) : (
          <div className="shrink-0 w-9 h-9 rounded-full border-2 border-gray-200 dark:border-white/[0.13] text-gray-400 dark:text-white/45 flex items-center justify-center font-bold text-[13px]">
            {day.day_number}
          </div>
        )}

        {/* 본문 정보 */}
        <button type="button" onClick={onRead} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            {isToday && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 tracking-[0.05em]">
                오늘
              </span>
            )}
            <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40">
              {day.day_number}일차
            </span>
          </div>
          {day.title && (
            <p
              className={`text-[14px] font-bold tracking-[-0.01em] truncate mt-0.5 ${
                isFuture ? 'text-gray-600 dark:text-white/65' : 'text-gray-900 dark:text-white'
              }`}
            >
              {day.title}
            </p>
          )}
          <p
            className={`text-[12px] truncate mt-0.5 ${
              isFuture
                ? 'text-blue-600/70 dark:text-blue-300/60'
                : 'text-blue-600 dark:text-blue-300/90'
            }`}
          >
            {day.passages.map((p) => p.reference).filter(Boolean).join(' · ')}
          </p>
        </button>

        {/* 읽기 화살표 */}
        <button
          type="button"
          onClick={onRead}
          aria-label="본문 읽기"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 묵상 영역 — 완료했거나 오늘인 일차에만 (미구독 시엔 미리보기로 항상) */}
      {showReflectionArea && (
      <div className="relative z-10 px-3.5 pb-3 -mt-1">
        {day.reflection_prompt && (
          <p className="text-[12.5px] leading-[1.6] text-gray-600 dark:text-white/65 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2 mb-2">
            💬 {day.reflection_prompt}
          </p>
        )}
        <button
          type="button"
          onClick={onReflect}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 dark:text-blue-300 hover:underline"
        >
          <span>✨</span>
          {reflectionOpen ? 'AI 묵상 닫기' : 'AI 묵상 보기'}
        </button>

        {reflectionOpen && (
          <div className="mt-2 rounded-xl bg-blue-50/70 dark:bg-blue-500/[0.06] border border-blue-200/50 dark:border-blue-400/20 px-3.5 py-3">
            {reflection?.loading ? (
              reflection.streamText ? (
                // SSE 스트리밍 중 — 도착한 본문을 실시간 표시 (타자기 효과)
                <p className="text-[13px] leading-[1.7] text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                  {normalizeReflection(reflection.streamText)}
                  <span
                    className="inline-block w-[2px] h-[1em] ml-0.5 align-[-0.15em] bg-blue-500 dark:bg-blue-300 animate-pulse"
                    aria-hidden
                  />
                </p>
              ) : (
                <p className="text-[12.5px] text-gray-500 dark:text-white/55">묵상을 준비하고 있어요…</p>
              )
            ) : reflection?.error ? (
              <p className="text-[12.5px] text-red-500 dark:text-red-300">{reflection.error}</p>
            ) : reflection?.data ? (
              <div>
                <p className="text-[13px] leading-[1.7] text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                  {normalizeReflection(reflection.data.reflection)}
                </p>
                {reflection.data.questions.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5">
                    {reflection.data.questions.map((q, i) => (
                      <li key={i} className="text-[12.5px] text-blue-700 dark:text-blue-200 flex gap-1.5">
                        <span className="opacity-60">Q{i + 1}.</span>
                        <span>{normalizeReflection(q)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {admin && (
                  <div className="mt-3 pt-2.5 flex items-center gap-2 border-t border-blue-200/50 dark:border-blue-400/15">
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 tracking-[0.06em]">
                      ADMIN
                    </span>
                    <button
                      type="button"
                      onClick={onEditReflection}
                      className="text-[12px] font-semibold text-blue-600 dark:text-blue-300 hover:underline"
                    >
                      수정
                    </button>
                    <span className="text-gray-300 dark:text-white/15">·</span>
                    <button
                      type="button"
                      onClick={onRegenerate}
                      disabled={regenerating}
                      className="text-[12px] font-semibold text-gray-500 dark:text-white/55 hover:text-blue-500 dark:hover:text-blue-300 disabled:opacity-50"
                    >
                      {regenerating ? '생성 중…' : 'AI로 다시 생성'}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

export default DayCard
