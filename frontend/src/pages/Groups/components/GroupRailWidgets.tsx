// 기도방 홈 우측 레일 위젯 — 최근 기도 제목 · 최근 활동 · 멤버 미리보기
// 본문이 "오늘 할 일"(체크인·기도)이라면, 레일은 "방의 근황"을 한눈에 훔쳐보는 자리
import { useQuery } from '@tanstack/react-query'
import { fetchPrayers } from '../../../api/prayer'
import { prayerKeys } from '../../../hooks/usePrayersQuery'
import { useGroupDigest } from '../../../hooks/useGroups'
import { getCurrentUser } from '../../../utils/auth'
import type { GroupMember } from '../../../types/prayer'
import { BookIcon, HeartIcon, PrayIcon, SparkleIcon } from '../GroupIcons'

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const RailHeader = ({ title, onMore }: { title: string; onMore?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-[14px] font-bold text-ink-strong tracking-[-0.01em]">{title}</h3>
    {onMore && (
      <button
        type="button"
        onClick={onMore}
        className="inline-flex items-center gap-0.5 text-[11.5px] font-bold text-brand hover:opacity-80 transition-opacity"
      >
        전체보기
        <ChevronRight />
      </button>
    )}
  </div>
)

const cardClass =
  'rounded-2xl p-5 bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-none'

/* ── 최근 기도 제목 ── */
// prayerKeys.lists() 아래에 두어 기도 작성·응답 mutation의 invalidate(lists)에 같이 갱신된다.
// 무한쿼리(기도 탭)와 같은 키를 쓰면 캐시 모양이 충돌하므로 별도 세그먼트를 붙인다
const useGroupRecentPrayers = (groupId: number) => {
  const username = getCurrentUser().username
  return useQuery({
    queryKey: [...prayerKeys.lists(), 'group-recent', groupId, username || 'anonymous'] as const,
    queryFn: () => fetchPrayers(1, 3, 'latest', groupId, 'all'),
    enabled: groupId > 0,
    staleTime: 1000 * 60,
    refetchOnMount: true,
  })
}

interface RecentPrayersCardProps {
  groupId: number
  onViewAll: () => void
  onCompose: () => void
}

export const RecentPrayersCard = ({ groupId, onViewAll, onCompose }: RecentPrayersCardProps) => {
  const { data, isLoading } = useGroupRecentPrayers(groupId)
  const items = data?.data.items ?? []

  return (
    <section className={cardClass}>
      <RailHeader title="최근 기도 제목" onMore={onViewAll} />
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-10 rounded-xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-3 text-center">
          <p className="text-[13px] text-gray-500 dark:text-white/50 mb-3">아직 등록된 기도 제목이 없어요</p>
          <button
            type="button"
            onClick={onCompose}
            className="h-10 px-5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
          >
            기도 제목 작성하기
          </button>
        </div>
      ) : (
        <ul className="flex flex-col -mx-2">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={onViewAll}
                className="w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-[var(--brand-soft)] transition-colors"
              >
                <span
                  className={[
                    'shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center',
                    p.is_answered
                      ? 'bg-amber-100 dark:bg-amber-400/[0.14] text-amber-600 dark:text-amber-300'
                      : 'bg-[var(--brand-soft)] text-brand',
                  ].join(' ')}
                >
                  {p.is_answered ? <SparkleIcon size={14} /> : <PrayIcon size={14} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-semibold text-ink-strong truncate">
                    {p.title || p.content}
                  </span>
                  <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5 truncate">
                    {p.display_name} · {p.time_ago}
                    {p.is_answered && ' · 응답됨'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/* ── 최근 활동 ── */
interface RecentActivityCardProps {
  groupId: number
  onViewAll: () => void
}

export const RecentActivityCard = ({ groupId, onViewAll }: RecentActivityCardProps) => {
  const { data } = useGroupDigest(groupId)
  const digest = data?.data
  if (!digest) return null

  const rows = [
    {
      icon: <HeartIcon size={17} />,
      tone: 'bg-rose-100 dark:bg-rose-400/[0.14] text-rose-500',
      title: digest.answered_week > 0 ? `응답 소식 ${digest.answered_week}건` : '응답 소식이 없습니다',
      sub: digest.answered_week > 0 ? '이번 주에 응답된 기도가 있어요' : '아직 응답 소식이 없어요',
    },
    {
      icon: <BookIcon size={17} />,
      tone: 'bg-[var(--brand-soft-strong)] text-brand',
      title: digest.new_prayers_week > 0 ? `새 기도제목 ${digest.new_prayers_week}개` : '새 기도제목이 없습니다',
      sub: digest.new_prayers_week > 0 ? '이번 주에 새로 올라온 기도제목' : '최근 등록된 기도 제목이 없어요',
    },
    {
      icon: <PrayIcon size={17} />,
      tone: 'bg-[var(--brand-soft)] text-brand',
      title: digest.checkins_today > 0 ? `오늘 ${digest.checkins_today}명이 함께 기도했어요` : '함께 기도해주세요',
      sub: digest.checkins_today > 0
        ? digest.my_checked_in ? '나도 오늘 함께 기도했어요' : '나도 오늘 기도에 함께해요'
        : '오늘의 첫 번째 기도를 남겨주세요',
    },
  ]

  return (
    <section className={cardClass}>
      <RailHeader title="최근 활동" onMore={onViewAll} />
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center gap-3">
            <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${r.tone}`}>
              {r.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-ink-strong truncate">{r.title}</span>
              <span className="block text-[11.5px] text-gray-500 dark:text-white/50 truncate">{r.sub}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ── 멤버 미리보기 ── */
interface MemberPreviewCardProps {
  members: GroupMember[]
  memberCount: number
  onViewAll: () => void
}

const PREVIEW_MAX = 4

export const MemberPreviewCard = ({ members, memberCount, onViewAll }: MemberPreviewCardProps) => {
  const shown = members.slice(0, PREVIEW_MAX)
  const rest = Math.max(memberCount - shown.length, 0)

  return (
    <section className={cardClass}>
      <RailHeader title="멤버 미리보기" />
      <div className="flex items-center gap-2.5 mb-4">
        {shown.map((m) =>
          m.avatar_url ? (
            <img
              key={m.user_id}
              src={m.avatar_url}
              alt={m.display_name}
              title={m.display_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-card-dark shadow-sm"
            />
          ) : (
            <div
              key={m.user_id}
              title={m.display_name}
              className="w-12 h-12 rounded-full bg-[var(--brand-soft-strong)] border-2 border-white dark:border-card-dark flex items-center justify-center text-[15px] font-bold text-brand"
            >
              {(m.display_name || '?').charAt(0)}
            </div>
          ),
        )}
        {rest > 0 && (
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/[0.06] border-2 border-white dark:border-card-dark flex items-center justify-center text-[12.5px] font-bold text-gray-500 dark:text-white/55 tabular-nums">
            +{rest}
          </div>
        )}
        {shown.length === 0 && (
          <p className="text-[12.5px] text-gray-500 dark:text-white/50">멤버 정보를 불러오는 중…</p>
        )}
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="w-full h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[13px] font-bold hover:bg-[var(--brand-soft-strong)] transition-colors"
      >
        모든 멤버 보기
      </button>
    </section>
  )
}
