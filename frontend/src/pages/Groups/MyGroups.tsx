// 내 그룹 리스트 페이지 — /groups
// "상태가 보이는 리스트": 카드마다 활동 신호(새 기도·오늘 기도 인원·마지막 활동)를 실어
// 매번 똑같아 보이던 목록에 다시 들어올 이유를 준다. 정렬은 최근 활동순(백엔드).
// 만들기·참여 큰 카드 2장은 헤더의 + 버튼 하나로 접고, 그 자리를 그룹 카드에 양보.
// 그룹이 없는 새가족에게는 둘러보기를 맨 위로 올린다.
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  useMyGroups,
  useDiscoverGroups,
  useJoinOpenGroup,
  useRequestJoinGroup,
} from '../../hooks/useGroups'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { isAuthenticated } from '../../utils/auth'
import groupPixelArt from '../../assets/hero/group-pixel.png'
import groupJoinPixelArt from '../../assets/hero/group-join-pixel.png'
import type { PrayerGroup } from '../../types/prayer'
import { CheckIcon, GroupGlyph, PersonIcon, PrayIcon, TicketIcon } from './GroupIcons'
import { toastFeedback } from '../../utils/toast'

// 마지막 활동 상대 시각 — "방금 전 / N분 전 / N시간 전 / N일 전"
const timeAgo = (iso?: string | null): string | null => {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff) || diff < 0) return null
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day < 30) return `${day}일 전`
  return null // 한 달 넘은 활동은 굳이 강조하지 않는다
}

const MyGroups = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const { data, isLoading } = useMyGroups()
  const groups: PrayerGroup[] = data?.data.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  // 로그인 안 됨 — 합의 톤으로
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
        <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen flex flex-col items-center justify-center px-6 py-12 lg:max-w-2xl lg:mt-3 lg:mb-12 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-[60vh]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--brand-soft-strong)] mb-5">
            <GroupGlyph emoji="👥" size={36} className="text-brand" />
          </div>
          <h2 className="text-ink-strong text-[18px] font-bold tracking-[-0.015em] mb-1.5">
            {t('groupsLoginTitle')}
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

  const noGroups = !isLoading && groups.length === 0

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      {/* lg+: 좁은 셸을 풀고 본문(모임 목록) + 우측 레일(만들기·참여) 2단 */}
      <div className="lg:max-w-[1240px] lg:mx-auto lg:flex lg:items-start lg:gap-6 lg:px-5 lg:pt-3 lg:pb-12">
      <div className="max-w-md mx-auto bg-[var(--app-canvas)] min-h-screen pb-20 lg:max-w-none lg:mx-0 lg:flex-1 lg:min-w-0 lg:rounded-3xl lg:border lg:border-border-light dark:lg:border-border-dark lg:overflow-hidden lg:min-h-0">
        {/* 헤더 — 우측 + 버튼 하나로 만들기·참여를 모두 연다 */}
        <header className="px-4 pt-5 pb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-brand text-[11.5px] font-bold tracking-[0.12em] uppercase mb-1.5">
              GROUPS
            </p>
            <h1 className="text-ink-strong text-[26px] font-bold leading-none tracking-[-0.02em]">
              {t('myGroups')}
            </h1>
            <p className="text-gray-500 dark:text-white/55 text-[13px] mt-2">
              {isLoading
                ? t('groupsLoading')
                : groups.length === 0
                  ? t('groupsNoneYet')
                  : t(groups.length === 1 ? 'groupsCountSummaryOne' : 'groupsCountSummary')
                      .replace('{count}', String(groups.length))}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="shrink-0 mt-1 w-11 h-11 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_8px_24px_-8px_var(--brand-glow)] hover:shadow-[0_10px_28px_-6px_var(--brand-glow)] active:scale-95 transition-all lg:hidden"
            aria-label="기도방 만들기 또는 참여하기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </header>

        {/* 그룹이 없는 새가족 — 둘러보기가 첫 화면 (초대 없이도 공동체를 찾는다) */}
        {noGroups && <DiscoverSection promoted />}

        {/* 그룹 리스트 */}
        <div className="px-4 pt-2 pb-4 space-y-2 lg:pt-4 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 lg:items-start">
          {isLoading ? (
            <SkeletonRows />
          ) : groups.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            groups.map(g => <GroupCard key={g.id} group={g} />)
          )}
        </div>

        {/* 둘러보기 — 이미 방이 있는 사람에겐 목록 아래 디렉터리로 */}
        {!noGroups && <DiscoverSection />}
      </div>

      {/* 우측 위젯 레일 (lg+) — 모임 만들기·참여를 항상 손 닿는 곳에 두고,
          본문은 모임 카드에만 집중하게 한다 */}
      <aside className="hidden lg:flex lg:w-[312px] lg:shrink-0 lg:flex-col lg:gap-2.5 lg:sticky lg:top-[4.5rem]">
        <ActionCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          label={t('createGroup')}
          sublabel={t('groupsCreateSub')}
          variant="primary"
          onClick={() => setShowCreate(true)}
        />
        <ActionCard
          icon={<TicketIcon size={22} />}
          label={t('joinGroup')}
          sublabel={t('groupsJoinSub')}
          variant="secondary"
          onClick={() => setShowJoin(true)}
        />
      </aside>
      </div>

      {/* + 버튼 선택 시트 — 만들기 / 초대코드 참여 */}
      {showAdd && (
        <AddChooserSheet
          onClose={() => setShowAdd(false)}
          onCreate={() => {
            setShowAdd(false)
            setShowCreate(true)
          }}
          onJoin={() => {
            setShowAdd(false)
            setShowJoin(true)
          }}
        />
      )}

      <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <JoinGroupModal isOpen={showJoin} onClose={() => setShowJoin(false)} />
    </div>
  )
}

