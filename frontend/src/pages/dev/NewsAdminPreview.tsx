import { useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import type { NewsItem } from '../../types/news'
import NewsDigestView from '../News/components/newsDigest/NewsDigestView'
import { parseNewsDigest } from '../News/components/newsDigest/parseNewsDigest'
import { useQueryClient } from '@tanstack/react-query'
import { newsKeys } from '../../hooks/useNews'
import NewsDesk, { type NewsSeg } from '../Admin/components/NewsDesk'

/**
 * /#/dev/news-admin — /admin/news(교회소식 게시판 관리) 전면 개편 시안.
 *   ?v=a 편집 데스크(목록+성도 화면 미리보기) | b 주일 연재판 | c 게시판 표+미리보기 서랍
 * 표본 데이터만 쓴다(백엔드 없이). 공개·고정 스위치는 화면 안에서만 바뀐다.
 */

// ── 표본 데이터 ──────────────────────────────────────────

type Mock = NewsItem & { content: string }

const weekly = (m: number, d: number, extra: string[]): string =>
  [
    `1. 오늘 3부 예배 후 성탄 칸타타 연습이 있습니다. 찬양대원은 본당으로 모여 주시기 바랍니다.`,
    `2. 정책당회\n${m}월 ${d + 6}일(토) 오전 10시, 소회의실에서 모입니다.`,
    `3. 새가족 환영\n오늘 처음 오신 새가족을 환영합니다. 예배 후 1층 새가족실에서 차 한 잔 나눠요.`,
    ...extra.map((t, i) => `${i + 4}. ${t}`),
  ].join('\n\n')

const EXTRA: Record<number, string[]> = {
  29: ['대림절 첫째 주일\n다음 주일부터 대림절이 시작됩니다. 강단 장식은 청년부가 섬깁니다.', '교우 소식\n입원 / 박OO 집사(세브란스병원)\n출산 / 이OO 성도 가정 득남', '성탄 트리 점등식\n12월 6일(주일) 오후 5시, 교회 앞마당'],
  22: ['추수감사절 연합예배\n오늘 2부 예배는 온 교우가 함께 드립니다.', '김장 나눔\n11월 28일(토) 오전 9시, 교육관 식당 (문의: 여전도회 010-1234-5678)'],
  15: ['청년부 수련회 신청\n11월 30일(주일)까지 청년부실에서 받습니다.', '교우 소식\n별세 / 최OO 권사 모친상'],
  8: ['구역장 모임\n11월 14일(토) 오후 2시, 소회의실'],
  1: ['종교개혁 기념 주일\n오늘 설교는 로마서 1장 17절 말씀입니다.', '가을 바자회\n11월 7일(토) 오전 10시, 교회 앞마당'],
}

const titlesOf = (content: string) =>
  content
    .split('\n\n')
    .map((b) => b.split('\n')[0].replace(/^\d+\.\s*/, '').replace(/[.。].*$/, ''))
    .map((t) => (t.length > 16 ? t.slice(0, 15) + '…' : t))

const VIEWS: Record<number, number> = { 29: 0, 22: 7, 15: 3, 8: 3, 1: 13 }

const SEED: Mock[] = [
  ...[29, 22, 15, 8, 1].map((d, i) => {
    const content = weekly(11, d, EXTRA[d])
    return {
      id: 100 - i,
      title: `11월 ${d}일 주보 소식`,
      summary: content.slice(0, 80),
      highlights: titlesOf(content),
      category: '주보 소식',
      author: '관리자',
      thumbnail_url: null,
      views: VIEWS[d],
      is_published: true,
      is_pinned: false,
      image_count: 0,
      file_count: 0,
      published_at: `2026-11-${String(d).padStart(2, '0')}T09:00:00`,
      created_at: `2026-11-${String(d).padStart(2, '0')}T09:00:00`,
      content,
    }
  }),
  {
    id: 200,
    title: '성탄 칸타타 「베들레헴의 별」 초대',
    summary: '12월 20일(주일) 오후 3시, 본당에서 성탄 칸타타를 올립니다. 이웃과 함께 오세요.',
    highlights: [],
    category: '행사',
    author: '찬양대',
    thumbnail_url: '/images/events/special.webp',
    views: 41,
    is_published: true,
    is_pinned: true,
    image_count: 3,
    file_count: 1,
    published_at: '2026-11-24T10:00:00',
    created_at: '2026-11-24T10:00:00',
    content: '12월 20일(주일) 오후 3시, 본당에서 성탄 칸타타 「베들레헴의 별」을 올립니다.\n\n올해는 어린이 찬양대와 청년부가 함께 섭니다. 믿지 않는 가족·이웃을 초대하기 좋은 자리예요. 입구에서 초대장을 나눠 드립니다.',
  },
  {
    id: 201,
    title: '추수감사 헌금 결산 보고',
    summary: '올해 추수감사 헌금은 전액 지역 아동센터와 미자립교회를 돕는 데 씁니다.',
    highlights: [],
    category: '보고',
    author: '재정부',
    thumbnail_url: null,
    views: 0,
    is_published: false,
    is_pinned: false,
    image_count: 0,
    file_count: 1,
    published_at: '2026-11-26T10:00:00',
    created_at: '2026-11-26T10:00:00',
    content: '올해 추수감사 헌금은 전액 지역 아동센터와 미자립교회를 돕는 데 씁니다.\n\n자세한 내역은 첨부한 결산서를 확인해 주세요.',
  },
]

// ── 날짜 도우미 ──────────────────────────────────────────

const WD = ['주일', '월', '화', '수', '목', '금', '토']
const dateOf = (n: NewsItem) => new Date(n.published_at ?? n.created_at ?? 0)
const dotDate = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${d.getDay() === 0 ? '일' : WD[d.getDay()]})`
const TODAY = new Date(2026, 10, 27)
const nextSunday = (from: Date) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d
}
const isWeekly = (n: NewsItem) => n.category === '주보 소식'

// ── 상태 ─────────────────────────────────────────────────

type Seg = 'all' | 'published' | 'hidden' | 'pinned'

const useDesk = () => {
  const [items, setItems] = useState<Mock[]>(SEED)
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState<Seg>('all')
  const [cat, setCat] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(SEED[0].id)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items
      .filter(
        (n) =>
          (!s || n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s)) &&
          (seg === 'all' ||
            (seg === 'published' && n.is_published) ||
            (seg === 'hidden' && !n.is_published) ||
            (seg === 'pinned' && n.is_pinned)) &&
          (!cat || n.category === cat),
      )
      .sort((a, b) => (a.is_pinned !== b.is_pinned ? (a.is_pinned ? -1 : 1) : dateOf(b).getTime() - dateOf(a).getTime()))
  }, [items, q, seg, cat])

  const activeId = filtered.some((n) => n.id === selectedId) ? selectedId : (filtered[0]?.id ?? null)
  const selected = items.find((n) => n.id === activeId) ?? null

  const patch = (id: number, p: Partial<Mock>, msg: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...p } : n)))
    showToast(msg, 'success')
  }
  const togglePublished = (n: Mock) =>
    patch(n.id, { is_published: !n.is_published }, n.is_published ? '비공개로 돌렸어요' : '성도들에게 공개했어요')
  const togglePinned = (n: Mock) =>
    patch(n.id, { is_pinned: !n.is_pinned }, n.is_pinned ? '고정을 풀었어요' : '맨 위에 고정했어요')

  const counts = {
    all: items.length,
    published: items.filter((n) => n.is_published).length,
    hidden: items.filter((n) => !n.is_published).length,
    pinned: items.filter((n) => n.is_pinned).length,
  }
  const categories = Array.from(new Set(items.map((n) => n.category).filter((c): c is string => !!c)))

  return { items, filtered, q, setQ, seg, setSeg, cat, setCat, activeId, selected, setSelectedId, togglePublished, togglePinned, counts, categories }
}
type Desk = ReturnType<typeof useDesk>

const openComposer = (label: string) => showToast(`(시안) ${label} — 기존 등록 모달이 열려요`, 'info')

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
  close: <path d="M18 6L6 18M6 6l12 12" />,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
}

// ── 공통 조각 ────────────────────────────────────────────

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

const SearchBox = ({ value, onChange, placeholder = '제목·내용 검색' }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <label className="relative block">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40">
      <I d={IC.search} size={17} />
    </span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 pl-9 pr-3 rounded-xl bg-gray-100 dark:bg-white/[0.06] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 outline-none focus:ring-2 focus:ring-[var(--brand-glow)] focus:bg-white dark:focus:bg-white/[0.08] transition"
    />
  </label>
)

const SEGS: [Seg, string][] = [
  ['all', '전체'],
  ['published', '공개'],
  ['hidden', '비공개'],
  ['pinned', '고정'],
]

const Segmented = ({ desk, full }: { desk: Desk; full?: boolean }) => (
  <div className={`flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.06] ${full ? 'w-full' : 'w-fit'}`}>
    {SEGS.map(([k, l]) => (
      <button
        key={k}
        type="button"
        onClick={() => desk.setSeg(k)}
        className={`flex-1 whitespace-nowrap px-3 h-8 rounded-lg text-[13px] font-semibold transition ${
          desk.seg === k ? 'bg-white dark:bg-white/[0.14] text-ink-strong shadow-sm' : 'text-gray-500 dark:text-white/55 hover:text-ink-strong'
        }`}
      >
        {l} <span className={desk.seg === k ? 'text-brand' : ''}>{desk.counts[k]}</span>
      </button>
    ))}
  </div>
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

const ChannelHint = () => (
  <button
    type="button"
    onClick={() => showToast('(시안) /admin/notifications 로 이동', 'info')}
    className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-white/55 hover:text-brand transition-colors"
  >
    <I d={IC.bell} size={14} />
    기간이 지나면 내릴 짧은 안내는 <span className="font-bold underline underline-offset-2">공지 팝업·알림</span>으로
  </button>
)

const IconBtn = ({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
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

/** 성도 화면(/news 소식 상세)과 같은 모양 — 주보 원고는 실제 NewsDigestView 로 그린다 */
const PublicPreview = ({ news }: { news: Mock }) => {
  const postDate = dateOf(news)
  const digest = useMemo(() => parseNewsDigest(news.content, postDate), [news.content, postDate])
  return (
    <article className="rounded-2xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] overflow-hidden">
      {news.thumbnail_url && <img src={news.thumbnail_url} alt="" className="w-full aspect-[16/8] object-cover" />}
      <div className="px-5 pt-5 pb-6">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 dark:text-white/55">
          {news.category && <span className="font-bold text-brand">{news.category}</span>}
          <span>{dotDate(postDate)}</span>
        </div>
        <h2 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong leading-snug">{news.title}</h2>
        <div className="mt-4">
          {digest ? (
            <NewsDigestView digest={digest} rawContent={news.content} postDate={postDate} />
          ) : (
            <p className="text-[15.5px] leading-[1.8] text-gray-800 dark:text-white/85 whitespace-pre-wrap">{news.content}</p>
          )}
        </div>
      </div>
    </article>
  )
}

/** 상세 — 위 작업줄 + 숫자 띠 + 성도 화면 미리보기 */
const Detail = ({ desk, news, onClose }: { desk: Desk; news: Mock; onClose?: () => void }) => {
  const d = dateOf(news)
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 px-5 h-[60px] border-b border-gray-200/70 dark:border-white/[0.07]">
        {onClose && (
          <button type="button" onClick={onClose} className="-ml-2 p-2 rounded-xl text-gray-600 dark:text-white/70" aria-label="닫기">
            <I d={IC.back} size={20} />
          </button>
        )}
        <label className="flex items-center gap-2.5 mr-1 cursor-pointer">
          <Switch on={news.is_published} onClick={() => desk.togglePublished(news)} label="공개" />
          <span className={`text-[14px] font-bold ${news.is_published ? 'text-brand' : 'text-gray-500 dark:text-white/55'}`}>
            {news.is_published ? '공개 중' : '비공개'}
          </span>
        </label>
        <button
          type="button"
          onClick={() => desk.togglePinned(news)}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13.5px] font-semibold border transition ${
            news.is_pinned
              ? 'border-[var(--brand-glow)] bg-[var(--brand-soft)] text-brand'
              : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:border-gray-300'
          }`}
        >
          <I d={IC.pin} size={15} />
          {news.is_pinned ? '고정됨' : '맨 위 고정'}
        </button>
        <div className="flex-1" />
        <span className="hidden xl:contents">
          <IconBtn icon={IC.ext} label="성도 화면" onClick={() => showToast('(시안) /news?tab=news&post=… 새 탭', 'info')} />
        </span>
        <IconBtn icon={IC.trash} label="삭제" danger onClick={() => showToast('(시안) 한 문장 확인 모달', 'info')} />
        <button
          type="button"
          onClick={() => openComposer('수정')}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold transition"
        >
          <I d={IC.edit} size={15} />
          수정
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <dl className="grid grid-cols-4 mx-5 mt-5 rounded-2xl bg-gray-50 dark:bg-white/[0.04] divide-x divide-gray-200/70 dark:divide-white/[0.06]">
          {[
            ['조회', `${news.views}`, '회'],
            ['사진', `${news.image_count}`, '장'],
            ['파일', `${news.file_count}`, '개'],
            ['게시일', `${d.getMonth() + 1}.${d.getDate()}`, d.getDay() === 0 ? '주일' : WD[d.getDay()]],
          ].map(([k, v, u]) => (
            <div key={k} className="px-4 py-3">
              <dt className="text-[13px] font-semibold text-gray-500 dark:text-white/55">{k}</dt>
              <dd className="mt-0.5 text-ink-strong">
                <span className="text-[24px] font-extrabold tabular-nums tracking-tight">{v}</span>
                <span className="ml-1 text-[13px] font-semibold text-gray-500 dark:text-white/55">{u}</span>
              </dd>
            </div>
          ))}
        </dl>

        {!news.is_published && (
          <p className="mx-5 mt-3 rounded-xl bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-200 text-[13.5px] font-medium px-4 py-2.5">
            아직 성도들에게 안 보여요. 위 스위치를 켜면 바로 /news 소식 탭에 올라갑니다.
          </p>
        )}

        <div className="px-5 pt-5 pb-8">
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-gray-500 dark:text-white/55">
            <I d={IC.eye} size={15} />
            성도에게 이렇게 보여요
          </div>
          <div className="max-w-[620px]">
            <PublicPreview news={news} />
          </div>
        </div>
      </div>
    </div>
  )
}

