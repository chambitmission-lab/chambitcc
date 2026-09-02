// 기도방 홈 히어로 — 하늘 배너 + 겹쳐 앉는 주간 통계 타일 + 7일 요일 스트립 + 오늘의 체크인
// (구 GroupDigestCard의 데이터를 그대로 쓰되, "들어오면 먼저 눈에 들어오는 한 장면"으로 재구성)
import { useGroupDigest, useGroupCheckin } from '../../../hooks/useGroups'
import { kstDateKey } from '../../../utils/kstTime'
import { BookIcon, CheckIcon, HeartIcon, PrayIcon } from '../GroupIcons'

interface GroupHomeHeroProps {
  groupId: number
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

// 언덕 위 십자가 실루엣 — 히어로 우하단 장식
const HillCross = () => (
  <svg className="gd-hero-hill" viewBox="0 0 340 150" fill="none" aria-hidden="true">
    <path
      d="M0 150C60 92 150 70 230 84c40 7 78 22 110 46v20H0z"
      fill="rgba(40, 42, 90, 0.55)"
    />
    <path
      d="M120 150c50-38 120-50 190-30 12 4 22 8 30 12v18H120z"
      fill="rgba(30, 32, 70, 0.65)"
    />
    <g fill="rgba(255,255,255,0.92)">
      <rect x="252" y="28" width="5" height="62" rx="1.5" />
      <rect x="238" y="44" width="33" height="5" rx="1.5" />
    </g>
  </svg>
)

const GroupHomeHero = ({ groupId }: GroupHomeHeroProps) => {
  const { data, isLoading } = useGroupDigest(groupId)
  const checkin = useGroupCheckin()
  const digest = data?.data

  if (isLoading) {
    return (
      <div className="mx-4 mb-3 space-y-3">
        <div className="h-52 rounded-[1.25rem] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        <div className="h-16 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      </div>
    )
  }
  if (!digest) return null

  const names = digest.checkin_names_today
  const others = digest.checkins_today - names.length
  const todayKey = kstDateKey(new Date())

  return (
    <div className="mx-4 mb-3">
      {/* ── 하늘 배너 ── */}
      <div className="gd-hero px-6 pt-8 pb-16 sm:px-8 sm:pt-10 sm:pb-20">
        <h2 className="gd-hero-title relative z-10 text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] leading-tight">
          오늘도 함께 기도해요 🙏
        </h2>
        <p className="relative z-10 mt-1.5 text-[13px] sm:text-[14px] text-white/85">
          주님께 우리의 마음을 올려드려요
        </p>
        <HillCross />
      </div>

      {/* ── 주간 통계 타일 — 배너 하단에 반쯤 걸쳐 앉는다 ── */}
      <div className="relative z-10 -mt-12 sm:-mt-14 px-3 sm:px-5 grid grid-cols-2 gap-3">
        <div className="gd-stat rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-full bg-[var(--brand-soft-strong)] text-brand flex items-center justify-center">
            <BookIcon size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-bold text-ink-strong tabular-nums leading-none">
              {digest.new_prayers_week}
            </p>
            <p className="text-[12px] font-semibold text-gray-700 dark:text-white/75 mt-1 truncate">새 기도제목</p>
            <p className="text-[10.5px] text-gray-400 dark:text-white/40">이번 주</p>
          </div>
        </div>
        <div className="gd-stat rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="shrink-0 w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-400/[0.14] text-rose-500 flex items-center justify-center">
            <HeartIcon size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[22px] font-bold text-ink-strong tabular-nums leading-none">
              {digest.answered_week}
            </p>
            <p className="text-[12px] font-semibold text-gray-700 dark:text-white/75 mt-1 truncate">응답 소식</p>
            <p className="text-[10.5px] text-gray-400 dark:text-white/40">이번 주</p>
          </div>
        </div>
      </div>

      {/* ── 7일 요일 스트립 — 함께 기도한 흔적이 쌓인다 ── */}
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="최근 7일 체크인">
        {digest.week_days.map((d) => {
          const day = new Date(d.date + 'T00:00:00')
          const intensity = d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 5 ? 2 : 3
          const isToday = d.date === todayKey
          return (
            <div
              key={d.date}
              data-today={isToday}
              className={[
                'gd-day h-[54px] rounded-xl border flex flex-col items-center justify-center gap-0.5',
                intensity === 0 &&
                  'bg-white/80 dark:bg-card-dark border-gray-200/70 dark:border-white/[0.08] text-gray-500 dark:text-white/45',
                intensity === 1 && 'bg-[var(--brand-soft)] border-[var(--brand-soft-strong)] text-brand',
                intensity === 2 && 'bg-[var(--brand-soft-strong)] border-transparent text-brand',
                intensity === 3 && 'bg-brand border-transparent text-white',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {d.count > 0 && (
                <span className="text-[12.5px] font-bold tabular-nums leading-none">{d.count}</span>
              )}
              <span
                className={[
                  'text-[11.5px] font-semibold leading-none',
                  isToday && intensity !== 3 ? 'text-brand' : '',
                  d.me && intensity === 0 ? 'text-brand' : '',
                ].join(' ')}
              >
                {DAY_LABELS[day.getDay()]}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── 오늘의 체크인 배너 ── */}
      <div className="gd-checkin mt-4 rounded-2xl border border-[var(--brand-soft-strong)] px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3.5">
        <div className="shrink-0 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_8px_20px_-8px_var(--brand-glow)]">
          <PrayIcon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-ink-strong tracking-[-0.01em]">
            {digest.my_checked_in ? '오늘도 함께 기도했어요 🙏' : '오늘도 함께 기도해요 🙏'}
          </p>
          <p className="text-[12.5px] text-gray-600 dark:text-white/60 leading-[1.5] mt-0.5">
            {digest.checkins_today > 0
              ? `오늘 ${digest.checkins_today}명이 우리 그룹을 위해 기도했어요`
              : '오늘의 첫 기도예요. 곧 다른 멤버들도 함께할 거예요.'}
          </p>
          {digest.checkins_today > 0 && names.length > 0 && (
            <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 truncate">
              {names.join(' · ')}
              {others > 0 && ` 외 ${others}명`}
            </p>
          )}
        </div>
        {digest.my_checked_in ? (
          <span className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white/80 dark:bg-white/[0.06] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold">
            <CheckIcon size={15} />
            기도 완료
          </span>
        ) : (
          <button
            type="button"
            disabled={checkin.isPending}
            onClick={() => checkin.mutate(groupId)}
            className="shrink-0 self-start sm:self-center h-10 px-5 rounded-full bg-white dark:bg-white/[0.08] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold shadow-sm hover:bg-[var(--brand-soft)] transition-colors disabled:opacity-60"
          >
            {checkin.isPending ? '기록하는 중…' : '기도 남기기'}
          </button>
        )}
      </div>
    </div>
  )
}

export default GroupHomeHero
