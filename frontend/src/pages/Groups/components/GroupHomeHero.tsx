// 기도방 "오늘" 히어로 — 하늘 배너를 얇게 접고, 그 안에 오늘의 핵심 행동 하나만 남긴다:
// "오늘의 중보 시작하기"(가이드 모드 → 마지막 장에서 체크인 자동 기록).
// 체크인·주간 통계·7일 스트립은 배너 아래 보조 정보로 내려앉는다.
import { useGroupDigest, useGroupCheckin } from '../../../hooks/useGroups'
import { kstDateKey } from '../../../utils/kstTime'
import { CheckIcon, PrayIcon } from '../GroupIcons'

interface GroupHomeHeroProps {
  groupId: number
  hasPrayers: boolean
  onStartIntercession: () => void
  onCompose: () => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const GroupHomeHero = ({ groupId, hasPrayers, onStartIntercession, onCompose }: GroupHomeHeroProps) => {
  const { data, isLoading } = useGroupDigest(groupId)
  const checkin = useGroupCheckin()
  const digest = data?.data

  if (isLoading) {
    return (
      <div className="mx-4 mb-3 space-y-3">
        <div className="h-40 rounded-[1.25rem] bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        <div className="h-14 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      </div>
    )
  }
  if (!digest) return null

  const names = digest.checkin_names_today
  const others = digest.checkins_today - names.length
  const todayKey = kstDateKey(new Date())

  return (
    <div className="mx-4 mb-3">
      {/* ── 하늘 배너 — 오늘의 행동 하나를 담는 얇은 무대.
          배경 일러스트(언덕 위 십자가 아래 기도하는 양들)는 gd-hero CSS가 깐다.
          잉크·CTA 색은 라이트(네이비)/다크(흰색)로 갈리므로 --gd-hero-* 변수만 쓴다 ── */}
      <div className="gd-hero px-5 pt-7 pb-7 sm:px-6 sm:pt-9 sm:pb-9">
        <h2 className="gd-hero-title relative z-10 text-[19px] sm:text-[21px] font-bold tracking-[-0.02em] leading-tight">
          {digest.my_checked_in ? '오늘도 함께 기도했어요 🙏' : '오늘도 함께 기도해요 🙏'}
        </h2>
        <p className="relative z-10 mt-1 text-[12.5px] sm:text-[13px] text-[color:var(--gd-hero-ink-soft)]">
          {digest.checkins_today > 0
            ? `오늘 ${digest.checkins_today}명이 우리 방을 위해 기도했어요`
            : '오늘의 첫 기도를 시작해보세요'}
        </p>
        {digest.checkins_today > 0 && names.length > 0 && (
          <p className="relative z-10 mt-0.5 text-[11px] text-[color:var(--gd-hero-ink-faint)] truncate pr-24">
            {names.join(' · ')}
            {others > 0 && ` 외 ${others}명`}
          </p>
        )}

        {/* 오늘의 핵심 CTA — 기도제목이 있으면 중보 모드, 없으면 첫 나눔 */}
        <div className="relative z-10 mt-4 flex items-center gap-3 flex-wrap">
          {hasPrayers ? (
            <button
              type="button"
              onClick={onStartIntercession}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--gd-hero-cta-bg)] text-[color:var(--gd-hero-cta-ink)] text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(20,30,70,0.55)] active:scale-[0.98] transition-transform"
            >
              <PrayIcon size={17} />
              {digest.my_checked_in ? '다시 기도하기' : '오늘의 중보 시작하기'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCompose}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--gd-hero-cta-bg)] text-[color:var(--gd-hero-cta-ink)] text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(20,30,70,0.55)] active:scale-[0.98] transition-transform"
            >
              첫 기도제목 나누기
            </button>
          )}
          {digest.my_checked_in ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--gd-hero-ink-soft)]">
              <CheckIcon size={14} />
              오늘 기도 완료
            </span>
          ) : (
            <button
              type="button"
              disabled={checkin.isPending}
              onClick={() => checkin.mutate(groupId)}
              className="text-[12px] font-semibold text-[color:var(--gd-hero-ink-faint)] underline underline-offset-2 hover:text-[color:var(--gd-hero-ink)] transition-colors disabled:opacity-60"
            >
              {checkin.isPending ? '기록하는 중…' : '기도만 남길게요'}
            </button>
          )}
        </div>
      </div>

      {/* ── 이번 주 요약 — 한 줄 칩 ── */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-[11.5px] font-semibold text-brand">
          이번 주 새 기도 <b className="font-bold tabular-nums">{digest.new_prayers_week}</b>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-rose-50 dark:bg-rose-400/[0.1] border border-rose-100 dark:border-rose-400/[0.2] text-[11.5px] font-semibold text-rose-500 dark:text-rose-300">
          응답 소식 <b className="font-bold tabular-nums">{digest.answered_week}</b>
        </span>
      </div>

      {/* ── 7일 요일 스트립 — 함께 기도한 흔적이 쌓인다 ── */}
      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="최근 7일 체크인">
        {digest.week_days.map((d) => {
          const day = new Date(d.date + 'T00:00:00')
          const intensity = d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 5 ? 2 : 3
          const isToday = d.date === todayKey
          return (
            <div
              key={d.date}
              data-today={isToday}
              className={[
                'gd-day h-[50px] rounded-xl border flex flex-col items-center justify-center gap-0.5',
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
    </div>
  )
}

export default GroupHomeHero