const Empty = ({ desk }: { desk: Desk }) => (
  <div className="py-16 text-center">
    <p className="text-[15px] font-bold text-ink-strong">조건에 맞는 소식이 없어요</p>
    <button type="button" onClick={() => { desk.setQ(''); desk.setSeg('all'); desk.setCat(null) }} className="mt-2 text-[14px] font-semibold text-brand">
      검색·필터 지우기
    </button>
  </div>
)

/** 모바일: 상세를 한 화면으로 띄운다 */
const MobileSheet = ({ desk, open, onClose }: { desk: Desk; open: boolean; onClose: () => void }) =>
  open && desk.selected ? (
    <div className="lg:hidden fixed inset-0 z-50 bg-background-light dark:bg-background-dark">
      <Detail desk={desk} news={desk.selected} onClose={onClose} />
    </div>
  ) : null

const nextSun = nextSunday(TODAY)
const weeklyMissing = (items: Mock[]) => {
  // 이미 올린 다음 주일이 있으면 그다음 주일을 가리킨다
  const d = new Date(nextSun)
  while (items.some((n) => isWeekly(n) && dateOf(n).toDateString() === d.toDateString())) d.setDate(d.getDate() + 7)
  return d
}

const WriteWeeklyCta = ({ items, compact }: { items: Mock[]; compact?: boolean }) => {
  const d = weeklyMissing(items)
  return (
    <button
      type="button"
      onClick={() => openComposer(`${d.getMonth() + 1}월 ${d.getDate()}일 주보 소식 쓰기(제목·게시일 채워짐)`)}
      className={`group w-full flex items-center gap-3 rounded-2xl bg-brand hover:bg-brand-dim text-white text-left transition shadow-[0_8px_20px_-8px_var(--brand-glow)] ${compact ? 'px-4 py-3' : 'px-4 py-3.5'}`}
    >
      <span className="shrink-0 w-11 h-11 rounded-xl bg-white/15 flex flex-col items-center justify-center leading-none">
        <span className="text-[19px] font-extrabold tabular-nums">{d.getDate()}</span>
        <span className="text-[10.5px] font-bold mt-0.5 opacity-90">주일</span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold">{d.getMonth() + 1}월 {d.getDate()}일 주보 소식 쓰기</span>
        <span className="block text-[13px] opacity-85">제목·게시일은 채워 둘게요</span>
      </span>
      <I d={IC.plus} size={20} className="shrink-0" />
    </button>
  )
}

