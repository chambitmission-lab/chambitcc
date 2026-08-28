// 읽기 플랜 상세 (/bible/plans/:planId)
// 구독 · 일자별 완료 토글(+confetti) · 스트릭 · AI 묵상 · 본문 바로 읽기
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
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
import { accentGradient } from './planVisuals'
import { planCover } from './planCovers'
import {
  BookOpenIcon,
  ChevronRightIcon,
  FlagIcon,
  UsersIcon,
} from '../../../components/icons/ActionIcons'
import DayCard from './components/DayCard'
import ReflectionSheet from './components/ReflectionSheet'
import ReflectionEditModal from './components/ReflectionEditModal'
import { confirmDialog } from '../../../utils/confirmDialog'

// 긴 플랜(90/120/365일)은 일정을 30일 단위로 접어 스크롤 부담을 줄인다.
// 짧은 플랜(7/30일)은 그룹 헤더가 오히려 방해라 플랫 렌더 유지.
const GROUP_SIZE = 30
const GROUP_THRESHOLD = 60

// 통계 숫자 — 자릿수가 바뀌어도 흔들리지 않게 고정폭 숫자
const numStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums' }

// 히어로 커버 — 오른쪽은 그대로, 왼쪽(글이 놓이는 쪽)으로 갈수록 투명해지는 마스크
const HERO_MASK = 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 26%, #000 62%)'

// 'YYYY-MM-DD' → 'YYYY.MM.DD' (서버가 KST 달력일을 주므로 Date 변환 없이 문자열만 다듬는다)
const formatPlanDate = (value?: string | null): string | null => {
  const [y, m, d] = (value ?? '').slice(0, 10).split('-')
  return y && m && d ? `${y}.${m}.${d}` : null
}

