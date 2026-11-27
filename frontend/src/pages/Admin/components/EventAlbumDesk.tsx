// 행사 앨범 관리 — 앨범 데스크(2026-11-27 개편)
//
// 예전 화면은 카드 행 + 왼쪽 파란 막대 + 이모지 메타 + 펼침 안 버튼 4개라 촌스러웠다.
// 교회소식(NewsDesk)·섬기는 사람들(PeopleDesk)과 같은 '목록 + 상세' 2단으로 바꾼다.
//   PC(lg+)  왼쪽 앨범 목록(연도별 묶음, 표지 사진 + 날짜·태그 + 숫자) / 오른쪽 상세(공개 스위치·
//            수정·삭제 + 숫자 띠 + 성도 화면 미리보기 = /news 의 EventAlbumDetail 그대로)
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 데이터·액션은 EventAlbumManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { coverThumb } from '../../../types/eventAlbum'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { EventTagIcon } from '../../News/components/NewsIcons'
import EventAlbumDetail from '../../News/components/EventAlbumDetail'

export type AlbumSeg = 'all' | 'published' | 'hidden'
export type AlbumSort = 'recent' | 'oldest' | 'reaction'

const WD = ['일', '월', '화', '수', '목', '금', '토']
const ymd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const dayLabel = (d: Date) => (d.getDay() === 0 ? '주일' : WD[d.getDay()])

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)
const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

// ── 아이콘 ───────────────────────────────────────────────

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
}

// ── 작은 조각 ────────────────────────────────────────────

