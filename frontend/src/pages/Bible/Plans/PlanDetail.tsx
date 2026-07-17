// 읽기 플랜 상세 (/bible/plans/:planId)
// 구독 · 일자별 완료 토글(+confetti) · 스트릭 · AI 묵상 · 본문 바로 읽기
import { useEffect, useRef, useState } from 'react'
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
import { usePlanReflections } from '../../../hooks/usePlanReflections'
import type { PlanDay } from '../../../types/biblePlan'
import { isAdmin, isAuthenticated } from '../../../utils/auth'
import { showToast } from '../../../utils/toast'
import { accentGradient, gradientTextStyle } from './planVisuals'
import DayCard from './components/DayCard'
import ReflectionEditModal from './components/ReflectionEditModal'

// 긴 플랜(90/120/365일)은 일정을 30일 단위로 접어 스크롤 부담을 줄인다.
// 짧은 플랜(7/30일)은 그룹 헤더가 오히려 방해라 플랫 렌더 유지.
const GROUP_SIZE = 30
const GROUP_THRESHOLD = 60

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

  const {
    reflections,
    openReflection,
    editingDay,
    setEditingDay,
    regeneratingDay,
    toggleReflection,
    regenerateReflection,
    saveReflection,
  } = usePlanReflections(id)
  const [menuOpen, setMenuOpen] = useState(false)
  // 그룹 접힘 상태 — 명시적으로 토글한 그룹만 기록하고,
  // 기록이 없으면 "현재 일차가 속한 그룹만 펼침"을 기본값으로 쓴다 (플랜 로딩 타이밍 무관)
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({})
  const admin = isAdmin()

  const grad = accentGradient(plan?.accent)
  const progress = plan?.progress
  const subscribed = !!progress?.subscribed

  // 긴 플랜(50일차쯤)에서 매번 스크롤해 내려가지 않도록, 진입 시 오늘 일차 카드로 자동 스크롤.
  // 초반(1~3일차)은 카드가 이미 화면 근처라 스크롤하면 오히려 대시보드가 가려져 스킵한다.
  const autoScrolledRef = useRef(false)
  useEffect(() => {
    if (autoScrolledRef.current) return
    if (!plan || !subscribed || !progress) return
    if (progress.status === 'completed') return
    const currentDay = progress.current_day ?? 1
    if (currentDay <= 3) return
    const el = document.getElementById(`plan-day-${currentDay}`)
    if (!el) return
    autoScrolledRef.current = true
    const timer = setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 200)
    return () => clearTimeout(timer)
  }, [plan, subscribed, progress])

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#3182f6', '#60a5fa', '#38bdf8', '#93c5fd'],
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
    if (first) {
      // 플랜/일차 정보를 함께 넘겨, 본문을 다 읽으면 해당 일차가 자동 완료되도록 한다.
      navigate(
        `/bible/${first.book_number}/${first.chapter_start}?plan=${id}&day=${day.day_number}`,
      )
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

  const grouped = plan.days.length > GROUP_THRESHOLD
  const groups: PlanDay[][] = []
  if (grouped) {
    for (let i = 0; i < plan.days.length; i += GROUP_SIZE) {
      groups.push(plan.days.slice(i, i + GROUP_SIZE))
    }
  }
  const currentGroupIdx = subscribed
    ? Math.floor(((progress?.current_day ?? 1) - 1) / GROUP_SIZE)
    : 0
  const isGroupOpen = (gi: number) => openGroups[gi] ?? gi === currentGroupIdx
  const toggleGroup = (gi: number) =>
    setOpenGroups((prev) => ({ ...prev, [gi]: !isGroupOpen(gi) }))

  const renderDay = (day: PlanDay) => (
    <DayCard
      key={day.id}
      domId={`plan-day-${day.day_number}`}
      day={day}
      grad={grad}
      subscribed={subscribed}
      isToday={subscribed && day.day_number === progress?.current_day}
      busy={completeDay.isPending || uncompleteDay.isPending}
      onToggle={() => handleToggleDay(day)}
      onRead={() => handleRead(day)}
      onReflect={() => toggleReflection(day.day_number)}
      reflectionOpen={openReflection === day.day_number}
      reflection={reflections[day.day_number]}
      admin={admin}
      regenerating={regeneratingDay === day.day_number}
      onEditReflection={() => setEditingDay(day.day_number)}
      onRegenerate={() => regenerateReflection(day.day_number)}
    />
  )

  // 다시 시작/그만두기 — 파괴적·부정적 액션이라 메인 CTA 옆이 아닌 헤더 ⋮ 메뉴로 격리
  const planMenu = subscribed ? (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="플랜 관리"
        aria-expanded={menuOpen}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-9 z-40 w-44 py-1.5 rounded-xl bg-white dark:bg-[#1c1c26] border border-gray-200 dark:border-white/[0.1] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                handleRestart()
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              처음부터 다시 시작
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                handleUnsubscribe()
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
              플랜 그만두기
            </button>
          </div>
        </>
      )}
    </div>
  ) : undefined

  return (
    <Shell onBack={() => navigate('/bible/plans')} title={plan.title} actions={planMenu}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 p-5 border border-blue-200/60 dark:border-white/[0.08] bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35 shadow-[0_4px_18px_-8px_rgba(49,130,246,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_0_1px_rgba(49,130,246,0.12)]">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-blue-500 to-sky-400" />
        <div className="relative z-10 flex items-start gap-3.5">
          <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-[22px] shadow-[0_6px_18px_-6px_rgba(49,130,246,0.6)]`}>
            {plan.emoji || '📖'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-300">
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
                className="mt-2 text-[13px] font-semibold text-blue-600 dark:text-blue-300 hover:underline"
              >
                처음부터 다시 시작
              </button>
            </div>
          ) : (
            <button
              onClick={startTodaysReading}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[14px] font-bold shadow-[0_8px_24px_-8px_rgba(49,130,246,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(49,130,246,0.7)] transition-all"
            >
              오늘 분량 읽기 · {progress.current_day}일차
            </button>
          )}
        </section>
      ) : (
        <section className="mx-4 mt-4">
          <button
            onClick={handleSubscribe}
            disabled={subscribe.isPending}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${grad} text-white text-[15px] font-bold shadow-[0_10px_30px_-8px_rgba(49,130,246,0.65)] hover:-translate-y-0.5 transition-all disabled:opacity-50`}
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
        {grouped ? (
          <div className="space-y-2.5">
            {groups.map((groupDays, gi) => {
              const open = isGroupOpen(gi)
              const first = groupDays[0].day_number
              const last = groupDays[groupDays.length - 1].day_number
              const doneCount = groupDays.filter((d) => d.completed).length
              const groupDone = doneCount === groupDays.length
              const isCurrentGroup = subscribed && gi === currentGroupIdx
              return (
                <div key={gi}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(gi)}
                    aria-expanded={open}
                    className={[
                      'w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all text-left',
                      'bg-white/80 dark:bg-card-dark shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                      isCurrentGroup
                        ? 'border-blue-300/60 dark:border-blue-400/40'
                        : 'border-gray-200/70 dark:border-white/[0.08]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold',
                        groupDone
                          ? `bg-gradient-to-br ${grad} text-white`
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
                      ].join(' ')}
                    >
                      {groupDone ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        gi + 1
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-bold tracking-[-0.01em] text-gray-900 dark:text-white">
                        {gi + 1}개월차
                      </span>
                      <span className="block text-[11.5px] text-gray-400 dark:text-white/45 mt-0.5">
                        {first}~{last}일차{subscribed ? ` · ${doneCount}/${groupDays.length} 완료` : ''}
                      </span>
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                      className={`shrink-0 text-gray-400 dark:text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {open && <div className="space-y-2.5 mt-2.5">{groupDays.map(renderDay)}</div>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2.5">{plan.days.map(renderDay)}</div>
        )}
      </section>

      {/* 관리자 — AI 묵상 수정 모달 */}
      {editingDay !== null && reflections[editingDay]?.data && (
        <ReflectionEditModal
          dayNumber={editingDay}
          initial={reflections[editingDay]!.data!}
          onClose={() => setEditingDay(null)}
          onSave={(reflection, questions) =>
            saveReflection(editingDay, reflection, questions)
          }
        />
      )}
    </Shell>
  )
}

// ── Shell (헤더 + 컨테이너) ──
const Shell = ({
  onBack,
  title,
  actions,
  children,
}: {
  onBack: () => void
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
    <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-bottomnav-safe">
      <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          aria-label="뒤로"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white truncate">
          {title}
        </h1>
        {actions}
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

export default PlanDetail