// 시작일 + (총 일수 - 1) = 완료 예정일
const planEndDate = (start?: string | null, totalDays?: number | null): string | null => {
  const [y, m, d] = (start ?? '').slice(0, 10).split('-').map(Number)
  if (!y || !m || !d || !totalDays) return null
  const dt = new Date(y, m - 1, d + totalDays - 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`
}

const PlanDetail = () => {
  const navigate = useNavigate()
  const { planId } = useParams<{ planId: string }>()
  const id = Number(planId)

  const { data: plan, isLoading, refetch, isFetching } = useBiblePlan(id)
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
  const [shareCopied, setShareCopied] = useState(false)
  // 그룹 접힘 상태 — 명시적으로 토글한 그룹만 기록하고,
  // 기록이 없으면 "현재 일차가 속한 그룹만 펼침"을 기본값으로 쓴다 (플랜 로딩 타이밍 무관)
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({})
  const admin = isAdmin()

  const grad = accentGradient(plan?.accent)
  const cover = planCover(plan?.slug)
  const progress = plan?.progress
  const subscribed = !!progress?.subscribed
  // 여정의 시작과 끝 — "언제 시작했고 언제 끝나는지"가 장기 플랜에서 가장 큰 동기가 된다
  const startLabel = formatPlanDate(progress?.start_date)
  const endLabel = planEndDate(progress?.start_date, progress?.total_days ?? plan?.total_days)

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
    if (
      !(await confirmDialog({
        title: '플랜 그만두기',
        message: '이 플랜을 그만두시겠어요?',
        description: '지금까지의 진행 기록이 사라집니다.',
        confirmText: '그만두기',
        icon: 'logout',
      }))
    )
      return
    try {
      await unsubscribe.mutateAsync(id)
      showToast('플랜을 그만뒀어요', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleRestart = async () => {
    if (
      !(await confirmDialog({
        title: '처음부터 다시 시작',
        message: '처음부터 다시 시작할까요?',
        description: '지금까지의 진행 기록이 초기화됩니다.',
        confirmText: '다시 시작',
        tone: 'warning',
        icon: 'restart_alt',
      }))
    )
      return
    try {
      await restart.mutateAsync(id)
      showToast('처음부터 다시 시작해요!', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '오류가 발생했습니다', 'error')
    }
  }

  const handleShare = async () => {
    if (!plan) return
    const url = window.location.href
    const text = `${plan.title} — ${plan.subtitle || `${plan.total_days}일 성경 읽기 플랜`}`
    if (navigator.share) {
      try {
        await navigator.share({ title: plan.title, text, url })
      } catch {
        // 사용자가 공유 시트를 닫은 경우 — 무시
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1600)
      showToast('링크를 복사했어요', 'success')
    } catch {
      // 클립보드 접근 불가 환경 — 조용히 무시
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

  // 에러여도 캐시된 plan 이 있으면 그대로 렌더 — 일시적 실패가 화면을 가리지 않게
  if (!plan) {
    return (
      <Shell onBack={() => navigate('/bible/plans')} title="읽기 플랜">
        <div className="text-center py-16 px-6">
          <span className="text-4xl block mb-3">😢</span>
          <p className="text-[13px] text-gray-500 dark:text-white/55">
            플랜을 불러오지 못했습니다
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-5 px-5 py-2.5 rounded-full bg-brand text-white text-[13px] font-bold tracking-[-0.01em] shadow-[0_4px_14px_-4px_var(--brand-glow)] transition-all duration-150 active:scale-95 disabled:opacity-60"
          >
            {isFetching ? '불러오는 중…' : '다시 시도'}
          </button>
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
    />
  )

  const reflectionDay =
    openReflection !== null
      ? plan.days.find((d) => d.day_number === openReflection) ?? null
      : null

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

  // 플랜 소개(히어로) + 진행/시작 카드 — 본문(모바일)과 우측 레일(lg+)이 같은 마크업을 공유한다.
  // 365일짜리 일정을 한참 내려도 진행률과 '오늘 분량 읽기'가 옆에 남는 게 이 화면의 핵심이다.
  const renderPlanIntro = (cls: string) => (
    <div className={cls}>
      {/* Hero — 왼쪽은 글, 오른쪽은 커버 사진.
          사진 전체를 흐리게 덮으면 얼룩처럼 보여서, 오른쪽 절반에만 두고
          왼쪽으로 갈수록 카드 바탕색에 녹아 사라지게(마스크+베일) 만든다. */}
      <section className="relative overflow-hidden rounded-3xl mx-4 mt-4 min-h-[152px] bg-white dark:bg-card-dark shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_10px_30px_-18px_rgba(16,32,64,0.5)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07),0_10px_30px_-18px_rgba(0,0,0,0.6)]">
        {cover ? (
          <div className="absolute inset-y-0 right-0 w-[42%] lg:w-[36%] pointer-events-none" aria-hidden>
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover object-[72%_50%] dark:opacity-85"
              style={{
                maskImage: HERO_MASK,
                WebkitMaskImage: HERO_MASK,
              }}
            />
            {/* 글이 시작되는 왼쪽 끝은 카드 바탕색으로 완전히 덮어 가독성을 지킨다 */}
            <div className="absolute inset-0 dark:hidden bg-[linear-gradient(to_right,#fff_0%,rgba(255,255,255,0.55)_30%,transparent_72%)]" />
            <div className="absolute inset-0 hidden dark:block bg-[linear-gradient(to_right,#201f1f_0%,rgba(32,31,31,0.55)_30%,transparent_72%)]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-[#172554]/60 dark:to-[#1e3a8a]/35" />
        )}

        <button
          type="button"
          onClick={handleShare}
          aria-label="플랜 공유"
          className="absolute right-3.5 top-3.5 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-white/75 dark:bg-white/[0.1] shadow-[0_2px_10px_-4px_rgba(16,32,64,0.4)] ring-1 ring-black/[0.04] dark:ring-white/[0.12] text-gray-500 dark:text-white/70 backdrop-blur-md transition-all active:scale-95 hover:text-brand"
        >
          {shareCopied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13" />
              <polyline points="8 7 12 3 16 7" />
              <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </svg>
          )}
        </button>

        <div className={`relative z-10 p-5 ${cover ? 'pr-[36%] lg:pr-[28%]' : ''}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full bg-[var(--brand-soft-strong)] text-[10.5px] font-bold text-brand">
              <BookOpenIcon size={12} strokeWidth={2} />
              {plan.total_days}일 플랜
            </span>
            {plan.level && (
              <span className="text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                · {plan.level}
              </span>
            )}
            {(plan.participant_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                ·<UsersIcon size={12} strokeWidth={2} />
                {(plan.participant_count ?? 0).toLocaleString()}명
              </span>
            )}
            {(plan.completed_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                ·<FlagIcon size={12} strokeWidth={2} />
                {(plan.completed_count ?? 0).toLocaleString()}명 완주
              </span>
            )}
          </div>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] leading-[1.28] text-ink-strong mt-1.5">
            {plan.title}
          </h2>
          {plan.subtitle && (
            <p className="text-[13px] font-medium text-gray-600 dark:text-white/65 mt-1">
              {plan.subtitle}
            </p>
          )}

          {plan.description && (
            <>
              <span className="block h-px my-3.5 bg-gradient-to-r from-gray-200/90 dark:from-white/[0.1] to-transparent" />
              <p className="text-[13px] leading-[1.75] text-gray-600 dark:text-white/70">
                {plan.description}
              </p>
            </>
          )}
        </div>
      </section>

      {/* 진행 / 시작 */}
      {subscribed && progress ? (
        <section className="mx-4 mt-3 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4">
          <div className="flex items-center gap-2">
            {/* 진행률 — 숫자만 있던 자리를 링으로 바꿔 "얼마나 걸어왔는지"가 한눈에 보이게 */}
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <ProgressRing percent={progress.percent} />
              <span className="text-[10.5px] font-semibold text-gray-400 dark:text-white/45">
                진행률
              </span>
            </div>
            <Divider />
            <div className="flex-1 min-w-0 flex items-center justify-around text-center">
              <div>
                <p className="text-[19px] font-bold text-brand" style={numStyle}>
                  {progress.completed_days}
                  <span className="text-[13px] font-semibold text-gray-400 dark:text-white/40">
                    {' / '}
                    {progress.total_days}
                  </span>
                </p>
                <p className="text-[10.5px] font-semibold text-gray-400 dark:text-white/45 mt-0.5">
                  일자
                </p>
              </div>
              <Divider />
              <div>
                <p className="text-[19px] font-bold text-ink-strong" style={numStyle}>
                  🔥 {progress.streak_count}
                </p>
                <p className="text-[10.5px] font-semibold text-gray-400 dark:text-white/45 mt-0.5">
                  연속일
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3.5 h-2 rounded-full bg-gray-100 dark:bg-white/[0.08] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${grad} transition-[width] duration-500`}
              style={{ width: `${Math.min(100, progress.percent)}%` }}
            />
          </div>
          {(startLabel || endLabel) && (
            <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px] font-semibold text-gray-400 dark:text-white/40">
              <span>{startLabel ? `시작일 ${startLabel}` : ''}</span>
              <span>{endLabel ? `완료 예정일 ${endLabel}` : ''}</span>
            </div>
          )}

          {progress.status === 'completed' ? (
            <div className="mt-4 text-center">
              <p className="text-[14px] font-bold text-ink-strong">🎉 완주를 축하해요!</p>
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
              className="relative mt-4 w-full flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[14px] font-bold seal-chip [--seal-radius:1rem] [--seal-drop:0_8px_24px_-8px_var(--brand-glow)] hover:[--seal-drop:0_10px_28px_-6px_var(--brand-glow)] active:scale-[0.99] transition-[box-shadow,transform] duration-150"
            >
              <BookOpenIcon size={17} strokeWidth={1.9} className="shrink-0 opacity-90" />
              <span className="flex-1 text-center">
                오늘 분량 읽기 · {progress.current_day}일차
              </span>
              <ChevronRightIcon size={15} strokeWidth={2.4} className="shrink-0 opacity-80" />
            </button>
          )}
        </section>
      ) : (
        <section className="mx-4 mt-3">
          <button
            onClick={handleSubscribe}
            disabled={subscribe.isPending}
            className={`relative w-full py-3.5 rounded-2xl bg-gradient-to-r ${grad} text-white text-[15px] font-bold seal-chip [--seal-radius:1rem] [--seal-drop:0_10px_30px_-8px_var(--brand-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-50`}
          >
            {subscribe.isPending ? '시작하는 중...' : '이 플랜 시작하기'}
          </button>
          <p className="text-center text-[12px] text-gray-400 dark:text-white/45 mt-2">
            {(plan.participant_count ?? 0) > 0
              ? `지금 ${(plan.participant_count ?? 0).toLocaleString()}명이 함께 읽고 있어요`
              : `${plan.total_days}일 동안 매일 함께 읽어요`}
          </p>
        </section>
      )}
    </div>
  )

  return (
    <Shell
      onBack={() => navigate('/bible/plans')}
      title={plan.title}
      actions={planMenu}
      rail={renderPlanIntro('')}
    >
      {renderPlanIntro('lg:hidden')}

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
                      <span className="block text-[14px] font-bold tracking-[-0.01em] text-ink-strong">
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
                  {open && (
                    // lg+: 펼친 일차 카드는 한 줄짜리라 2열로 훑는 편이 빠르다
                    <div className="space-y-2.5 mt-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 lg:items-start">
                      {groupDays.map(renderDay)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0 lg:items-start">
            {plan.days.map(renderDay)}
          </div>
        )}
      </section>

      {/* AI 묵상 읽기 시트 */}
      {reflectionDay && (
        <ReflectionSheet
          dayNumber={reflectionDay.day_number}
          dayTitle={reflectionDay.title}
          passageLabel={reflectionDay.passages
            .map((p) => p.reference)
            .filter(Boolean)
            .join(' · ')}
          state={reflections[reflectionDay.day_number]}
          admin={admin}
          regenerating={regeneratingDay === reflectionDay.day_number}
          onEdit={() => setEditingDay(reflectionDay.day_number)}
          onRegenerate={() => regenerateReflection(reflectionDay.day_number)}
          onRead={() => handleRead(reflectionDay)}
          onClose={() => toggleReflection(reflectionDay.day_number)}
        />
      )}

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
  rail,
  children,
}: {
  onBack: () => void
  title: string
  actions?: React.ReactNode
  // rail 을 주면 lg+ 에서 2단(본문 + 우측 위젯 레일), 없으면 기존 좁은 셸 그대로
  rail?: React.ReactNode
  children: React.ReactNode
}) => (
  <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
    <div
      className={
        rail ? 'lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12' : ''
      }
    >
    <div
      className={`max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-bottomnav-safe ${
        rail
          ? 'lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:min-h-0 lg:rounded-3xl lg:border lg:overflow-hidden'
          : ''
      }`}
    >
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
        <h1 className="flex-1 min-w-0 text-base font-bold tracking-[-0.015em] text-ink-strong truncate">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>

    {rail && (
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:sticky lg:top-[4.5rem]">
        {rail}
      </aside>
    )}
    </div>
  </div>
)

// 진행률 링 — 퍼센트 숫자만으로는 안 보이던 "걸어온 만큼"을 원호로 보여준다
const ProgressRing = ({ percent, size = 58 }: { percent: number; size?: number }) => {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200/90 dark:stroke-white/[0.1]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="var(--brand)"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-brand"
        style={numStyle}
      >
        {pct}%
      </span>
    </div>
  )
}

const Divider = () => <span className="w-px h-8 bg-gray-200 dark:bg-white/[0.08]" />

export default PlanDetail
