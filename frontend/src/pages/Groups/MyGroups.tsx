// 내 그룹 리스트 페이지 — /groups
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useMyGroups } from '../../hooks/useGroups'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import { isAuthenticated } from '../../utils/auth'
import type { PrayerGroup } from '../../types/prayer'

const MyGroups = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useMyGroups()
  const groups: PrayerGroup[] = data?.data.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  // 로그인 안 됨 — 합의 톤으로
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
        <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--brand-soft-strong)] mb-5">
            <span className="text-[36px]">👥</span>
          </div>
          <h2 className="text-gray-900 dark:text-white text-[18px] font-bold tracking-[-0.015em] mb-1.5">
            함께 기도하는 그룹
          </h2>
          <p className="text-gray-500 dark:text-white/55 text-[13px] text-center leading-[1.6] mb-6">
            {t('loginRequired')}
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 px-6 h-11 rounded-full bg-brand text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {t('login')}
          </button>
        </div>
      </div>
    )
  }

  const adminCount = groups.filter(g => g.is_admin).length
  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count ?? 0), 0)

  return (
    <div className="min-h-screen bg-surface text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-surface border-x border-border-light dark:border-border-dark min-h-screen pb-20">
        {/* 헤더 */}
        <header className="px-4 pt-5 pb-2">
          <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
            GROUPS
          </p>
          <h1 className="text-gray-900 dark:text-white text-[26px] font-bold leading-none tracking-[-0.02em]">
            내 그룹
          </h1>
          <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
            {isLoading
              ? '불러오는 중...'
              : groups.length === 0
                ? '아직 참여한 그룹이 없어요'
                : `${groups.length}개 그룹에서 함께 기도하고 있어요`}
          </p>
        </header>

        {/* 통계 */}
        {groups.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap">
            <StatChip label="참여 중" value={groups.length} accent />
            {adminCount > 0 && <StatChip label="관리자" value={adminCount} />}
            <StatChip label="전체 멤버" value={totalMembers} />
          </div>
        )}

        {/* 액션 카드 두 개 */}
        <div className="px-4 pt-4 pb-2 grid grid-cols-2 gap-2">
          <ActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            label={t('createGroup')}
            sublabel="새 모임 시작"
            variant="primary"
            onClick={() => setShowCreate(true)}
          />
          <ActionCard
            icon={<span className="text-[20px]">🎟️</span>}
            label={t('joinGroup')}
            sublabel="초대 코드로"
            variant="secondary"
            onClick={() => setShowJoin(true)}
          />
        </div>

        {/* 그룹 리스트 */}
        <div className="px-4 pt-2 pb-8 space-y-2">
          {isLoading ? (
            <SkeletonRows />
          ) : groups.length === 0 ? (
            <EmptyState />
          ) : (
            groups.map(g => <GroupCard key={g.id} group={g} />)
          )}
        </div>
      </div>

      <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  )
}

// ── Group Card ────────────────────────────────────────
const GroupCard = ({ group }: { group: PrayerGroup }) => (
  <Link
    to={`/groups/${group.id}`}
    className="block group"
  >
    <article
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover:border-[var(--brand-soft-strong)] group-hover:-translate-y-0.5 group-active:translate-y-0"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${
          group.is_admin ? 'from-blue-500 to-blue-600' : 'from-sky-400/60 to-blue-500/40'
        }`}
      />

      <div className="relative z-10 flex items-center gap-3 pl-3.5 pr-3 py-3.5">
        {/* 이모지 아바타 */}
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-[22px] shadow-[0_6px_18px_-6px_var(--brand-glow)]">
          {group.icon || '👥'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-[-0.01em] truncate">
              {group.name}
            </span>
            {group.is_admin && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em] shrink-0">
                ADMIN
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-[12px] text-gray-500 dark:text-white/55 truncate leading-[1.4] mb-1">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-white/45">
            <span className="inline-flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {group.member_count}명
            </span>
            {group.prayer_count > 0 && (
              <>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <span className="inline-flex items-center gap-1">
                  🙏 {group.prayer_count}
                </span>
              </>
            )}
          </div>
        </div>

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </article>
  </Link>
)

// ── Action Card ────────────────────────────────────────
interface ActionCardProps {
  icon: ReactNode
  label: string
  sublabel: string
  variant: 'primary' | 'secondary'
  onClick: () => void
}

const ActionCard = ({ icon, label, sublabel, variant, onClick }: ActionCardProps) => {
  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl p-4 text-left bg-brand shadow-[0_10px_28px_-10px_var(--brand-glow)] hover:shadow-[0_14px_36px_-8px_var(--brand-glow)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.12) 100%)',
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/25 backdrop-blur-sm text-white mb-2.5">
            {icon}
          </div>
          <p className="text-white text-[14px] font-bold tracking-[-0.01em]">{label}</p>
          <p className="text-white/80 text-[11px] mt-0.5">{sublabel}</p>
        </div>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-4 text-left bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] hover:border-[var(--brand-soft-strong)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      <div className="relative">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand mb-2.5">
          {icon}
        </div>
        <p className="text-gray-900 dark:text-white text-[14px] font-bold tracking-[-0.01em]">
          {label}
        </p>
        <p className="text-gray-500 dark:text-white/55 text-[11px] mt-0.5">{sublabel}</p>
      </div>
    </button>
  )
}

// ── 통계 칩 ────────────────────────────────────────────
const StatChip = ({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) => (
  <span
    className={
      accent
        ? 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-[12px] font-semibold text-brand'
        : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-[12px] font-semibold text-gray-700 dark:text-white/75'
    }
  >
    {label}
    <span className="font-bold">{value}</span>
  </span>
)

// ── Skeleton ───────────────────────────────────────────
const SkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="h-[76px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse"
      />
    ))}
  </div>
)

// ── Empty ──────────────────────────────────────────────
const EmptyState = () => (
  <div className="mx-0 my-2 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-10 px-6 text-center">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
      <span className="text-[28px]">🤝</span>
    </div>
    <p className="text-gray-900 dark:text-white text-[14.5px] font-bold mb-1">
      아직 참여한 그룹이 없어요
    </p>
    <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
      새 그룹을 만들거나
      <br />
      초대 코드로 함께해보세요
    </p>
  </div>
)

export default MyGroups