// ══ A. 편집 데스크 ══════════════════════════════════════

const RowA = ({ news, active, onClick }: { news: Mock; active: boolean; onClick: () => void }) => {
  const d = dateOf(news)
  const hl = news.highlights ?? []
  const line = hl.length ? `${hl.slice(0, 2).join(' · ')}${hl.length > 2 ? ` 외 ${hl.length - 2}건` : ''}` : news.summary
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3.5 px-3 py-3 rounded-2xl text-left transition ${
        active ? 'bg-[var(--brand-soft)] ring-1 ring-[var(--brand-glow)]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'
      } ${news.is_published ? '' : 'opacity-70'}`}
    >
      <span className="shrink-0 w-[58px] text-center pt-0.5">
        <span className={`block text-[26px] leading-none font-extrabold tabular-nums tracking-tight ${active ? 'text-brand' : 'text-ink-strong'}`}>
          {d.getDate()}
        </span>
        <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">
          {d.getMonth() + 1}월 · {d.getDay() === 0 ? '주일' : WD[d.getDay()]}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {news.is_pinned && <Badge tone="pin">고정</Badge>}
          <span className="truncate text-[15.5px] font-bold text-ink-strong tracking-[-0.01em]">{news.title}</span>
        </span>
        <span className="block mt-1 truncate text-[13.5px] text-gray-600 dark:text-white/65">{line}</span>
        <span className="mt-1.5 flex items-center gap-2.5 text-[13px] text-gray-500 dark:text-white/55">
          {!news.is_published && <Badge tone="hidden">비공개</Badge>}
          {news.category && !isWeekly(news) && <Badge tone="cat">{news.category}</Badge>}
          <span className="inline-flex items-center gap-1"><I d={IC.eye} size={14} />{news.views}</span>
          {news.image_count > 0 && <span className="inline-flex items-center gap-1"><I d={IC.photo} size={14} />{news.image_count}</span>}
          {news.file_count > 0 && <span className="inline-flex items-center gap-1"><I d={IC.clip} size={14} />{news.file_count}</span>}
        </span>
      </span>
    </button>
  )
}

const VariantA = () => {
  const desk = useDesk()
  const [sheet, setSheet] = useState(false)
  return (
    <div className="lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:h-[calc(100vh-150px)] lg:min-h-[640px] rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-2xl overflow-hidden">
      <section className="flex flex-col min-h-0 lg:border-r border-gray-200/70 dark:border-white/[0.07]">
        <div className="shrink-0 px-4 pt-5 pb-3 space-y-3">
          <div className="px-1">
            <h1 className="text-[21px] font-extrabold tracking-[-0.02em] text-ink-strong">교회소식 게시판</h1>
            <div className="mt-1"><ChannelHint /></div>
          </div>
          <WriteWeeklyCta items={desk.items} />
          <button type="button" onClick={() => openComposer('다른 소식 쓰기')} className="w-full h-10 rounded-xl border border-gray-200 dark:border-white/10 text-[14px] font-semibold text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.05]">
            행사·모집·감사 등 다른 소식 쓰기
          </button>
          <SearchBox value={desk.q} onChange={desk.setQ} />
          <Segmented desk={desk} full />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-6">
          {desk.filtered.length === 0 ? (
            <Empty desk={desk} />
          ) : (
            desk.filtered.map((n) => (
              <RowA key={n.id} news={n} active={n.id === desk.activeId} onClick={() => { desk.setSelectedId(n.id); setSheet(true) }} />
            ))
          )}
        </div>
      </section>
      <section className="hidden lg:block min-h-0">{desk.selected && <Detail desk={desk} news={desk.selected} />}</section>
      <MobileSheet desk={desk} open={sheet} onClose={() => setSheet(false)} />
    </div>
  )
}

// ══ B. 주일 연재판 ══════════════════════════════════════

const BigStat = ({ n, label, tone }: { n: number; label: string; tone?: 'brand' | 'muted' }) => (
  <div className="min-w-0">
    <div className={`text-[34px] leading-none font-extrabold tabular-nums tracking-tight ${tone === 'brand' ? 'text-brand' : tone === 'muted' ? 'text-gray-400 dark:text-white/40' : 'text-ink-strong'}`}>{n}</div>
    <div className="mt-1.5 text-[13.5px] font-semibold text-gray-500 dark:text-white/55">{label}</div>
  </div>
)

const VariantB = () => {
  const desk = useDesk()
  const [sheet, setSheet] = useState(false)
  const upcoming = weeklyMissing(desk.items)
  const monthViews = desk.items.reduce((s, n) => s + n.views, 0)
  const monthWeekly = desk.items.filter((n) => isWeekly(n) && dateOf(n).getMonth() === 10).length

  // 주일별로 묶기 — 주보 소식은 그 주일, 다른 소식은 그 주(다음 주일 기준)에 딸린다
  const weeks = useMemo(() => {
    const map = new Map<string, { sunday: Date; weekly: Mock | null; others: Mock[] }>()
    for (const n of desk.filtered) {
      const d = dateOf(n)
      const sun = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay())
      const key = sun.toDateString()
      const w = map.get(key) ?? { sunday: sun, weekly: null, others: [] }
      if (isWeekly(n)) w.weekly = n
      else w.others.push(n)
      map.set(key, w)
    }
    return [...map.values()].sort((a, b) => b.sunday.getTime() - a.sunday.getTime())
  }, [desk.filtered])

  const open = (id: number) => { desk.setSelectedId(id); setSheet(true) }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 lg:items-start">
      <div className="space-y-5">
        <header className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-6">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong">교회소식 게시판</h1>
          <div className="mt-1"><ChannelHint /></div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            <BigStat n={monthWeekly} label="11월 주보 소식" tone="brand" />
            <BigStat n={desk.counts.published} label="공개 중" />
            <BigStat n={desk.counts.hidden} label="비공개" tone="muted" />
            <BigStat n={monthViews} label="이번 달 조회" />
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1"><SearchBox value={desk.q} onChange={desk.setQ} /></div>
            <div className="flex gap-1.5 flex-wrap">
              {[null, ...desk.categories].map((c) => (
                <button key={c ?? 'all'} type="button" onClick={() => desk.setCat(c)}
                  className={`h-10 px-3.5 rounded-xl text-[13.5px] font-semibold transition ${desk.cat === c ? 'bg-ink-strong text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/65'}`}>
                  {c ?? '전체'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <ol className="relative pl-[76px]">
          <span className="absolute left-[56px] top-3 bottom-3 w-px bg-gray-200 dark:bg-white/10" />
          {/* 다음 주일 — 빈 자리 */}
          <li className="relative pb-5">
            <span className="absolute -left-[76px] top-2 w-12 text-right">
              <span className="block text-[26px] leading-none font-extrabold tabular-nums text-brand">{upcoming.getDate()}</span>
              <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-brand">{upcoming.getMonth() + 1}월 · 주일</span>
            </span>
            <span className="absolute -left-[24px] top-4 w-3 h-3 rounded-full border-2 border-brand bg-white dark:bg-background-dark" />
            <button type="button" onClick={() => openComposer(`${upcoming.getMonth() + 1}월 ${upcoming.getDate()}일 주보 소식 쓰기`)}
              className="w-full rounded-2xl border-2 border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] px-5 py-4 text-left hover:bg-[var(--brand-soft-strong)] transition">
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-[15.5px] font-bold text-ink-strong">다음 주일 소식이 아직 비어 있어요</span>
                  <span className="block mt-0.5 text-[13.5px] text-gray-600 dark:text-white/65">주보 원고를 붙여 넣으면 성도 화면에선 항목 카드로 나뉘어요</span>
                </span>
                <span className="shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-[14px] font-bold">
                  <I d={IC.plus} size={16} />쓰기
                </span>
              </span>
            </button>
          </li>

          {weeks.length === 0 && <Empty desk={desk} />}
          {weeks.map((w) => {
            const sel = (id: number) => id === desk.activeId
            return (
              <li key={w.sunday.toDateString()} className="relative pb-5">
                <span className="absolute -left-[76px] top-2 w-12 text-right">
                  <span className="block text-[26px] leading-none font-extrabold tabular-nums text-ink-strong">{w.sunday.getDate()}</span>
                  <span className="block mt-1 whitespace-nowrap text-[12.5px] font-semibold text-gray-500 dark:text-white/55">{w.sunday.getMonth() + 1}월 · 주일</span>
                </span>
                <span className={`absolute -left-[24px] top-4 w-3 h-3 rounded-full ${w.weekly ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`} />
                <div className="space-y-2">
                  {w.weekly && (
                    <div onClick={() => open(w.weekly!.id)}
                      className={`cursor-pointer rounded-2xl bg-white dark:bg-card-dark border px-5 py-4 transition ${sel(w.weekly.id) ? 'border-brand ring-2 ring-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 truncate text-[16px] font-bold text-ink-strong">{w.weekly.title}</span>
                        {!w.weekly.is_published && <Badge tone="hidden">비공개</Badge>}
                        <span className="inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55"><I d={IC.eye} size={14} />{w.weekly.views}</span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {(w.weekly.highlights ?? []).map((h, i) => (
                          <span key={i} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-[13px] font-medium text-gray-700 dark:text-white/75">
                            <span className="font-bold text-gray-400 dark:text-white/40 tabular-nums">{i + 1}</span>{h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {!w.weekly && (
                    <p className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-5 py-3 text-[13.5px] text-gray-500 dark:text-white/55">이 주일엔 주보 소식이 없어요</p>
                  )}
                  {w.others.map((n) => (
                    <div key={n.id} onClick={() => open(n.id)}
                      className={`cursor-pointer flex items-center gap-3 rounded-2xl bg-white dark:bg-card-dark border px-4 py-3 transition ${sel(n.id) ? 'border-brand ring-2 ring-[var(--brand-glow)]' : 'border-gray-200/70 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'}`}>
                      {n.thumbnail_url ? <img src={n.thumbnail_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" /> : <span className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06] shrink-0" />}
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          {n.is_pinned && <Badge tone="pin">고정</Badge>}
                          <Badge tone="cat">{n.category}</Badge>
                          {!n.is_published && <Badge tone="hidden">비공개</Badge>}
                        </span>
                        <span className="block mt-1 truncate text-[15px] font-bold text-ink-strong">{n.title}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[13px] text-gray-500 dark:text-white/55"><I d={IC.eye} size={14} />{n.views}</span>
                    </div>
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <aside className="hidden lg:block sticky top-16 h-[calc(100vh-100px)] rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-2xl overflow-hidden">
        {desk.selected && <Detail desk={desk} news={desk.selected} />}
      </aside>
      <MobileSheet desk={desk} open={sheet} onClose={() => setSheet(false)} />
    </div>
  )
}

// ══ C. 게시판 표 + 미리보기 서랍 ═══════════════════════════

const VariantC = () => {
  const desk = useDesk()
  const [drawer, setDrawer] = useState(false)
  const open = (id: number) => { desk.setSelectedId(id); setDrawer(true) }
  return (
    <div className="rounded-3xl bg-white dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-2xl overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex flex-wrap items-end gap-4 border-b border-gray-200/70 dark:border-white/[0.07]">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-strong">교회소식 게시판</h1>
          <div className="mt-1"><ChannelHint /></div>
        </div>
        <button type="button" onClick={() => openComposer('소식 쓰기')} className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-brand hover:bg-brand-dim text-white text-[14.5px] font-bold shadow-[0_8px_20px_-8px_var(--brand-glow)]">
          <I d={IC.plus} size={17} />소식 쓰기
        </button>
      </div>
      <div className="px-6 py-3 flex flex-wrap items-center gap-3 border-b border-gray-200/70 dark:border-white/[0.07]">
        <Segmented desk={desk} />
        <div className="w-full sm:w-72"><SearchBox value={desk.q} onChange={desk.setQ} /></div>
        <span className="ml-auto text-[13.5px] text-gray-500 dark:text-white/55"><b className="text-ink-strong">{desk.filtered.length}</b>건</span>
      </div>

      {desk.filtered.length === 0 ? (
        <Empty desk={desk} />
      ) : (
        <table className="w-full text-left">
          <thead className="hidden md:table-header-group">
            <tr className="text-[13px] font-semibold text-gray-500 dark:text-white/55">
              <th className="pl-6 py-3 w-[110px]">게시일</th>
              <th className="py-3">제목</th>
              <th className="py-3 w-[90px] text-right">조회</th>
              <th className="py-3 w-[90px] text-center">공개</th>
              <th className="py-3 pr-6 w-[150px]" />
            </tr>
          </thead>
          <tbody>
            {desk.filtered.map((n) => {
              const d = dateOf(n)
              const hl = n.highlights ?? []
              return (
                <tr key={n.id} onClick={() => open(n.id)}
                  className={`group cursor-pointer border-t border-gray-100 dark:border-white/[0.05] transition ${drawer && n.id === desk.activeId ? 'bg-[var(--brand-soft)]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'}`}>
                  <td className="pl-6 py-3.5 align-top hidden md:table-cell">
                    <span className="text-[15px] font-bold tabular-nums text-ink-strong">{d.getMonth() + 1}.{String(d.getDate()).padStart(2, '0')}</span>
                    <span className="ml-1.5 text-[13px] text-gray-500 dark:text-white/55">{d.getDay() === 0 ? '주일' : WD[d.getDay()]}</span>
                  </td>
                  <td className="py-3.5 pl-4 md:pl-0 pr-4 align-top">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {n.is_pinned && <Badge tone="pin">고정</Badge>}
                      {n.category && <Badge tone="cat">{n.category}</Badge>}
                      <span className={`truncate text-[15.5px] font-bold ${n.is_published ? 'text-ink-strong' : 'text-gray-400 dark:text-white/40'}`}>{n.title}</span>
                      {(n.image_count > 0 || n.file_count > 0) && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-gray-400 dark:text-white/40">
                          {n.image_count > 0 && <I d={IC.photo} size={14} />}
                          {n.file_count > 0 && <I d={IC.clip} size={14} />}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-[13.5px] text-gray-600 dark:text-white/60">
                      {hl.length ? hl.join(' · ') : n.summary}
                    </div>
                  </td>
                  <td className="py-3.5 align-top text-right tabular-nums text-[15px] font-semibold text-ink-strong hidden md:table-cell">{n.views}</td>
                  <td className="py-3.5 align-top text-center hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                    <Switch on={n.is_published} onClick={() => desk.togglePublished(n)} label="공개" />
                  </td>
                  <td className="py-3 pr-6 align-top hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button type="button" title={n.is_pinned ? '고정 풀기' : '맨 위 고정'} onClick={() => desk.togglePinned(n)}
                        className={`w-9 h-9 grid place-items-center rounded-lg ${n.is_pinned ? 'text-brand bg-[var(--brand-soft)]' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.07]'}`}><I d={IC.pin} /></button>
                      <button type="button" title="수정" onClick={() => openComposer('수정')} className="w-9 h-9 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.07]"><I d={IC.edit} /></button>
                      <button type="button" title="삭제" onClick={() => showToast('(시안) 한 문장 확인 모달', 'info')} className="w-9 h-9 grid place-items-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><I d={IC.trash} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {drawer && desk.selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative w-full lg:w-[680px] h-full bg-background-light dark:bg-background-dark shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Detail desk={desk} news={desk.selected} onClose={() => setDrawer(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

// ══ 적용본 — 실제 NewsDesk 에 표본 데이터 ═══════════════════

const VariantReal = () => {
  const qc = useQueryClient()
  // 상세(본문·첨부)는 react-query 캐시에 미리 넣어 백엔드 없이 미리보기를 그린다
  useState(() => {
    for (const n of SEED) {
      qc.setQueryData(newsKeys.detail(n.id), {
        ...n,
        attachments: n.file_count ? [{ id: n.id * 10, kind: 'file', url: '#', filename: '결산서.pdf', content_type: 'application/pdf', file_size: 182000, sort_order: 0 }] : [],
      })
    }
    return null
  })
  const [items, setItems] = useState<NewsItem[]>(SEED)
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState<NewsSeg>('all')
  const [cat, setCat] = useState<string | null>(null)
  const filtered = items
    .filter((n) => (!q || n.title.includes(q)) && (seg === 'all' || (seg === 'published' && n.is_published) || (seg === 'hidden' && !n.is_published) || (seg === 'pinned' && n.is_pinned)) && (!cat || n.category === cat))
    .sort((a, b) => (a.is_pinned !== b.is_pinned ? (a.is_pinned ? -1 : 1) : dateOf(b).getTime() - dateOf(a).getTime()))
  const flip = (id: number, k: 'is_published' | 'is_pinned') => setItems((p) => p.map((n) => (n.id === id ? { ...n, [k]: !n[k] } : n)))
  return (
    <div className="-mx-3 lg:-mx-6 -my-6">
      <NewsDesk
        items={items} filtered={filtered} loading={false}
        searchTerm={q} onSearchChange={setQ} seg={seg} onSegChange={setSeg}
        category={cat} categories={Array.from(new Set(SEED.map((n) => n.category!)))} onCategoryChange={setCat}
        onClearFilters={() => { setQ(''); setSeg('all'); setCat(null) }}
        onCreate={() => openComposer('소식 쓰기')} onBack={() => {}}
        onEdit={() => openComposer('수정')} onViewPublic={() => showToast('(시안) 성도 화면', 'info')}
        onTogglePublished={(n) => flip(n.id, 'is_published')} onTogglePinned={(n) => flip(n.id, 'is_pinned')}
        onDelete={(n) => setItems((p) => p.filter((x) => x.id !== n.id))}
      />
    </div>
  )
}

// ── 껍데기 ───────────────────────────────────────────────

const VARIANTS = [
  { k: 'real', label: '적용본(실제 컴포넌트)', C: VariantReal },
  { k: 'a', label: 'A 편집 데스크', C: VariantA },
  { k: 'b', label: 'B 주일 연재판', C: VariantB },
  { k: 'c', label: 'C 게시판 표+서랍', C: VariantC },
] as const

const NewsAdminPreview = () => {
  const [sp, setSp] = useSearchParams()
  const v = VARIANTS.find((x) => x.k === sp.get('v')) ?? VARIANTS[0]
  return (
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="sticky top-0 z-40 flex flex-wrap gap-2 px-4 py-2 bg-black/80 backdrop-blur">
        {VARIANTS.map((x) => (
          <button key={x.k} onClick={() => setSp({ v: x.k })}
            className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${x.k === v.k ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="max-w-[1280px] mx-auto px-3 lg:px-6 py-6">
        <v.C key={v.k} />
      </div>
    </div>
  )
}

export default NewsAdminPreview