// ── + 선택 시트 ────────────────────────────────────────
const AddChooserSheet = ({
  onClose,
  onCreate,
  onJoin,
}: {
  onClose: () => void
  onCreate: () => void
  onJoin: () => void
}) => {
  useModalBackButton(onClose)
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl border border-black/[0.04] dark:border-white/[0.08] p-5 pb-8 sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[15px] font-bold text-ink-strong mb-4">기도방을 시작해볼까요?</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onCreate}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-brand text-left shadow-[0_10px_28px_-10px_var(--brand-glow)] active:scale-[0.99] transition-transform"
          >
            <span className="shrink-0 w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span>
              <span className="block text-white text-[14px] font-bold">새 기도방 만들기</span>
              <span className="block text-white/80 text-[11.5px] mt-0.5">우리 모임의 기도방을 새로 열어요</span>
            </span>
          </button>
          <button
            type="button"
            onClick={onJoin}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.08] text-left active:scale-[0.99] transition-transform"
          >
            <span className="shrink-0 w-10 h-10 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] flex items-center justify-center text-brand">
              <TicketIcon size={20} />
            </span>
            <span>
              <span className="block text-ink-strong text-[14px] font-bold">초대 코드로 참여하기</span>
              <span className="block text-gray-500 dark:text-white/55 text-[11.5px] mt-0.5">받은 코드를 입력하고 바로 들어가요</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Group Card ────────────────────────────────────────
// 그룹마다 고유 색을 입혀 리스트가 단조로워지지 않게 한다 (id 기반 고정 팔레트).
// 앰버는 '응답됨' 전용 액센트라 팔레트에서 제외.
const GROUP_TILE_COLORS = [
  '#3182f6', // 토스 블루
  '#0ea5e9', // 스카이
  '#6366f1', // 인디고
  '#8b5cf6', // 바이올렛
  '#14b8a6', // 틸
  '#10b981', // 에메랄드
]

