// 공동 기도제목 — 이번 주 교회가 함께 드리는 기도 (교인용)
// '시네마 포스터'(weeklyTopics/CinemaPoster): 그 주일 계절의 교회 사진 포스터 + 흐린 배경,
// 기도는 한 화면에 다 보이고 지금 드릴 기도 하나만 펼쳐진다. 다 읽고 길게 눌러 아멘 → 다음 기도로.
// 라이트 = 계절 색(봄·여름·가을·겨울), 다크 = 밤 사진 + 등불 금색. 진행 위치(step)는 여기서 들고 있어
// 테마를 바꿔도 몇 번째 기도인지 이어진다. PC(lg+)는 포스터 왼쪽·기도 오른쪽 2단, 본문 명조 24px.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { isAuthenticated } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { getWeeklyPrayer, toggleWeeklyPrayerAmen } from '../../api/weeklyPrayer'
import { currentWeeklyPrayerQuery, weeklyPrayerListQuery } from '../../hooks/useWeeklyPrayer'
import { weeklyPrayerKeys } from '../../hooks/queryKeys'
import type { WeeklyPrayer, WeeklyPrayerItem, WeeklyPrayerListItem } from '../../types/weeklyPrayer'
import { HandHeartIcon } from '../../components/icons/ActionIcons'
import { useTheme } from '../../contexts/ThemeContext'
import { smoothScrollToElement } from '../../utils/scrollTo'
import { formatMonthDay } from '../../utils/date'
import CinemaPoster from './weeklyTopics/CinemaPoster'
import './weeklyTopics/weeklyTopics.css'

const formatWeekLabel = (weekDate: string): string => {
  const label = formatMonthDay(weekDate, { year: 'always' })
  return label ? `${label} 주일` : weekDate
}

/** 처음 열 때 펼칠 기도 — 아직 아멘하지 않은 첫 기도, 다 드렸으면 마침 화면 */
const firstOpenStep = (p: WeeklyPrayer | null): number => {
  if (!p) return 0
  const i = p.items.findIndex((it) => !it.is_amened)
  return i === -1 ? p.items.length : i
}

const WeeklyPrayerTopics = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [prayer, setPrayer] = useState<WeeklyPrayer | null>(null)
  const [archive, setArchive] = useState<WeeklyPrayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  // 지금 펼친 기도 순서 — 항목 수와 같으면 마침 화면
  const [step, setStep] = useState(0)
  const { theme } = useTheme()
  const topRef = useRef<HTMLDivElement>(null)
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
        setStep(firstOpenStep(current))
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

  // 항목 하나를 고쳐 화면 상태와 공용 캐시(홈 배너·참비·재진입)에 같이 반영한다.
  // 화면 상태만 고치면 캐시는 10분 신선 기간 동안 아멘 전 숫자를 그대로 돌려줘 재진입 때 늦게 오른다.
  const patchItem = (itemId: number, patch: (item: WeeklyPrayerItem) => WeeklyPrayerItem) => {
    const apply = (p: WeeklyPrayer | null | undefined) =>
      p ? { ...p, items: p.items.map((item) => (item.id === itemId ? patch(item) : item)) } : p
    setPrayer((p) => apply(p) ?? null)
    queryClient.setQueryData<WeeklyPrayer | null>(weeklyPrayerKeys.current(), (p) => apply(p))
    if (prayer) queryClient.setQueryData<WeeklyPrayer>(weeklyPrayerKeys.detail(prayer.id), (p) => apply(p) ?? undefined)
  }
  const flipAmen = (item: WeeklyPrayerItem) => ({
    ...item,
    is_amened: !item.is_amened,
    amen_count: (item.amen_count ?? 0) + (item.is_amened ? -1 : 1),
  })

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
    patchItem(itemId, flipAmen)
    try {
      const result = await toggleWeeklyPrayerAmen(itemId)
      // 서버 확정값으로 동기화 (참여 인원은 다음 로드 때 갱신)
      patchItem(itemId, (item) => ({ ...item, is_amened: result.is_amened, amen_count: result.amen_count }))
    } catch {
      // 롤백
      patchItem(itemId, flipAmen)
      showToast('잠시 후 다시 시도해 주세요', 'error')
    } finally {
      pendingAmens.current.delete(itemId)
    }
  }

  const selectWeek = async (id: number) => {
    if (id === prayer?.id) return
    try {
      const next = await getWeeklyPrayer(id)
      setPrayer(next)
      setStep(firstOpenStep(next))
      smoothScrollToElement(topRef.current, { offset: 56 })
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

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 page-stage">
      <div ref={topRef} className="max-w-md mx-auto lg:max-w-[76rem] lg:px-5 lg:pt-[0.75rem] lg:pb-12">
        {loading || empty || !prayer ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2 text-center px-8">
            {loading ? (
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <HandHeartIcon size={34} strokeWidth={1.6} className="text-gray-300 dark:text-white/25" />
                <p className="text-sm font-semibold text-gray-600 dark:text-white/70 lg:text-[18px]">아직 등록된 기도제목이 없습니다</p>
                <p className="text-xs text-gray-400 lg:text-[15px]">주일 예배 후 이곳에서 함께 기도해요</p>
                <button type="button" onClick={() => navigate(-1)} className="mt-6 text-sm font-semibold text-brand lg:text-[16px]">
                  ← 돌아가기
                </button>
              </>
            )}
          </div>
        ) : (
          <CinemaPoster
            weekId={prayer.id}
            items={prayer.items}
            weekLabel={formatWeekLabel(prayer.week_date)}
            weekDate={prayer.week_date}
            title={prayer.title}
            prayedCount={prayer.prayed_user_count ?? 0}
            archive={archive}
            isDark={theme === 'dark'}
            onSelectWeek={(id) => void selectWeek(id)}
            idx={step}
            setIdx={setStep}
            onAmen={amenItem}
            onUnamen={unamenItem}
            totalAmen={totalAmen}
          />
        )}
      </div>
    </div>
  )
}

export default WeeklyPrayerTopics
