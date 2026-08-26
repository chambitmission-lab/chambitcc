// 공동 기도제목 — 이번 주 교회가 함께 드리는 기도 (교인용)
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  getCurrentWeeklyPrayer,
  getWeeklyPrayer,
  getWeeklyPrayerList,
  toggleWeeklyPrayerAmen,
} from '../../api/weeklyPrayer'
import type { WeeklyPrayer, WeeklyPrayerListItem } from '../../types/weeklyPrayer'

const formatWeekLabel = (weekDate: string): string => {
  const d = new Date(`${weekDate}T00:00:00`)
  if (isNaN(d.getTime())) return weekDate
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 주일`
}

const WeeklyPrayerTopics = () => {
  const navigate = useNavigate()
  const [prayer, setPrayer] = useState<WeeklyPrayer | null>(null)
  const [archive, setArchive] = useState<WeeklyPrayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  // 항목별 토글 요청 중복 방지
  const pendingAmens = useRef<Set<number>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [current, list] = await Promise.all([
          getCurrentWeeklyPrayer().catch((e: Error) => {
            if (e.message === 'NOT_FOUND') return null
            throw e
          }),
          getWeeklyPrayerList().catch(() => [] as WeeklyPrayerListItem[]),
        ])
        setPrayer(current)
        setEmpty(!current)
        setArchive(list)
      } catch {
        setEmpty(true)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleAmen = async (itemId: number | undefined) => {
    if (!itemId) return
    if (!isAuthenticated()) {
      showToast('로그인하면 함께 기도할 수 있어요', 'error')
      navigate('/login')
      return
    }
    if (pendingAmens.current.has(itemId)) return
    pendingAmens.current.add(itemId)

    // 낙관적 업데이트 — 실패 시 서버 응답/롤백으로 복원
    setPrayer((p) =>
      p
        ? {
            ...p,
            items: p.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    is_amened: !item.is_amened,
                    amen_count: (item.amen_count ?? 0) + (item.is_amened ? -1 : 1),
                  }
                : item,
            ),
          }
        : p,
    )
    try {
      const result = await toggleWeeklyPrayerAmen(itemId)
      // 서버 확정값으로 동기화 (참여 인원은 다음 로드 때 갱신)
      setPrayer((p) =>
        p
          ? {
              ...p,
              items: p.items.map((item) =>
                item.id === itemId
                  ? { ...item, is_amened: result.is_amened, amen_count: result.amen_count }
                  : item,
              ),
            }
          : p,
      )
    } catch {
      // 롤백
      setPrayer((p) =>
        p
          ? {
              ...p,
              items: p.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      is_amened: !item.is_amened,
                      amen_count: (item.amen_count ?? 0) + (item.is_amened ? -1 : 1),
                    }
                  : item,
              ),
            }
          : p,
      )
      showToast('잠시 후 다시 시도해 주세요', 'error')
    } finally {
      pendingAmens.current.delete(itemId)
    }
  }

  const selectWeek = async (id: number) => {
    try {
      setPrayer(await getWeeklyPrayer(id))
      setShowArchive(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // 상세 로드 실패 시 현재 화면 유지
    }
  }

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24 lg:max-w-xl lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:overflow-hidden lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">공동 기도제목</h1>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="text-xs font-semibold text-gray-500 dark:text-white/60 hover:text-brand transition-colors"
          >
            지난 주 보기
          </button>
        </div>

        {/* 아카이브 목록 */}
        {showArchive && (
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark space-y-1.5">
            {archive.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-3">지난 기도제목이 없습니다</p>
            ) : (
              archive.map((p) => (
                <button
                  key={p.id}
                  onClick={() => void selectWeek(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    prayer?.id === p.id
                      ? 'bg-[var(--brand-soft)] text-brand font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80'
                  }`}
                >
                  <span>{formatWeekLabel(p.week_date)}</span>
                  <span className="text-xs text-gray-400">{p.item_count}개</span>
                </button>
              ))
            )}
          </div>
        )}

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : empty || !prayer ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-center px-8">
            <span className="text-3xl">🙏</span>
            <p className="text-sm font-semibold text-gray-600 dark:text-white/70">
              아직 등록된 기도제목이 없습니다
            </p>
            <p className="text-xs text-gray-400">주일 예배 후 이곳에서 함께 기도해요</p>
          </div>
        ) : (
          <div className="px-4 py-5">
            {/* 주차 표시 */}
            <div className="text-center mb-6">
              <p className="text-xs font-semibold tracking-[0.1em] text-brand mb-1">
                {formatWeekLabel(prayer.week_date)}
              </p>
              <h2 className="text-xl font-extrabold text-ink-strong tracking-[-0.02em] break-keep">{prayer.title}</h2>
              {(prayer.prayed_user_count ?? 0) > 0 && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-white/50">
                  이번 주 <span className="font-bold text-brand">{prayer.prayed_user_count}명</span>이 함께 기도했어요
                </p>
              )}
            </div>

            {/* 기도제목 카드 */}
            <div className="space-y-4">
              {prayer.items.map((item, i) => (
                <div
                  key={item.id ?? i}
                  className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5"
                >
                  <div className="flex gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand-soft-strong)] text-brand text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {item.title ? (
                      // 한글은 어절 단위로 끊어야 마지막 한 글자만 넘어가는 줄바꿈을 막을 수 있음
                      <p className="text-[15px] font-bold leading-[1.55] text-ink-strong pt-0.5 break-keep">
                        {item.title}
                      </p>
                    ) : (
                      // 제목 없는 통문단 형태 — 기도문 자체를 본문으로
                      <p className="text-[14.5px] leading-[1.8] text-ink-strong pt-0.5 break-keep">
                        {item.body}
                      </p>
                    )}
                  </div>
                  {item.title && item.body && (
                    <p className="mt-3 pl-10 text-[14px] leading-[1.8] text-gray-600 dark:text-white/70 break-keep">
                      “{item.body}”
                    </p>
                  )}
                  {item.scripture && (
                    <p className="mt-2 pl-10 text-xs font-semibold text-brand">
                      {item.scripture}
                    </p>
                  )}

                  {/* 함께 기도했어요 */}
                  <div className="mt-3.5 pl-10">
                    <button
                      type="button"
                      onClick={() => void handleAmen(item.id)}
                      aria-pressed={item.is_amened ?? false}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                        item.is_amened
                          ? 'bg-brand border-brand text-white shadow-sm'
                          : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand'
                      }`}
                    >
                      <span aria-hidden>🙏</span>
                      {item.is_amened ? '함께 기도했어요' : '함께 기도해요'}
                      {(item.amen_count ?? 0) > 0 && (
                        <span className={item.is_amened ? 'text-white/90' : 'text-brand'}>
                          {item.amen_count}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-gray-400 dark:text-white/40">
              이번 주에도 한마음으로 함께 기도해요 🙏
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyPrayerTopics
