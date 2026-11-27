// 교회소식 게시판 관리 — 편집 데스크(2026-11-27 A안, 시안 /#/dev/news-admin?v=a)
//
// 예전 화면은 카드 행 + 펼침 안 버튼 5개 + 큰 파란 안내 상자라 "촌스럽다"는 평이었다.
//   PC(lg+)  왼쪽 목록(큰 날짜 숫자 + 항목 제목 한 줄 + 숫자) / 오른쪽 상세(공개 스위치·고정·수정·삭제
//            + 숫자 띠 + 성도 화면 미리보기) — 각자 스크롤, ↑↓ 이동, / 검색
//   모바일   목록 → 상세 한 화면(뒤로가기로 닫힘)
// 미리보기는 /news 와 같은 NewsDigestView 를 그대로 써서, 올린 원고가 성도 화면에서 어떻게
// 나뉘어 보이는지 관리 화면에서 바로 확인한다. 데이터·액션은 NewsManagement 가 쥔다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NewsItem } from '../../../types/news'
import { useNewsDetail } from '../../../hooks/useNews'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { formatBytes } from '../../../utils/formatBytes'
import { renderKeepTogether } from '../../../utils/keepTogether'
import NewsDigestView from '../../News/components/newsDigest/NewsDigestView'
import { parseNewsDigest } from '../../News/components/newsDigest/parseNewsDigest'

export type NewsSeg = 'all' | 'published' | 'hidden' | 'pinned'

/** 디지털 주보를 적용하면 서버가 이 분류로 '○월 ○일 주보 소식'을 자동으로 올린다 */
const WEEKLY_CATEGORY = '주보 소식'

const WD = ['주일', '월', '화', '수', '목', '금', '토']
const dateOf = (n: NewsItem) => new Date(n.published_at ?? n.created_at ?? 0)
const dayName = (d: Date) => WD[d.getDay()]
const dotDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${d.getDay() === 0 ? '일' : WD[d.getDay()]})`
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

const isTypingTarget = (el: Element | null) =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)

// ── 아이콘 ───────────────────────────────────────────────

const I = ({ d, size = 16, className = '' }: { d: ReactNode; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {d}
  </svg>
)
const IC = {
  search: <><circle cx="11" cy="11" r="7.5" /><path d="M21 21l-4.6-4.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  pin: <><path d="M12 17v5" /><path d="M9 2h6l-1 6 3.5 3.5V14h-11v-2.5L10 8 9 2z" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6l-1.4 14a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 6" /><path d="M9 6V4h6v2" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  photo: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>,
  clip: <path d="M21 11.5l-8.6 8.6a5.3 5.3 0 0 1-7.5-7.5l8.6-8.6a3.5 3.5 0 0 1 5 5l-8.6 8.6a1.8 1.8 0 0 1-2.5-2.5l7.9-7.9" />,
  back: <path d="M15 18l-6-6 6-6" />,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
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

const Badge = ({ tone, children }: { tone: 'pin' | 'hidden' | 'cat'; children: ReactNode }) => (
  <span
    className={`inline-flex items-center gap-0.5 shrink-0 h-[22px] px-2 rounded-md text-[12px] font-bold ${
      tone === 'pin'
        ? 'bg-[var(--brand-soft-strong)] text-brand'
        : tone === 'hidden'
          ? 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-white/65'
          : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/60'
    }`}
  >
    {tone === 'pin' && <I d={IC.pin} size={12} />}
    {children}
  </span>
)

const TextBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold transition ${
      danger
        ? 'text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10'
        : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/[0.07]'
    }`}
  >
    <I d={icon} size={16} />
    <span>{label}</span>
  </button>
)

// ── 다음 주일 주보 소식 상태 ─────────────────────────────
// 주보 소식은 디지털 주보 적용 때 자동으로 올라온다 — 여기서 직접 쓰게 하면 두 벌이 생긴다.
// 그래서 '쓰기' 대신 "올라왔나 / 아직인가"만 보여 주고, 아직이면 주보 관리로 보낸다.

const upcomingSunday = (from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7))
  return d
}

