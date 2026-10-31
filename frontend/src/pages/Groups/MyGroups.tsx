// 내 그룹 리스트 페이지 — /groups
// 가사 카드(Spotify 가사 화면) + 성구 한 단어 커버: 방은 테마의 한 단어로 기억되고,
// 목록에서 가장 큰 글자는 식구들이 실제로 올린 기도다. 맨 위 카드는 최근 활동순 첫 방(펼친 방),
// 나머지 방은 작은 커버와 지금 줄 하나 — 누르면 맨 위로 펼친다. PC는 왼쪽 라이브러리 + 오른쪽 무대.
// 판 색은 방 고유 색(utils/roomColor), 라이트/다크 차이는 theme.css 의 --gl-* 토큰.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import {
  useMyGroups,
  useDiscoverGroups,
  useJoinOpenGroup,
  useRequestJoinGroup,
} from '../../hooks/useGroups'
import { CreateGroupModal, JoinGroupModal } from '../../components/prayer/GroupModals'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { isAuthenticated } from '../../utils/auth'
import type { PrayerGroup } from '../../types/prayer'
import { GroupGlyph, TicketIcon } from './GroupIcons'
import { toastFeedback } from '../../utils/toast'
import { queryClient } from '../../config/queryClient'
import { fetchGroup } from '../../api/group'
import { groupKeys } from '../../hooks/useGroups'
import { groupDetailLoader } from '../../utils/routePreload'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { smoothScrollToElement } from '../../utils/scrollTo'
import {
  KeywordCover,
  RoomCompactCard,
  RoomHeroCard,
  RoomStage,
} from './components/RoomLyricCards'

// 커버의 한 단어(Black Han Sans)는 이 화면에서만 쓴다 — 모듈이 로드될 때 붙인다
void ensureFontFamily('blackHanSans')