const Switch = ({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={onClick}
    className={`relative shrink-0 w-11 h-[26px] rounded-full transition-colors ${on ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'}`}
  >
    <span className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : ''}`} />
  </button>
)

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition ${
      danger ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ post, active, onClick }: { post: EventAlbumPost; active: boolean; onClick: () => void }) => {
  const d = ymd(post.event_date)
  const cover = coverThumb(post)
  return (
    <button
      id={`album-row-${post.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={`relative shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.06] ring-1 ring-black/[0.05] dark:ring-white/10 ${post.is_published ? '' : 'opacity-50 grayscale'}`}>
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-gray-400 dark:text-white/35">
            <I d={IC.photo} size={22} />
          </span>
        )}
        {post.photo_count > 1 && (
          <span className="absolute right-1 bottom-1 px-1.5 rounded-md bg-black/55 text-white text-[11.5px] font-bold tabular-nums leading-[18px]">
            {post.photo_count}
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          {!post.is_published && (
            <span className="shrink-0 h-[22px] px-2 inline-flex items-center rounded-md text-[12px] font-bold bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65">비공개</span>
          )}
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${post.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>{post.title}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13.5px] text-gray-600 dark:text-white/65 min-w-0">
          <span className="shrink-0 font-semibold tabular-nums">
            {d.getMonth() + 1}월 {d.getDate()}일 ({dayLabel(d)})
          </span>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <EventTagIcon tag={post.tag} width={13} height={13} className="shrink-0 text-brand" />
          <span className="truncate">{post.tag}</span>
        </span>
        <span className="mt-1 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55">
          <span className="inline-flex items-center gap-1"><I d={IC.heart} size={14} />{post.reaction_count}</span>
          <span className="inline-flex items-center gap-1"><I d={IC.chat} size={14} />{post.comment_count}</span>
          {post.event_id != null && <span className="inline-flex items-center gap-1 text-brand"><I d={IC.cal} size={14} />일정</span>}
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1.5 px-1">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="h-[88px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onEdit: (post: EventAlbumPost) => void
  onToggleVisibility: (post: EventAlbumPost) => void
  onDelete: (post: EventAlbumPost) => void
  onViewPublic: (post: EventAlbumPost) => void
  onToggleReaction: (post: EventAlbumPost, emoji: string) => void
  onOpenViewer: (post: EventAlbumPost, index: number) => void
  onOpenEvent: (eventId: number) => void
}

const Detail = ({ post, onClose, ...a }: DetailActions & { post: EventAlbumPost; onClose?: () => void }) => {
  const d = ymd(post.event_date)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={post.is_published} onClick={() => a.onToggleVisibility(post)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${post.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {post.is_published ? '공개 중' : '비공개'}
          </span>
        </div>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(post)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(post)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(post)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold whitespace-nowrap transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <dl className="grid grid-cols-4 mx-4 lg:mx-5 mt-5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
          {(
            [
              ['사진', `${post.photo_count}`, '장'],
              ['반응', `${post.reaction_count}`, '명'],
              ['댓글', `${post.comment_count}`, '개'],
              ['행사일', `${d.getMonth() + 1}.${d.getDate()}`, dayLabel(d)],
            ] as const
          ).map(([k, v, u]) => (
            <div key={k} className="px-3 lg:px-4 py-3 min-w-0">
              <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
              <dd className="mt-0.5 text-ink-strong whitespace-nowrap">
                <span className="text-[22px] lg:text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mx-4 lg:mx-5 mt-3 space-y-2">
          {!post.is_published && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
              아직 성도들에게 안 보여요. 위 스위치를 켜면 바로 소식 › 행사 탭에 올라가요.
            </p>
          )}
          {post.photo_count === 0 && (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
              사진이 한 장도 없어요. '수정'에서 사진을 올려 주세요.
            </p>
          )}
          {post.event_id == null && (
            <button
              type="button"
              onClick={() => a.onEdit(post)}
              className="w-full flex items-center gap-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 px-4 py-2.5 text-left text-[14px] text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand transition break-keep"
            >
              <I d={IC.cal} size={16} className="shrink-0" />
              <span>일정에 연결하면 일정 화면에서 바로 이 사진들로 이어져요</span>
              <span className="ml-auto shrink-0 font-bold">연결하기</span>
            </button>
          )}
        </div>

        <div className="px-4 lg:px-5 pt-5 pb-8">
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
            <I d={IC.eye} size={15} />
            성도에게 이렇게 보여요 <span className="font-medium">— 사진을 누르면 크게 보고, 댓글도 여기서 정리할 수 있어요</span>
          </div>
          <div className="max-w-[760px]">
            <EventAlbumDetail
              post={post}
              isAdmin
              onToggleReaction={(emoji) => a.onToggleReaction(post, emoji)}
              onOpenViewer={(i) => a.onOpenViewer(post, i)}
              onOpenEvent={a.onOpenEvent}
            />
          </div>
          <div className="sm:hidden mt-4 flex gap-2">
            <button type="button" onClick={() => a.onViewPublic(post)} className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              성도 화면에서 보기
            </button>
            <button type="button" onClick={() => a.onDelete(post)} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = (props: DetailActions & { post: EventAlbumPost; onClose: () => void }) => {
  useModalBackButton(props.onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail {...props} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [AlbumSeg, string][] = [
  ['all', '전체'],
  ['published', '공개'],
  ['hidden', '비공개'],
]
const SORTS: [AlbumSort, string][] = [
  ['recent', '최신순'],
  ['oldest', '오래된순'],
  ['reaction', '반응 많은순'],
]

export interface EventAlbumDeskProps extends DetailActions {
  posts: EventAlbumPost[]
  filtered: EventAlbumPost[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: AlbumSeg
  onSegChange: (v: AlbumSeg) => void
  tag: string | null
  onTagChange: (v: string | null) => void
  sort: AlbumSort
  onSortChange: (v: AlbumSort) => void
  onCreate: () => void
  onBack: () => void
  onClearFilters: () => void
  /** 뷰어 등 데스크 위에 띄울 것 */
  children?: ReactNode
}

const EventAlbumDesk = ({
  posts,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  tag,
  onTagChange,
  sort,
  onSortChange,
  onCreate,
  onBack,
  onClearFilters,
  children,
  ...actions
}: EventAlbumDeskProps) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 앨범이 필터에서 빠지면 첫 앨범을 보여 준다
  const activeId = filtered.some((p) => p.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (posts.find((p) => p.id === activeId) ?? null) : null
  const sheetPost = sheetOpen ? (posts.find((p) => p.id === selectedId) ?? null) : null

  const counts: Record<AlbumSeg, number> = {
    all: posts.length,
    published: posts.filter((p) => p.is_published).length,
    hidden: posts.filter((p) => !p.is_published).length,
  }
  const thisYear = new Date().getFullYear()
  const yearPosts = posts.filter((p) => Number(p.event_date.slice(0, 4)) === thisYear)
  const yearPhotos = yearPosts.reduce((n, p) => n + p.photo_count, 0)

  // 실제로 쓰인 태그만, 많이 쓴 순
  const tags = useMemo(() => {
    const m = new Map<string, number>()
    posts.forEach((p) => m.set(p.tag, (m.get(p.tag) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [posts])

  // 날짜순일 때만 연도로 묶는다(반응순은 한 줄로)
  const groups = useMemo(() => {
    if (sort === 'reaction') return [{ key: 'all', label: '', items: filtered }]
    const out: { key: string; label: string; items: EventAlbumPost[] }[] = []
    filtered.forEach((p) => {
      const y = p.event_date.slice(0, 4)
      const last = out[out.length - 1]
      if (last && last.key === y) last.items.push(p)
      else out.push({ key: y, label: `${y}년`, items: [p] })
    })
    return out
  }, [filtered, sort])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!isDesktop()) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((p) => p.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`album-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId])

  const select = (id: number) => {
    setSelectedId(id)
    if (!isDesktop()) setSheetOpen(true)
  }

  const filtering = !!searchTerm || seg !== 'all' || !!tag

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[420px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 앨범 목록 ─────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">행사 앨범</h1>
                <p className="mt-0.5 text-[13.5px] text-gray-500 dark:text-white/55">
                  {loading ? ' ' : (
                    <>
                      올해 <span className="font-bold text-brand tabular-nums">{yearPosts.length}</span>개 행사 · 사진{' '}
                      <span className="font-bold text-ink-strong tabular-nums">{yearPhotos}</span>장
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                앨범 올리기
              </button>
            </div>

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="행사 이름·설명 검색"
                className="w-full h-10 pl-9 pr-9 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
              />
              {searchTerm ? (
                <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white/80" aria-label="검색어 지우기">
                  <I d={IC.close} size={14} />
                </button>
              ) : (
                <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400 dark:text-white/35 border border-gray-300 dark:border-white/15 rounded px-1.5 leading-[18px]">/</kbd>
              )}
            </label>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                {SEGS.map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onSegChange(k)}
                    className={`flex-1 whitespace-nowrap px-2 h-8 rounded-lg text-[13px] font-semibold transition ${
                      seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                    }`}
                  >
                    {l} <span className={`tabular-nums ${seg === k ? 'text-brand' : ''}`}>{counts[k]}</span>
                  </button>
                ))}
              </div>
              <label className="relative shrink-0">
                <span className="sr-only">정렬</span>
                <select
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as AlbumSort)}
                  className="appearance-none h-10 pl-3 pr-7 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[13px] font-semibold text-gray-700 dark:text-white/75 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] cursor-pointer"
                >
                  {SORTS.map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </label>
            </div>

            {tags.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
                {[null, ...tags.map(([t]) => t)].map((t) => (
                  <button
                    key={t ?? 'all'}
                    type="button"
                    onClick={() => onTagChange(t)}
                    className={`shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                      tag === t ? 'bg-ink-strong text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:text-ink-strong'
                    }`}
                  >
                    {t && <EventTagIcon tag={t} width={13} height={13} className="shrink-0" />}
                    {t ?? '모든 행사'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto px-2 pb-24 lg:pb-6">
            {loading ? (
              <RowSkeleton />
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[15px] font-bold text-ink-strong">{filtering ? '조건에 맞는 앨범이 없어요' : '아직 올린 행사 앨범이 없어요'}</p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '앨범 올리기'로 첫 행사 사진을 올려 보세요</p>
                )}
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="mb-2">
                  {g.label && (
                    <div className="sticky top-14 lg:top-0 z-[5] -mx-2 px-4 pt-2 pb-1.5 flex items-baseline gap-1.5 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
                      <span className="text-[14px] font-extrabold text-ink-strong tabular-nums">{g.label}</span>
                      <span className="text-[13px] font-semibold text-gray-500 dark:text-white/50 tabular-nums">{g.items.length}</span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {g.items.map((p) => (
                      <Row key={p.id} post={p} active={p.id === activeId} onClick={() => select(p.id)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} post={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">{loading ? '' : '왼쪽에서 앨범을 골라 주세요'}</div>
          )}
        </section>
      </div>

      {/* 지운 앨범이면 sheetPost 가 없어 저절로 닫힌다 */}
      {sheetOpen && sheetPost && <MobileDetailSheet key={sheetPost.id} post={sheetPost} onClose={() => setSheetOpen(false)} {...actions} />}
      {children}
    </div>
  )
}

export default EventAlbumDesk
