// 공동 기도제목 — 이번 주 교회가 함께 드리는 기도 (교인용)
// 한 화면에 기도 하나, 다 읽고 길게 눌러 아멘 → 다음 기도로. 테마마다 화면이 다르다:
//   라이트 = 올려드리는 카드(weeklyTopics/OfferingCards) · 다크 = 등불 길(weeklyTopics/LanternPath)
// 진행 위치(idx)는 여기서 들고 있어 테마를 바꿔도 몇 번째 기도인지 이어진다.
// PC(lg+)는 어르신이 소리 내어 따라 읽기 좋게 본문 22~25px, 우측 레일에 순서·지난 주.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getWeeklyPrayer, toggleWeeklyPrayerAmen } from '../../api/weeklyPrayer'
import { currentWeeklyPrayerQuery, weeklyPrayerListQuery } from '../../hooks/useWeeklyPrayer'
import type { WeeklyPrayer, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import { useTheme } from '../../contexts/ThemeContext'
import { useThemeArt } from '../../hooks/useThemeArt'
import { WEEKLY_PRAYER_ART } from '../../utils/themeAssets'
import LanternPath from './weeklyTopics/LanternPath'
import OfferingCards from './weeklyTopics/OfferingCards'
import { CheckIcon } from './weeklyTopics/HoldAmen'
import './weeklyTopics/weeklyTopics.css'

const formatWeekLabel = (weekDate: string): string => {
  const d = new Date(`${weekDate}T00:00:00`)
  if (isNaN(d.getTime())) return weekDate
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 주일`
}

const WeeklyPrayerTopics = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [prayer, setPrayer] = useState<WeeklyPrayer | null>(null)
  const [archive, setArchive] = useState<WeeklyPrayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  // 지금 보고 있는 기도 순서 — 항목 수와 같으면 마침 화면
  const [step, setStep] = useState(0)
  const { theme } = useTheme()
  // 테마별 그림을 마운트 동안 등록 — 현재 테마를 먼저, 반대 테마는 유휴 시간·토글 직전에 받아 둔다
  const lanternReady = useThemeArt(WEEKLY_PRAYER_ART[0])
  useThemeArt(WEEKLY_PRAYER_ART[1])
  useThemeArt(WEEKLY_PRAYER_ART[2])
  // 항목별 토글 요청 중복 방지
  const pendingAmens = useRef<Set<number>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // 홈 배너가 받아 둔 이번 주 기도제목이 신선하면 요청 없이 그대로 쓴다
        const [current, list] = await Promise.all([
          queryClient.fetchQuery(currentWeeklyPrayerQuery()).catch((e: Error) => {
            if (e.message === 'NOT_FOUND') return null
            throw e
          }),
          queryClient.fetchQuery(weeklyPrayerListQuery()).catch(() => [] as WeeklyPrayerListItem[]),
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
  }, [queryClient])

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
      setStep(0)
      setShowArchive(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // 상세 로드 실패 시 현재 화면 유지
    }
  }

  const totalAmen = prayer?.items.reduce((sum, it) => sum + (it.amen_count ?? 0), 0) ?? 0

  // 길게 눌러 아멘 — 이미 아멘한 항목은 그대로 두고, 로그인 전이면 false 를 돌려 다음으로 넘기지 않는다
  const amenItem = (itemId: number | undefined): boolean => {
    const target = prayer?.items.find((it) => it.id === itemId)
    if (!target) return false
    if (!isAuthenticated()) {
      void handleAmen(itemId)
      return false
    }
    if (!target.is_amened) void handleAmen(itemId)
    return true
  }
  const unamenItem = (itemId: number | undefined) => {
    if (prayer?.items.find((it) => it.id === itemId)?.is_amened) void handleAmen(itemId)
  }

  // 지난 주 목록 — 모바일은 헤더 토글, PC는 우측 레일에 상시 노출
  const archiveList = (
    <div className="space-y-1.5">
      {archive.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-3 lg:text-[15px]">지난 기도제목이 없습니다</p>
      ) : (
        archive.map((p) => (
          <button
            key={p.id}
            onClick={() => void selectWeek(p.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors lg:px-4 lg:py-3.5 lg:text-[16px] ${
              prayer?.id === p.id
                ? 'bg-[var(--brand-soft)] text-brand font-bold'
                : 'hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80'
            }`}
          >
            <span>{formatWeekLabel(p.week_date)}</span>
            <span className="text-xs text-gray-400 lg:text-[14px] lg:text-gray-500 dark:lg:text-white/55">{p.item_count}개</span>
          </button>
        ))
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark min-h-screen pb-24 lg:max-w-[64rem] xl:max-w-[76rem] lg:mt-2 lg:mb-12 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:min-h-0">
        {/* 헤더 */}
        <div className="sticky top-14 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2 lg:static lg:rounded-t-3xl lg:px-8 lg:py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors lg:-ml-2 lg:h-11 lg:px-2 lg:rounded-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold lg:text-[16px]">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong lg:text-[21px]">공동 기도제목</h1>
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="text-xs font-semibold text-gray-500 dark:text-white/60 hover:text-brand transition-colors lg:hidden"
          >
            지난 주 보기
          </button>
          {/* PC는 우측 레일이 지난 주 목록을 대신하므로 자리만 유지 */}
          <span aria-hidden className="hidden lg:block w-[76px]" />
        </div>

        {/* 아카이브 목록 (모바일 전용) */}
        {showArchive && (
          <div className="px-4 py-3 border-b border-border-light dark:border-border-dark lg:hidden">
            {archiveList}
          </div>
        )}

        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : empty || !prayer ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-center px-8">
            <HandHeartIcon size={34} strokeWidth={1.6} className="text-gray-300 dark:text-white/25" />
            <p className="text-sm font-semibold text-gray-600 dark:text-white/70 lg:text-[18px]">
              아직 등록된 기도제목이 없습니다
            </p>
            <p className="text-xs text-gray-400 lg:text-[15px]">주일 예배 후 이곳에서 함께 기도해요</p>
          </div>
        ) : (
          <div className="px-4 py-5 lg:px-8 lg:py-8">
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
              {/* 좌: 한 화면에 기도 하나 — 라이트는 카드, 다크는 등불 길 */}
              <div>
                {theme === 'dark' ? (
                  <LanternPath
                    weekId={prayer.id}
                    items={prayer.items}
                    weekLabel={formatWeekLabel(prayer.week_date)}
                    idx={step}
                    setIdx={setStep}
                    onAmen={amenItem}
                    onUnamen={unamenItem}
                    totalAmen={totalAmen}
                    art={WEEKLY_PRAYER_ART[0].dark}
                    artReady={lanternReady}
                  />
                ) : (
                  <OfferingCards
                    weekId={prayer.id}
                    items={prayer.items}
                    weekLabel={formatWeekLabel(prayer.week_date)}
                    idx={step}
                    setIdx={setStep}
                    onAmen={amenItem}
                    onUnamen={unamenItem}
                    totalAmen={totalAmen}
                    arts={WEEKLY_PRAYER_ART.map((p) => p.light)}
                  />
                )}
                {(prayer.prayed_user_count ?? 0) > 0 && (
                  <p className="mt-6 text-center text-xs text-gray-500 dark:text-white/50 lg:hidden">
                    이번 주 <span className="font-bold text-brand">{prayer.prayed_user_count}명</span>이 함께 기도했어요
                  </p>
                )}
              </div>

              {/* 우: 이번 주 숫자 + 기도 순서 + 지난 기도제목 (PC 전용) */}
              <aside className="hidden lg:block lg:sticky lg:top-[4.5rem] lg:max-h-[calc((100vh-5.5rem)/var(--az,1))] lg:overflow-y-auto scrollbar-hide space-y-4">
                <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5">
                  <p className="text-[16px] font-bold text-ink-strong">이번 주 함께한 기도</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-gray-200/70 dark:border-white/[0.08]">
                    <div className="text-center">
                      <p className="text-[28px] leading-tight font-extrabold brand-text-gradient tabular-nums">{prayer.prayed_user_count ?? 0}</p>
                      <p className="mt-1 text-[14px] text-gray-600 dark:text-white/60">함께한 성도</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[28px] leading-tight font-extrabold brand-text-gradient tabular-nums">{totalAmen}</p>
                      <p className="mt-1 text-[14px] text-gray-600 dark:text-white/60">기도 참여</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                  <p className="px-1 pb-2 text-[16px] font-bold text-ink-strong">이번 주 기도 순서</p>
                  {prayer.items.map((item, i) => (
                    <button
                      key={item.id ?? i}
                      type="button"
                      onClick={() => setStep(i)}
                      className={`w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors ${
                        i === step ? 'bg-[var(--brand-soft)]' : 'hover:bg-gray-100 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-[1.5px] border-brand text-[12px] font-extrabold flex items-center justify-center ${
                          item.is_amened ? 'bg-brand text-white' : 'text-brand'
                        }`}
                      >
                        {item.is_amened ? <CheckIcon size={12} /> : i + 1}
                      </span>
                      <span className="line-clamp-2 text-[15px] leading-[1.55] text-gray-700 dark:text-white/75">{item.title || item.body}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4">
                  <p className="px-1 pb-2.5 text-[16px] font-bold text-ink-strong">지난 기도제목</p>
                  <div className="max-h-[calc(36vh/var(--az,1))] overflow-y-auto pr-0.5">{archiveList}</div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WeeklyPrayerTopics