const MyGroups = () => {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const loggedIn = isAuthenticated()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data, isLoading } = useMyGroups()
  const groups: PrayerGroup[] = data?.data.items ?? []

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)

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
  const selected = groups.find((g) => g.id === selectedId) ?? groups[0] ?? null
  const others = selected ? groups.filter((g) => g.id !== selected.id) : []
  const prayedToday = groups.reduce((sum, g) => sum + (g.checkins_today ?? 0), 0)
  const hasSignals = groups.some((g) => g.checkins_today != null)

  // compact 카드 → 맨 위로 펼치고 그 자리로 부드럽게 올린다 (모바일은 scrollIntoView smooth 가 무시됨)
  const expand = (id: number) => {
    setSelectedId(id)
    requestAnimationFrame(() => smoothScrollToElement(heroRef.current, { offset: 76 }))
  }

  const summary = isLoading
    ? t('groupsLoading')
    : groups.length === 0
      ? t('groupsNoneYet')
      : hasSignals && prayedToday > 0
        ? `${groups.length}곳 · 오늘 ${prayedToday}명이 함께 기도했어요`
        : t(groups.length === 1 ? 'groupsCountSummaryOne' : 'groupsCountSummary').replace('{count}', String(groups.length))

  const addButton = (
    <button
      type="button"
      onClick={() => setShowAdd(true)}
      className="shrink-0 w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-[0_8px_24px_-8px_var(--brand-glow)] active:scale-95 transition-all"
      aria-label="기도방 만들기 또는 참여하기"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-gray-900 dark:text-gray-100 page-stage">
      <div className="max-w-md mx-auto min-h-screen pb-24 lg:max-w-[1240px] lg:px-5 lg:pt-3 lg:pb-12">
        {/* 헤더 — + 하나로 만들기·참여를 모두 연다 */}
        <header className="px-4 pt-5 pb-3 flex items-center justify-between gap-3 lg:px-1 lg:pt-2">
          <div className="min-w-0">
            <h1 className="text-ink-strong text-[24px] lg:text-[28px] font-extrabold leading-tight tracking-[-0.035em]">
              {t('myGroups')}
            </h1>
            <p className="text-gray-500 dark:text-white/55 text-[12.5px] mt-1">{summary}</p>
          </div>
          {addButton}
        </header>

        {isLoading ? (
          <SkeletonRows />
        ) : noGroups ? (
          // 그룹이 없는 새가족 — 둘러보기가 첫 화면 (초대 없이도 공동체를 찾는다)
          <div className="px-4 lg:px-1 space-y-4">
            <DiscoverShelf promoted />
            <EmptyState onAdd={() => setShowAdd(true)} />
          </div>
        ) : isDesktop && selected ? (
          // PC — 왼쪽 라이브러리(방 목록 + 둘러보기) / 오른쪽 무대(고른 방)
          <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
            <aside className="sticky top-[4.5rem] max-h-[calc((100vh-5.5rem)/var(--az,1))] overflow-y-auto scrollbar-hide rounded-3xl bg-[var(--surface-container)] border border-black/[0.05] dark:border-white/[0.07] p-2.5">
              <p className="px-2 pt-1.5 pb-2 text-[12px] font-bold text-gray-400 dark:text-white/40 tracking-[0.06em]">
                내 기도방 {groups.length}
              </p>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="gl-lib-item"
                  aria-pressed={g.id === selected.id}
                  onClick={() => setSelectedId(g.id)}
                  onPointerEnter={() => warmGroupDetail(g.id)}
                >
                  <KeywordCover group={g} size={48} radius={8} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14px] font-bold truncate ${g.id === selected.id ? 'text-brand' : 'text-ink-strong'}`}>
                      {g.name}
                    </span>
                    <span className="block text-[11.5px] text-gray-500 dark:text-white/50 truncate">
                      {(g.new_prayers_week ?? 0) > 0 && (
                        <span className="text-brand font-bold">● 새 기도 {g.new_prayers_week} · </span>
                      )}
                      {g.recent_prayers?.[0]?.text ?? g.description ?? `${g.member_count}명`}
                    </span>
                  </span>
                </button>
              ))}
              <DiscoverRows />
            </aside>
            <div onPointerEnter={() => warmGroupDetail(selected.id)}>
              <RoomStage group={selected} />
            </div>
          </div>
        ) : selected ? (
          // 모바일 — 펼친 방 하나 + 나머지 compact + 둘러보기 선반
          <div className="px-3.5 space-y-3">
            <div ref={heroRef} className="scroll-mt-20">
              <RoomHeroCard key={selected.id} group={selected} onWarm={() => warmGroupDetail(selected.id)} />
            </div>
            {others.map((g) => (
              <RoomCompactCard key={g.id} group={g} onExpand={() => expand(g.id)} onWarm={() => warmGroupDetail(g.id)} />
            ))}
            <div className="pt-3">
              <DiscoverShelf />
            </div>
          </div>
        ) : null}
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

// 카드 터치·호버 순간 상세 청크와 방 정보를 미리 받는다 — 탭 뒤 스피너·빈 스켈레톤 구간을 없앤다
// (staleTime 은 useGroup 과 같은 1분 — 막 받은 데이터면 다시 요청하지 않는다)
const warmGroupDetail = (groupId: number) => {
  void groupDetailLoader()
  void queryClient.prefetchQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => fetchGroup(groupId),
    staleTime: 1000 * 60,
  })
}

// ── 둘러보기(디렉터리) ─────────────────────────────────
// 공개·승인제 그룹 중 내가 아직 안 들어간 방 — 새가족도 초대 없이 공동체를 찾는다.
const useDiscoverJoin = () => {
  const navigate = useNavigate()
  const query = useDiscoverGroups()
  const joinOpen = useJoinOpenGroup(toastFeedback({ success: '그룹에 가입했어요 🙌', error: '그룹 가입에 실패했습니다' }))
  const requestJoin = useRequestJoinGroup(toastFeedback({ success: '가입을 신청했어요. 승인되면 알려드릴게요', error: '가입 신청에 실패했습니다' }))
  const [pendingId, setPendingId] = useState<number | null>(null)

  const join = async (g: PrayerGroup) => {
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
  const label = (g: PrayerGroup) =>
    g.my_join_request_status === 'pending'
      ? '신청됨'
      : pendingId === g.id
        ? '…'
        : g.visibility === 'public'
          ? '바로 가입'
          : '가입 신청'
  const disabled = (g: PrayerGroup) => g.my_join_request_status === 'pending' || pendingId === g.id
  return { groups: query.data?.data.items ?? [], isLoading: query.isLoading, join, label, disabled }
}

const joinBtnClass = (requested: boolean) =>
  [
    'h-8 rounded-full text-[12px] font-bold transition-all disabled:opacity-60',
    requested
      ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/40'
      : 'bg-brand text-white shadow-[0_6px_18px_-8px_var(--brand-glow)]',
  ].join(' ')

// 모바일(그리고 방이 없을 때 PC) — 한 단어 커버 선반
const DiscoverShelf = ({ promoted }: { promoted?: boolean }) => {
  const d = useDiscoverJoin()
  if (!d.isLoading && d.groups.length === 0) return null
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5 px-1">
        <h2 className="text-[17px] font-extrabold text-ink-strong tracking-[-0.035em]">둘러보기</h2>
        <span className="text-[11.5px] text-gray-400 dark:text-white/40">
          {promoted ? '초대 없이도 함께할 수 있어요' : '함께할 수 있는 기도방이에요'}
        </span>
      </div>
      {d.isLoading ? (
        <div className="flex gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[132px] h-[132px] rounded-xl bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="gl-shelf">
          {d.groups.map((g) => (
            <article key={g.id} className="gl-shelf-item">
              <KeywordCover group={g} size={132} radius={12} solo />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ink-strong truncate">{g.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-white/50">
                  {g.member_count}명 · {g.visibility === 'public' ? '공개' : '승인제'}
                </p>
              </div>
              <button
                type="button"
                disabled={d.disabled(g)}
                onClick={() => d.join(g)}
                className={joinBtnClass(g.my_join_request_status === 'pending')}
              >
                {d.label(g)}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

// PC 라이브러리 아래 — 작은 행
const DiscoverRows = () => {
  const d = useDiscoverJoin()
  if (d.isLoading || d.groups.length === 0) return null
  return (
    <>
      <p className="px-2 pt-4 pb-1.5 text-[12px] font-bold text-gray-400 dark:text-white/40 tracking-[0.06em]">
        둘러보기 {d.groups.length}
      </p>
      {d.groups.map((g) => (
        <div key={g.id} className="flex items-center gap-2.5 px-2 py-1.5">
          <KeywordCover group={g} size={40} radius={7} solo />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink-strong truncate">{g.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-white/50">
              {g.member_count}명 · {g.visibility === 'public' ? '공개' : '승인제'}
            </p>
          </div>
          <button
            type="button"
            disabled={d.disabled(g)}
            onClick={() => d.join(g)}
            className={`${joinBtnClass(g.my_join_request_status === 'pending')} px-3 !h-7 text-[11px]`}
          >
            {d.label(g) === '바로 가입' ? '가입' : d.label(g) === '가입 신청' ? '신청' : d.label(g)}
          </button>
        </div>
      ))}
    </>
  )
}

// ── Skeleton ───────────────────────────────────────────
// 실제 카드와 같은 자리·모양 — 모바일은 펼친 카드 하나 + compact 둘, PC는 라이브러리 + 무대
const SkeletonRows = () => (
  <>
    <div className="px-3.5 space-y-3 lg:hidden">
      <div className="h-[330px] rounded-[22px] bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
      <div className="h-[128px] rounded-[22px] bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
      <div className="h-[128px] rounded-[22px] bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
    </div>
    <div className="hidden lg:grid grid-cols-[300px_minmax(0,1fr)] gap-5">
      <div className="h-[420px] rounded-3xl bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
      <div className="h-[560px] rounded-[26px] bg-gray-200/70 dark:bg-white/[0.05] animate-pulse" />
    </div>
  </>
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
        className="mt-4 h-10 px-5 rounded-full bg-[var(--brand-soft)] border border-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold"
      >
        만들거나 참여하기
      </button>
    </div>
  )
}

export default MyGroups