const GroupCard = ({ group }: { group: PrayerGroup }) => {
  const { t } = useLanguage()
  const tileColor = GROUP_TILE_COLORS[group.id % GROUP_TILE_COLORS.length]
  const memberCount = group.member_count ?? 0
  const memberLabel = t(memberCount === 1 ? 'groupMemberCountOne' : 'groupMemberCount')
    .replace('{count}', String(memberCount))

  // 활동 신호 — 구버전 백엔드(필드 없음)에서는 기존 정보만 보인다
  const hasSignals = group.new_prayers_week != null
  const newPrayers = group.new_prayers_week ?? 0
  const checkins = group.checkins_today ?? 0
  const checkedIn = !!group.my_checked_in_today
  const activity = timeAgo(group.last_activity_at)

  return (
  <Link
    to={`/groups/${group.id}`}
    className="block group"
  >
    <article
      className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover:border-[var(--brand-soft-strong)] group-hover:-translate-y-0.5 group-active:translate-y-0"
    >
      <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
      {/* 그룹 이모지 워터마크 — 카드 오른쪽에 크게, 아주 옅게 */}
      <span
        aria-hidden
        className="absolute right-10 top-1/2 -translate-y-1/2 text-ink-strong rotate-[-10deg] pointer-events-none select-none opacity-[0.08] dark:opacity-[0.14]"
      >
        <GroupGlyph emoji={group.icon || '👥'} size={56} />
      </span>
      {/* 타일 색을 카드 오른쪽에 은은한 틴트로 이어준다 */}
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 w-2/5 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${tileColor}14, transparent)` }}
      />

      <div className="relative z-10 flex items-center gap-3 pl-3.5 pr-3 py-3.5">
        {/* 이모지 아바타 — 오늘 기도한 방은 우하단에 체크 뱃지 */}
        <div className="relative shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
            style={{ background: tileColor, boxShadow: `0 6px 18px -6px ${tileColor}88` }}
          >
            <GroupGlyph emoji={group.icon || '👥'} size={26} />
          </div>
          {checkedIn && (
            <span
              className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-white dark:bg-card-dark border border-[var(--brand-soft-strong)] flex items-center justify-center text-brand"
              title="오늘 기도했어요"
            >
              <CheckIcon size={11} />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[15px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              {group.name}
            </span>
            {group.is_admin && (
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand tracking-[0.05em] shrink-0">
                ADMIN
              </span>
            )}
          </div>

          {/* 활동 신호 줄 — "지금 무슨 일이 있는지"가 카드에서 바로 보인다 */}
          {hasSignals && (newPrayers > 0 || checkins > 0) ? (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {newPrayers > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-brand text-[10.5px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden />
                  새 기도 {newPrayers}
                </span>
              )}
              {checkins > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-white/55">
                  <PrayIcon size={11} /> 오늘 {checkins}명 기도
                </span>
              )}
            </div>
          ) : group.description ? (
            <p className="text-[12px] text-gray-500 dark:text-white/55 truncate leading-[1.4] mb-1">
              {group.description}
            </p>
          ) : null}

          <div className="flex items-center gap-2.5 text-[11px] text-gray-400 dark:text-white/45">
            <span className="inline-flex items-center gap-1">
              <PersonIcon size={11} />
              {memberLabel}
            </span>
            {group.prayer_count > 0 && (
              <>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <span className="inline-flex items-center gap-1">
                  <PrayIcon size={12} /> {group.prayer_count}
                </span>
              </>
            )}
            {activity && (
              <>
                <span className="text-gray-300 dark:text-white/20">·</span>
                <span>{activity} 활동</span>
              </>
            )}
          </div>
        </div>

        {/* 화살표 — 워터마크와 겹쳐 보이지 않게 원형 칩 위에 얹는다 */}
        <span className="shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-white/[0.08] border border-gray-200/60 dark:border-white/[0.06] flex items-center justify-center text-gray-500 dark:text-white/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand group-hover:bg-[var(--brand-soft)] group-hover:border-[var(--brand-soft-strong)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </article>
  </Link>
  )
}

// ── Action Card (PC 레일 전용) ─────────────────────────
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
        {/* 배경 일러스트 — 함께 모인 교인들 도트아트 (흰색 반투명, 왼쪽으로 페이드되어 텍스트 가독성 유지) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.30]"
          style={{
            backgroundImage: `url(${groupPixelArt})`,
            backgroundSize: 'auto 100%',
            backgroundPosition: 'right bottom',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}
          aria-hidden
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
      {/* 배경 일러스트 — 손 흔드는 교인 도트아트. 흰 카드에서도 보이도록 mask로 브랜드 색을 입힌다 */}
      <span
        className="absolute inset-0 pointer-events-none opacity-[0.16] dark:opacity-[0.26]"
        style={{
          backgroundColor: 'var(--brand)',
          maskImage: `url(${groupJoinPixelArt})`,
          WebkitMaskImage: `url(${groupJoinPixelArt})`,
          maskSize: 'auto 100%',
          WebkitMaskSize: 'auto 100%',
          maskPosition: 'right bottom',
          WebkitMaskPosition: 'right bottom',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand mb-2.5">
          {icon}
        </div>
        <p className="text-ink-strong text-[14px] font-bold tracking-[-0.01em]">
          {label}
        </p>
        <p className="text-gray-500 dark:text-white/55 text-[11px] mt-0.5">{sublabel}</p>
      </div>
    </button>
  )
}

// ── 둘러보기(디렉터리) ─────────────────────────────────
// 공개·승인제 그룹 중 내가 아직 안 들어간 방 — 새가족도 초대 없이 공동체를 찾는다.
// promoted: 그룹이 없는 사람에게 목록보다 먼저 보여줄 때
const DiscoverSection = ({ promoted }: { promoted?: boolean }) => {
  const navigate = useNavigate()
  const { data, isLoading } = useDiscoverGroups()
  const joinOpen = useJoinOpenGroup(toastFeedback({ success: '그룹에 가입했어요 🙌', error: '그룹 가입에 실패했습니다' }))
  const requestJoin = useRequestJoinGroup(toastFeedback({ success: '가입을 신청했어요. 승인되면 알려드릴게요', error: '가입 신청에 실패했습니다' }))
  const [pendingId, setPendingId] = useState<number | null>(null)

  const groups = data?.data.items ?? []
  if (!isLoading && groups.length === 0) return null

  const handleJoin = async (g: PrayerGroup) => {
    setPendingId(g.id)
    try {
      if (g.visibility === 'public') {
        await joinOpen.mutateAsync(g.id)
        navigate(`/groups/${g.id}`)
      } else {
        await requestJoin.mutateAsync({ groupId: g.id })
      }
    } catch {
      /* 토스트는 훅에서 처리 */
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className={promoted ? 'px-4 pt-3 pb-2' : 'px-4 pt-2 pb-8'}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <span className="text-[13px]">🧭</span>
        <h2 className="text-[13px] font-bold text-ink-strong">둘러보기</h2>
        <span className="text-[11px] text-gray-400 dark:text-white/40">
          {promoted ? '초대 없이도 함께할 수 있어요' : '함께할 수 있는 모임이에요'}
        </span>
      </div>
      {isLoading ? (
        <div className="h-[76px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 lg:items-start">
          {groups.map((g) => {
            const requested = g.my_join_request_status === 'pending'
            return (
              <article
                key={g.id}
                className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] px-3.5 py-3 flex items-center gap-3"
              >
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-[var(--brand-soft-strong)] flex items-center justify-center text-brand">
                  <GroupGlyph emoji={g.icon || '👥'} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-bold text-ink-strong truncate">{g.name}</p>
                    <span className="shrink-0 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55">
                      {g.visibility === 'public' ? '공개' : '승인제'}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate leading-[1.4]">
                      {g.description}
                    </p>
                  )}
                  <p className="text-[10.5px] text-gray-400 dark:text-white/40 mt-0.5 inline-flex items-center gap-1">
                    <PersonIcon size={11} /> {g.member_count}명
                    {g.prayer_count > 0 && (<><span>·</span><PrayIcon size={11} /> {g.prayer_count}</>)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={requested || pendingId === g.id}
                  onClick={() => handleJoin(g)}
                  className={[
                    'shrink-0 px-3.5 h-9 rounded-full text-[12px] font-bold transition-all',
                    requested
                      ? 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 dark:text-white/40'
                      : 'bg-brand text-white shadow-[0_6px_18px_-8px_var(--brand-glow)] disabled:opacity-60',
                  ].join(' ')}
                >
                  {requested
                    ? '신청됨'
                    : pendingId === g.id
                      ? '…'
                      : g.visibility === 'public'
                        ? '바로 가입'
                        : '가입 신청'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
const EmptyState = ({ onAdd }: { onAdd: () => void }) => {
  const { t } = useLanguage()
  return (
    <div className="mx-0 my-2 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] py-10 px-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-soft-strong)] mb-3">
        <span className="text-[28px]">🤝</span>
      </div>
      <p className="text-ink-strong text-[14.5px] font-bold mb-1">
        {t('groupsNoneYet')}
      </p>
      <p className="text-gray-500 dark:text-white/55 text-[12.5px] leading-[1.6]">
        {t('groupsEmptyLine1')}
        <br />
        {t('groupsEmptyLine2')}
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 h-10 px-5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold lg:hidden"
      >
        만들거나 참여하기
      </button>
    </div>
  )
}

export default MyGroups
