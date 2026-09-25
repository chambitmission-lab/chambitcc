// 공동 기도제목 — 이번 주 교회가 함께 드리는 기도 (교인용)
// PC(lg+)는 어르신이 소리 내어 따라 읽기 좋게: 한 줄 한 폭(두 폭 벽 대신)·본문 19px/줄간 1.8·
// 번호와 본문 대비 상향·버튼 누르는 영역 확대. 모바일은 그대로.
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
import { HandHeartIcon } from '../../components/icons/ActionIcons'

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

  const totalAmen = prayer?.items.reduce((sum, it) => sum + (it.amen_count ?? 0), 0) ?? 0

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
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2 lg:static lg:rounded-t-3xl lg:px-8 lg:py-4">
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
            <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:items-start">
              {/* 좌: 기도제목 */}
              <div className="contents lg:block">
                {/* 주차 표시 (모바일) — PC는 우측 레일이 대신한다 */}
                <div className="text-center mb-6 lg:hidden">
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

                {/* 주차 표시 (PC) — 따라 읽기 전에 "몇 월 며칠 기도"인지 본문 첫머리에서 바로 보이게 */}
                <div className="hidden lg:block mb-7">
                  <p className="text-[16px] font-bold text-brand">{formatWeekLabel(prayer.week_date)}</p>
                  <h2 className="mt-1.5 text-[30px] font-extrabold text-ink-strong tracking-[-0.025em] leading-[1.35] break-keep">
                    {prayer.title}
                  </h2>
                </div>

                {/* 기도제목 카드 — PC 도 한 폭: 두 폭 벽은 읽는 순서(1→2→3)가 눈으로 따라가기 어렵다 */}
                <div className="space-y-4 lg:space-y-5">
                  {prayer.items.map((item, i) => (
                    <div
                      key={item.id ?? i}
                      className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5 lg:rounded-3xl lg:p-7"
                    >
                      <div className="flex gap-3 lg:gap-4">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--brand-soft-strong)] text-brand text-sm font-bold flex items-center justify-center lg:w-10 lg:h-10 lg:bg-brand lg:text-white lg:text-[19px] lg:font-extrabold">
                          {i + 1}
                        </span>
                        {item.title ? (
                          // 한글은 어절 단위로 끊어야 마지막 한 글자만 넘어가는 줄바꿈을 막을 수 있음
                          <p className="text-[15px] font-bold leading-[1.55] text-ink-strong pt-0.5 break-keep lg:text-[22px] lg:leading-[1.55] lg:pt-1 lg:tracking-[-0.02em]">
                            {item.title}
                          </p>
                        ) : (
                          // 제목 없는 통문단 형태 — 기도문 자체를 본문으로
                          <p className="text-[14.5px] leading-[1.8] text-ink-strong pt-0.5 break-keep lg:text-[19px] lg:pt-1.5">
                            {item.body}
                          </p>
                        )}
                      </div>
                      {item.title && item.body && (
                        <p className="mt-3 pl-10 text-[14px] leading-[1.8] text-gray-600 dark:text-white/70 break-keep lg:mt-4 lg:pl-14 lg:text-[19px] lg:text-gray-800 dark:lg:text-white/85">
                          “{item.body}”
                        </p>
                      )}
                      {item.scripture && (
                        <p className="mt-2 pl-10 text-xs font-semibold text-brand lg:mt-3 lg:pl-14 lg:text-[16px]">
                          {item.scripture}
                        </p>
                      )}

                      {/* 함께 기도했어요 */}
                      <div className="mt-3.5 pl-10 lg:mt-5 lg:pl-14">
                        <button
                          type="button"
                          onClick={() => void handleAmen(item.id)}
                          aria-pressed={item.is_amened ?? false}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 lg:gap-2 lg:px-5 lg:py-2.5 lg:text-[15.5px] lg:border-2 ${
                            item.is_amened
                              ? 'bg-brand border-brand text-white shadow-sm'
                              : 'bg-transparent border-gray-300 dark:border-white/[0.15] text-gray-600 dark:text-white/70 hover:border-brand hover:text-brand'
                          }`}
                        >
                          <HandHeartIcon
                            size={14}
                            strokeWidth={2}
                            filled={item.is_amened ?? false}
                            className="lg:w-[19px] lg:h-[19px]"
                          />
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

                <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-white/40 lg:mt-10 lg:text-[15px] lg:text-gray-500 dark:lg:text-white/50">
                  이번 주에도 한마음으로 함께 기도해요
                  <HandHeartIcon size={14} strokeWidth={1.8} />
                </p>
              </div>

              {/* 우: 이번 주 요약 + 지난 기도제목 (PC 전용) */}
              <aside className="hidden lg:block lg:sticky lg:top-6 space-y-4">
                <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-5">
                  {/* 주차·제목은 본문 첫머리(PC 주차 표시)에 크게 있으니 여기선 이번 주 숫자만 */}
                  <p className="text-[16px] font-bold text-ink-strong">이번 주 함께한 기도</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-gray-200/70 dark:border-white/[0.08]">
                    <div className="text-center">
                      <p className="text-[28px] leading-tight font-extrabold brand-text-gradient tabular-nums">{prayer.items.length}</p>
                      <p className="mt-1 text-[14px] text-gray-600 dark:text-white/60">기도제목</p>
                    </div>
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
                  <p className="px-1 pb-2.5 text-[16px] font-bold text-ink-strong">지난 기도제목</p>
                  <div className="max-h-[calc(46vh/var(--az,1))] overflow-y-auto pr-0.5">{archiveList}</div>
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