const WeeklyStatus = ({ items, onSelect }: { items: NewsItem[]; onSelect: (id: number) => void }) => {
  const navigate = useNavigate()
  const sunday = upcomingSunday()
  const post = items.find((n) => n.category === WEEKLY_CATEGORY && sameDay(dateOf(n), sunday))
  const label = `${sunday.getMonth() + 1}월 ${sunday.getDate()}일`
  return (
    <button
      type="button"
      onClick={() => (post ? onSelect(post.id) : navigate('/admin/bulletins'))}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition ${
        post
          ? 'bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07]'
          : 'border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)]'
      }`}
    >
      <span className={`shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center leading-none ${post ? 'bg-white dark:bg-white/[0.08] text-ink-strong' : 'bg-brand text-white'}`}>
        <span className="text-[19px] font-extrabold tabular-nums">{sunday.getDate()}</span>
        <span className="text-[10.5px] font-bold mt-0.5 opacity-80">주일</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink-strong">
          {label} 주보 소식 {post ? '올라왔어요' : '아직이에요'}
        </span>
        <span className="block text-[13px] text-gray-600 dark:text-white/60 truncate">
          {post
            ? post.is_published
              ? `공개 중 · 조회 ${post.views}`
              : '비공개로 있어요 — 눌러서 확인'
            : '디지털 주보를 적용하면 자동으로 올라와요'}
        </span>
      </span>
      <span className="shrink-0 text-brand">
        <I d={post ? IC.check : IC.book} size={19} />
      </span>
    </button>
  )
}

// ── 목록 행 ──────────────────────────────────────────────

const Row = ({ news, active, onClick }: { news: NewsItem; active: boolean; onClick: () => void }) => {
  const d = dateOf(news)
  const hl = news.highlights ?? []
  const line = hl.length ? `${hl.slice(0, 2).join(' · ')}${hl.length > 2 ? ` 외 ${hl.length - 2}건` : ''}` : news.summary
  return (
    <button
      id={`news-row-${news.id}`}
      type="button"
      onClick={onClick}
      aria-current={active}
      className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'lg:bg-[var(--brand-soft)] lg:ring-1 lg:ring-[var(--brand-glow)]' : ''
      } hover:bg-gray-50 dark:hover:bg-white/[0.04]`}
    >
      <span className={`shrink-0 w-[58px] text-center pt-0.5 ${news.is_published ? '' : 'opacity-50'}`}>
        <span className={`block text-[26px] leading-none font-extrabold tabular-nums tracking-tight ${active ? 'lg:text-brand text-ink-strong' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
          {d.getMonth() + 1}월 · {dayName(d)}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {news.is_pinned && <Badge tone="pin">고정</Badge>}
          <span className={`truncate text-[15.5px] font-bold tracking-[-0.01em] ${news.is_published ? 'text-ink-strong' : 'text-gray-500 dark:text-white/50'}`}>
            {news.title}
          </span>
        </span>
        {line && <span className="block mt-1 truncate text-[13.5px] text-gray-600 dark:text-white/65">{line}</span>}
        <span className="mt-1.5 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55">
          {!news.is_published && <Badge tone="hidden">비공개</Badge>}
          {news.category && news.category !== WEEKLY_CATEGORY && <Badge tone="cat">{news.category}</Badge>}
          <span className="inline-flex items-center gap-1"><I d={IC.eye} size={14} />{news.views}</span>
          {news.image_count > 0 && <span className="inline-flex items-center gap-1"><I d={IC.photo} size={14} />{news.image_count}</span>}
          {news.file_count > 0 && <span className="inline-flex items-center gap-1"><I d={IC.clip} size={14} />{news.file_count}</span>}
        </span>
      </span>
    </button>
  )
}

const RowSkeleton = () => (
  <div className="space-y-1 px-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="h-[86px] rounded-2xl bg-gray-100/70 dark:bg-white/[0.04] animate-pulse" />
    ))}
  </div>
)

// ── 성도 화면 미리보기 ───────────────────────────────────

const PublicPreview = ({ news }: { news: NewsItem }) => {
  // 관리자 상세 조회는 조회수를 올리지 않는다(백엔드 count_view=not is_admin)
  const { data: detail, isLoading, isError } = useNewsDetail(news.id)
  const postDate = dateOf(news)
  const digest = useMemo(
    () => (detail ? parseNewsDigest(detail.content, postDate) : null),
    // postDate 는 news 에서 나오므로 published_at 으로 충분
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail, news.published_at, news.created_at],
  )
  const images = detail?.attachments.filter((a) => a.kind === 'image') ?? []
  const files = detail?.attachments.filter((a) => a.kind === 'file') ?? []

  return (
    <article className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-white/55">
          {news.category && <span className="font-bold text-brand">{news.category}</span>}
          <span>{dotDate(postDate)}</span>
          {news.author && <span>· {news.author}</span>}
        </div>
        <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug break-keep">{news.title}</h2>
      </div>

      {isLoading ? (
        <div className="px-5 py-5 space-y-2.5">
          {[90, 75, 82, 60].map((w, i) => (
            <div key={i} className="h-4 rounded bg-gray-100 dark:bg-white/[0.06] animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : isError || !detail ? (
        <p className="px-5 py-6 text-[14px] text-gray-500 dark:text-white/55">본문을 불러오지 못했어요.</p>
      ) : (
        <>
          {images.length > 0 && (
            <div className={`mt-4 px-5 grid gap-2 ${images.length > 1 ? 'grid-cols-2' : ''}`}>
              {images.map((img) => (
                <img key={img.id} src={img.url} alt="" loading="lazy" className="w-full rounded-xl object-cover bg-gray-100 dark:bg-white/[0.04]" />
              ))}
            </div>
          )}
          <div className="px-5 pt-4 pb-5">
            {digest ? (
              <NewsDigestView digest={digest} rawContent={detail.content} postDate={postDate} />
            ) : (
              <div className="text-[15.5px] leading-[1.8] text-gray-800 dark:text-white/85 whitespace-pre-wrap break-keep break-words">
                {renderKeepTogether(detail.content)}
              </div>
            )}
          </div>
          {files.length > 0 && (
            <ul className="px-5 pb-5 space-y-1.5">
              {files.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] hover:bg-[var(--brand-soft)] transition-colors"
                  >
                    <I d={IC.clip} size={16} className="shrink-0 text-gray-500 dark:text-white/55" />
                    <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-ink-strong">{f.filename ?? '첨부파일'}</span>
                    <span className="shrink-0 text-[13px] text-gray-500 dark:text-white/55">{formatBytes(f.file_size)}</span>
                    <I d={IC.download} size={16} className="shrink-0 text-gray-400 dark:text-white/40" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  )
}

// ── 상세 ─────────────────────────────────────────────────

interface DetailActions {
  onEdit: (news: NewsItem) => void
  onTogglePublished: (news: NewsItem) => void
  onTogglePinned: (news: NewsItem) => void
  onDelete: (news: NewsItem) => void
  onViewPublic: (news: NewsItem) => void
}

const Detail = ({ news, onClose, ...a }: DetailActions & { news: NewsItem; onClose?: () => void }) => {
  const d = dateOf(news)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-4 lg:px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="목록으로">
            <I d={IC.back} size={20} />
          </button>
        )}
        <div className="flex items-center gap-2.5 mr-1">
          <Switch on={news.is_published} onClick={() => a.onTogglePublished(news)} label="성도에게 공개" />
          <span className={`text-[14px] font-bold whitespace-nowrap ${news.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {news.is_published ? '공개 중' : '비공개'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => a.onTogglePinned(news)}
          aria-pressed={news.is_pinned}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold border whitespace-nowrap transition ${
            news.is_pinned
              ? 'border-[var(--brand-glow)] bg-[var(--brand-soft)] text-brand'
              : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:border-gray-300 dark:hover:border-white/20'
          }`}
        >
          <I d={IC.pin} size={15} />
          <span className="hidden sm:inline">{news.is_pinned ? '고정됨' : '맨 위 고정'}</span>
        </button>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <TextBtn icon={IC.ext} label="성도 화면" onClick={() => a.onViewPublic(news)} />
        </span>
        <span className="hidden sm:contents">
          <TextBtn icon={IC.trash} label="삭제" danger onClick={() => a.onDelete(news)} />
        </span>
        <button
          type="button"
          onClick={() => a.onEdit(news)}
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
              ['조회', `${news.views}`, '회'],
              ['사진', `${news.image_count}`, '장'],
              ['파일', `${news.file_count}`, '개'],
              ['게시일', `${d.getMonth() + 1}.${d.getDate()}`, dayName(d)],
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

        {!news.is_published && (
          <p className="mx-4 lg:mx-5 mt-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[14px] font-medium px-4 py-2.5 break-keep">
            아직 성도들에게 안 보여요. 위 스위치를 켜면 바로 소식 탭에 올라가요.
          </p>
        )}

        <div className="px-4 lg:px-5 pt-5 pb-8">
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
            <I d={IC.eye} size={15} />
            성도에게 이렇게 보여요
          </div>
          <div className="max-w-[640px]">
            <PublicPreview news={news} />
          </div>
          <div className="sm:hidden mt-4 flex gap-2">
            <button type="button" onClick={() => a.onViewPublic(news)} className="flex-1 h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] font-semibold text-gray-700 dark:text-white/80">
              성도 화면에서 보기
            </button>
            <button type="button" onClick={() => a.onDelete(news)} className="h-11 px-5 rounded-xl text-[14px] font-semibold text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-500/10">
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 모바일 상세 — 한 화면, 뒤로가기로 목록 */
const MobileDetailSheet = ({ news, onClose, ...a }: DetailActions & { news: NewsItem; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div className="lg:hidden fixed inset-0 z-[60] bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <Detail news={news} onClose={onClose} {...a} />
    </div>
  )
}

// ── 데스크 ───────────────────────────────────────────────

const SEGS: [NewsSeg, string][] = [
  ['all', '전체'],
  ['published', '공개'],
  ['hidden', '비공개'],
  ['pinned', '고정'],
]

export interface NewsDeskProps extends DetailActions {
  items: NewsItem[]
  filtered: NewsItem[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  seg: NewsSeg
  onSegChange: (v: NewsSeg) => void
  category: string | null
  categories: string[]
  onCategoryChange: (v: string | null) => void
  onCreate: () => void
  onBack: () => void
  onClearFilters: () => void
}

const NewsDesk = ({
  items,
  filtered,
  loading,
  searchTerm,
  onSearchChange,
  seg,
  onSegChange,
  category,
  categories,
  onCategoryChange,
  onCreate,
  onBack,
  onClearFilters,
  ...actions
}: NewsDeskProps) => {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // 고른 글이 필터에서 빠지면 첫 글을 보여 준다
  const activeId = filtered.some((n) => n.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = activeId != null ? (items.find((n) => n.id === activeId) ?? null) : null

  const sheetNews = sheetOpen ? (items.find((n) => n.id === selectedId) ?? null) : null

  const counts: Record<NewsSeg, number> = {
    all: items.length,
    published: items.filter((n) => n.is_published).length,
    hidden: items.filter((n) => !n.is_published).length,
    pinned: items.filter((n) => n.is_pinned).length,
  }

  // '/' 검색, ↑↓ 이동 — PC 전용(확인창·모달이 떠 있거나 입력 중이면 무시)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (!window.matchMedia('(min-width: 1024px)').matches) return
      if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return
      if (isTypingTarget(document.activeElement)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if ((e.key !== 'ArrowDown' && e.key !== 'ArrowUp') || filtered.length === 0) return
      e.preventDefault()
      const i = filtered.findIndex((n) => n.id === activeId)
      const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1)
      const id = filtered[next].id
      setSelectedId(id)
      document.getElementById(`news-row-${id}`)?.scrollIntoView({ block: 'nearest' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filtered, activeId])

  const select = (id: number) => {
    setSelectedId(id)
    if (!window.matchMedia('(min-width: 1024px)').matches) setSheetOpen(true)
  }

  const filtering = !!searchTerm || seg !== 'all' || !!category

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:min-h-0 lg:h-[calc(100dvh-56px)] lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1320px] mx-auto bg-background-light dark:bg-background-dark min-h-screen lg:min-h-0 lg:h-full lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:rounded-3xl lg:overflow-hidden lg:border lg:border-gray-200/70 dark:lg:border-white/[0.08] lg:shadow-2xl">
        {/* ── 왼쪽: 목록 ─────────────────────────────── */}
        <section className="flex flex-col lg:min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07] lg:bg-white/60 dark:lg:bg-white/[0.015]">
          <div className="shrink-0 px-4 pt-4 lg:pt-5 pb-3 space-y-3">
            <div className="flex items-start gap-2">
              <button type="button" onClick={onBack} className="lg:hidden -ml-2 mt-0.5 p-1.5 rounded-xl text-gray-600 dark:text-white/70" aria-label="뒤로">
                <I d={IC.back} size={21} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">교회소식 게시판</h1>
                <button
                  type="button"
                  onClick={() => navigate('/admin/notifications')}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-left text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
                >
                  <I d={IC.bell} size={14} className="shrink-0" />
                  <span>
                    기간 지나면 내릴 짧은 안내는 <span className="font-bold underline underline-offset-2">공지 팝업·알림</span>으로
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14px] font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
              >
                <I d={IC.plus} size={17} />
                소식 쓰기
              </button>
            </div>

            {!loading && <WeeklyStatus items={items} onSelect={select} />}

            <label className="relative block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 pointer-events-none">
                <I d={IC.search} size={17} />
              </span>
              <input
                ref={searchRef}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="제목·내용 검색"
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

            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06]">
              {SEGS.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onSegChange(k)}
                  className={`flex-1 whitespace-nowrap px-2 h-8 rounded-lg text-[13px] font-semibold transition ${
                    seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
                  }`}
                >
                  {l} <span className={seg === k ? 'text-brand' : ''}>{counts[k]}</span>
                </button>
              ))}
            </div>

            {categories.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4">
                {[null, ...categories].map((c) => (
                  <button
                    key={c ?? 'all'}
                    type="button"
                    onClick={() => onCategoryChange(c)}
                    className={`shrink-0 h-8 px-3 rounded-full text-[13px] font-semibold transition ${
                      category === c
                        ? 'bg-ink-strong text-white dark:bg-white dark:text-black'
                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65 hover:text-ink-strong'
                    }`}
                  >
                    {c ?? '모든 분류'}
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
                <p className="text-[15px] font-bold text-ink-strong">
                  {filtering ? '조건에 맞는 소식이 없어요' : '아직 올린 소식이 없어요'}
                </p>
                {filtering ? (
                  <button type="button" onClick={onClearFilters} className="mt-2 text-[14px] font-semibold text-brand">
                    검색·필터 지우기
                  </button>
                ) : (
                  <p className="mt-1 text-[13.5px] text-gray-500 dark:text-white/55">위 '소식 쓰기'로 첫 소식을 올려 보세요</p>
                )}
              </div>
            ) : (
              filtered.map((n) => <Row key={n.id} news={n} active={n.id === activeId} onClick={() => select(n.id)} />)
            )}
          </div>
        </section>

        {/* ── 오른쪽: 상세 (PC) ─────────────────────── */}
        <section className="hidden lg:block min-h-0 bg-background-light dark:bg-background-dark">
          {selected ? (
            <Detail key={selected.id} news={selected} {...actions} />
          ) : (
            <div className="h-full grid place-items-center text-[14px] text-gray-500 dark:text-white/55">
              {loading ? '' : '왼쪽에서 소식을 골라 주세요'}
            </div>
          )}
        </section>
      </div>

      {/* 지운 글이면 sheetNews 가 없어 저절로 닫힌다 — 다른 글로 바뀌어 보이지 않게 고른 id 로만 찾는다 */}
      {sheetOpen && sheetNews && (
        <MobileDetailSheet key={sheetNews.id} news={sheetNews} onClose={() => setSheetOpen(false)} {...actions} />
      )}
    </div>
  )
}

export default NewsDesk
