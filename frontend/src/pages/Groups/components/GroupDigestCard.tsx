// 이번 주 다이제스트 + 오늘의 체크인 — 그룹 홈 최상단 요약 카드
// "들어올 때마다 볼 게 있다"를 만드는 핵심: 새 기도·응답·오늘 함께 기도한 사람
import { useGroupDigest, useGroupCheckin } from '../../../hooks/useGroups'

interface GroupDigestCardProps {
  groupId: number
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

const GroupDigestCard = ({ groupId }: GroupDigestCardProps) => {
  const { data, isLoading } = useGroupDigest(groupId)
  const checkin = useGroupCheckin()
  const digest = data?.data

  if (isLoading) {
    return <div className="mx-4 mb-3 h-36 rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
  }
  if (!digest) return null

  const names = digest.checkin_names_today
  const others = digest.checkins_today - names.length

  return (
    <div className="mx-4 mb-3 rounded-2xl p-4 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08]">
      <p className="text-[12px] font-bold text-gray-500 dark:text-white/55 mb-2.5">이번 주 우리 그룹</p>

      {/* 주간 지표 두 개 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 rounded-xl px-3 py-2.5 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)]">
          <p className="text-[18px] font-bold text-brand tabular-nums leading-none">
            {digest.new_prayers_week}
          </p>
          <p className="text-[11px] font-semibold text-gray-600 dark:text-white/60 mt-1">새 기도제목</p>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2.5 bg-amber-50 dark:bg-amber-400/[0.08] border border-amber-200/70 dark:border-amber-300/20">
          <p className="text-[18px] font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
            {digest.answered_week}
          </p>
          <p className="text-[11px] font-semibold text-gray-600 dark:text-white/60 mt-1">응답 소식 ✨</p>
        </div>
      </div>

      {/* 주간 체크인 그리드 — 7일, 함께 기도한 흔적이 잔디처럼 쌓인다 */}
      <div className="flex items-center justify-between gap-1 mb-3" aria-label="최근 7일 체크인">
        {digest.week_days.map((d) => {
          const day = new Date(d.date + 'T00:00:00')
          const intensity = d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 5 ? 2 : 3
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={[
                  'w-full h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors',
                  intensity === 0 && 'bg-gray-100 dark:bg-white/[0.05] text-gray-300 dark:text-white/25',
                  intensity === 1 && 'bg-[var(--brand-soft)] text-brand',
                  intensity === 2 && 'bg-[var(--brand-soft-strong)] text-brand',
                  intensity === 3 && 'bg-brand text-white',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {d.count > 0 ? d.count : ''}
              </div>
              <span
                className={[
                  'text-[10px] font-semibold',
                  d.me ? 'text-brand' : 'text-gray-400 dark:text-white/40',
                ].join(' ')}
              >
                {DAY_LABELS[day.getDay()]}
                {d.me && ' ·'}
              </span>
            </div>
          )
        })}
      </div>

      {/* 오늘의 체크인 */}
      {digest.my_checked_in ? (
        <div className="rounded-xl px-3.5 py-3 bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-center">
          <p className="text-[13px] font-bold text-brand">오늘도 함께 기도했어요 🙏</p>
          <p className="text-[11.5px] text-gray-600 dark:text-white/60 mt-0.5 leading-[1.5]">
            {digest.checkins_today > 1
              ? `오늘 ${digest.checkins_today}명이 우리 그룹을 위해 기도했어요`
              : '오늘의 첫 기도예요. 곧 다른 멤버들도 함께할 거예요'}
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={checkin.isPending}
          onClick={() => checkin.mutate(groupId)}
          className="w-full h-11 rounded-xl bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all disabled:opacity-60"
        >
          {checkin.isPending
            ? '기록하는 중…'
            : digest.checkins_today > 0
              ? `🙏 오늘 ${digest.checkins_today}명이 기도했어요 · 나도 함께 기도했어요`
              : '🙏 오늘 우리 그룹을 위해 기도했어요'}
        </button>
      )}

      {/* 오늘 체크인한 멤버 이름 */}
      {digest.checkins_today > 0 && names.length > 0 && (
        <p className="text-[11px] text-gray-400 dark:text-white/40 text-center mt-2 truncate">
          {names.join(' · ')}
          {others > 0 && ` 외 ${others}명`}
        </p>
      )}
    </div>
  )
}

export default GroupDigestCard
