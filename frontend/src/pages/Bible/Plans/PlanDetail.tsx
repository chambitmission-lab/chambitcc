// 읽기 플랜 상세 (/bible/plans/:planId)
// 구독 · 일자별 완료 토글(+confetti) · 스트릭 · AI 묵상 · 본문 바로 읽기
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  useBiblePlan,
  useCompleteDay,
  useRestartPlan,
  useSubscribePlan,
  useUncompleteDay,
  useUnsubscribePlan,
} from '../../../hooks/useBiblePlan'
import { generateReflection } from '../../../api/biblePlan'
import type { PlanDay, PlanReflection } from '../../../types/biblePlan'
import { isAuthenticated } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import { accentGradient, gradientTextStyle } from './planVisuals'

interface ReflectionState {
  loading: boolean
  data?: PlanReflection
  error?: string
}

const PlanDetail = () => {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const id = Number(planId)

  const { data: plan, isLoading, error } = useBiblePlan(id)
  const subscribe = useSubscribePlan()
  const unsubscribe = useUnsubscribePlan()
  const restart = useRestartPlan()
  const completeDay = useCompleteDay()
  const uncompleteDay = useUncompleteDay()

  const [reflections, setReflections] = useState<Record<number, ReflectionState>>({})
  const [openReflection, setOpenReflection] = useState<number | null>(null)

  const grad = accentGradient(plan?.accent)
  const progress = plan?.progress
  const subscribed = !!progress?.subscribed

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#a855f7', '#ec4899', '#d946ef', '#f472b6'],
    })
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated()) {
      showToast('로그인이 필요합니다', 'error')
      navigate('/login')
      return
    }
    try {
      await subscribe.mutateAsync({ planId: id })
      showToast('플랜을 시작했어요! 오늘 분량부터 읽어볼까요?', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleToggleDay = async (day: PlanDay) => {
    if (!isAuthenticated()) {
      showToast('로그인이 필요합니다', 'error')
      navigate('/login')
      return
    }
    try {
      if (day.completed) {
        await uncompleteDay.mutateAsync({ planId: id, dayNumber: day.day_number })
      } else {
        await completeDay.mutateAsync({ planId: id, dayNumber: day.day_number })
        fireConfetti()
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleRead = (day: PlanDay) => {
    const first = day.passages[0]
    if (first) navigate(`/bible/${first.book_number}/${first.chapter_start}`)
  }

  const handleReflect = async (day: PlanDay) => {
    setOpenReflection((prev) => (prev === day.day_number ? null : day.day_number))
    if (reflections[day.day_number]?.data || reflections[day.day_number]?.loading) return
    setReflections((prev) => ({ ...prev, [day.day_number]: { loading: true } }))
    try {
      const data = await generateReflection(id, day.day_number)
      setReflections((prev) => ({ ...prev, [day.day_number]: { loading: false, data } }))
    } catch (e) {
      setReflections((prev) => ({
        ...prev,
        [day.day_number]: {
          loading: false,
          error: e instanceof Error ? e.message : '생성 실패',
        },
      }))
    }
  }

  const handleUnsubscribe = async () => {
    if (!confirm('이 플랜을 그만두시겠어요? 진행 기록이 사라집니다.')) return
    try {
      await unsubscribe.mutateAsync(id)
      showToast('플랜을 그만뒀어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleRestart = async () => {
    if (!confirm('처음부터 다시 시작할까요? 진행 기록이 초기화됩니다.')) return
    try {
      await restart.mutateAsync(id)
      showToast('처음부터 다시 시작해요!', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const startTodaysReading = () => {
    if (!plan) return
    const today = plan.days.find((d) => d.day_number === (progress?.current_day ?? 1))
    if (today) handleRead(today)
  }

  if (isLoading) {
    return (
      <Shell onBack={() => navigate('/bible/plans')} title="읽기 플랜">
        <div className="px-4 pt-4 space-y-3">
          <div className="h-32 rounded-3xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      </Shell>
    )
  }

  if (error || !plan) {
    return (
      <Shell onBack={() => navigate('/bible/plans')} title="읽기 플랜">
        <div className="text-center py-16 px-6">
          <span className="text-4xl block mb-3">😢</span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            플랜을 불러오지 못했습니다
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell onBack={() => navigate('/bible/plans')} title={plan.title}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-purple-200/60 dark:border-white/[0.08] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-[#1e1b4b]/60 dark:to-[#4c1d95]/35 shadow-[0_4px_18px_-8px_rgba(168,85,247,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(168,85,247,0.12)]">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-purple-500 to-pink-500" />
        <div className="relative z-10 flex items-start gap-3.5">
          <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-[22px] shadow-[0_6px_18px_-6px_rgba(168,85,247,0.6)]`}>
            {plan.emoji || '📖'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-purple-600 dark:text-purple-300">
                {plan.total_days}일 플랜
              </span>
              {plan.level && (
                <span className="text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                  · {plan.level}
                </span>
              )}
            </div>
            <h2 className="text-[20px] font-bold tracking-[-0.015em] leading-[1.3] text-gray-900 dark:text-white mt-0.5">
              {plan.title}
            </h2>
            {plan.subtitle && (
              <p className="text-[13px] text-gray-600 dark:text-white/65 mt-1">{plan.subtitle}</p>
            )}
          </div>
        </div>
        {plan.description && (
          <p className="relative z-10 text-[13px] leading-[1.7] text-gray-600 dark:text-white/70 mt-3.5">
            {plan.description}
          </p>
        )}
      </section>

      {/* 진행 / 시작 */}
      {subscribed && progress ? (
        <section className="mx-4 mt-4 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
          <div className="flex items-center justify-around text-center">
            <Stat value={`${progress.percent}%`} label="진행률" />
            <Divider />
            <Stat value={`${progress.completed_days}/${progress.total_days}`} label="완료" />
            <Divider />
            <Stat value={`🔥 ${progress.streak_count}`} label="연속" plain />
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${grad}`}
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
          {progress.status === 'completed' ? (
            <div className="mt-4 text-center">
              <p className="text-[14px] font-bold text-gray-900 dark:text-white">🎉 완주를 축하해요!</p>
              <button
                onClick={handleRestart}
                className="mt-2 text-[13px] font-semibold text-purple-600 dark:text-purple-300 hover:underline"
              >
                처음부터 다시 시작
              </button>
            </div>
          ) : (
            <button
              onClick={startTodaysReading}
              className={`mt-4 w-full py-3 rounded-xl bg-gradient-to-r ${grad} text-white text-[14px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all`}
            >
              오늘 분량 읽기 · {progress.current_day}일차
            </button>
          )}
          <div className="mt-3 flex items-center justify-center gap-4">
            <button onClick={handleRestart} className="text-[12px] text-gray-400 dark:text-white/45 hover:text-purple-500">
              다시 시작
            </button>
            <button onClick={handleUnsubscribe} className="text-[12px] text-gray-400 dark:text-white/45 hover:text-red-500">
              그만두기
            </button>
          </div>
        </section>
      ) : (
        <section className="mx-4 mt-4">
          <button
            onClick={handleSubscribe}
            disabled={subscribe.isPending}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${grad} text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(168,85,247,0.65)] hover:-translate-y-0.5 transition-all disabled:opacity-50`}
          >
            {subscribe.isPending ? '시작하는 중...' : '이 플랜 시작하기'}
          </button>
          <p className="text-center text-[12px] text-gray-400 dark:text-white/45 mt-2">
            {plan.total_days}일 동안 매일 함께 읽어요
          </p>
        </section>
      )}

      {/* 일정 */}
      <section className="px-4 pt-6 pb-4">
        <h3 className="text-[13px] font-bold text-gray-500 dark:text-white/55 mb-3 px-1">
          전체 일정 ({plan.days.length}일)
        </h3>
        <div className="space-y-2.5">
          {plan.days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              grad={grad}
              subscribed={subscribed}
              isToday={subscribed && day.day_number === progress?.current_day}
              busy={completeDay.isPending || uncompleteDay.isPending}
              onToggle={() => handleToggleDay(day)}
              onRead={() => handleRead(day)}
              onReflect={() => handleReflect(day)}
              reflectionOpen={openReflection === day.day_number}
              reflection={reflections[day.day_number]}
            />
          ))}
        </div>
      </section>
    </Shell>
  )
}

// ── Shell (헤더 + 컨테이너) ──
const Shell = ({
  onBack,
  title,
  children,
}: {
  onBack: () => void
  title: string
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
    <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white truncate">
          {title}
        </h1>
      </div>
      {children}
    </div>
  </div>
)

const Stat = ({ value, label, plain }: { value: string; label: string; plain?: boolean }) => (
  <div>
    <p className="text-[18px] font-bold" style={plain ? undefined : gradientTextStyle}>
      {value}
    </p>
    <p className="text-[11px] text-gray-400 dark:text-white/45 mt-0.5">{label}</p>
  </div>
)

const Divider = () => <span className="w-px h-8 bg-gray-200 dark:bg-white/[0.08]" />

// ── 하루치 카드 ──
const DayCard = ({
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
}: {
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
}) => {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl border transition-all',
        'bg-white/80 dark:bg-card-dark shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        isToday
          ? 'border-purple-300/60 dark:border-purple-400/40 ring-1 ring-purple-300/40 dark:ring-purple-400/25'
          : 'border-gray-200/70 dark:border-white/[0.08]',
        day.completed && !isToday ? 'opacity-80' : '',
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
                ? `bg-gradient-to-br ${grad} text-white shadow-[0_4px_12px_-4px_rgba(168,85,247,0.55)]`
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 hover:bg-gray-200 dark:hover:bg-white/[0.1]',
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
          <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55 flex items-center justify-center font-bold text-[13px]">
            {day.day_number}
          </div>
        )}

        {/* 본문 정보 */}
        <button type="button" onClick={onRead} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            {isToday && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 tracking-[0.05em]">
                오늘
              </span>
            )}
            <span className="text-[10px] font-semibold text-gray-400 dark:text-white/40">
              {day.day_number}일차
            </span>
          </div>
          {day.title && (
            <p className="text-[14px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate mt-0.5">
              {day.title}
            </p>
          )}
          <p className="text-[12px] text-purple-600 dark:text-purple-300/90 truncate mt-0.5">
            {day.passages.map((p) => p.reference).filter(Boolean).join(' · ')}
          </p>
        </button>

        {/* 읽기 화살표 */}
        <button
          type="button"
          onClick={onRead}
          aria-label="본문 읽기"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 묵상 영역 */}
      <div className="relative z-10 px-3.5 pb-3 -mt-1">
        {day.reflection_prompt && (
          <p className="text-[12.5px] leading-[1.6] text-gray-600 dark:text-white/65 bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2 mb-2">
            💬 {day.reflection_prompt}
          </p>
        )}
        <button
          type="button"
          onClick={onReflect}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-purple-600 dark:text-purple-300 hover:underline"
        >
          <span>✨</span>
          {reflectionOpen ? 'AI 묵상 닫기' : 'AI 묵상 보기'}
        </button>

        {reflectionOpen && (
          <div className="mt-2 rounded-xl bg-purple-50/70 dark:bg-purple-500/[0.06] border border-purple-200/50 dark:border-purple-400/20 px-3.5 py-3">
            {reflection?.loading ? (
              <p className="text-[12.5px] text-gray-500 dark:text-white/55">묵상을 준비하고 있어요…</p>
            ) : reflection?.error ? (
              <p className="text-[12.5px] text-red-500 dark:text-red-300">{reflection.error}</p>
            ) : reflection?.data ? (
              <div>
                <p className="text-[13px] leading-[1.7] text-gray-700 dark:text-white/80 whitespace-pre-wrap">
                  {reflection.data.reflection}
                </p>
                {reflection.data.questions.length > 0 && (
                  <ul className="mt-2.5 space-y-1.5">
                    {reflection.data.questions.map((q, i) => (
                      <li key={i} className="text-[12.5px] text-purple-700 dark:text-purple-200 flex gap-1.5">
                        <span className="opacity-60">Q{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlanDetail
