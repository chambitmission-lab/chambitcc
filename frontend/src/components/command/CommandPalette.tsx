import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { searchBible } from '../../api/bible'
import { useBibleBooks } from '../../hooks/useBible'
import { getSermons, searchSermons } from '../../api/sermon'
import { getTodayVerse } from '../../api/dailyVerse'
import { getSundayServices, getWeekdayServices } from '../../api/worship'
import { DAY_CHARS, soonestService } from '../../utils/worshipSchedule'
import { pushRecent, readRecent, clearRecent, type RecentItem } from './commandRecent'
import { formatReference, matchBibleBooks, parseBibleReference, resolveBookNumber } from '../../pages/Sermon/utils/sermonMeta'
import { preloadMenuRoutes } from '../../utils/routePreload'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { NAV_ICONS } from '../layout/NewHeader/components/NavIcons'
import { PAGE_INDEX, scorePage, type PageEntry } from './commandIndex'
import chambiAvatar from '../chatbot/img/default.webp'
import { loadGlossary, searchGlossary, GLOSSARY_TYPE_LABEL, type GlossaryEntry } from '../../pages/Bible/data/bibleGlossary'
import './CommandPalette.css'

// ⌘K "무엇이든 찾기" — 메뉴·설교·성구를 한 입력창에서 찾고, 못 찾으면 참비에게 넘긴다.
// 헤더 캡슐(PC)·검색 아이콘(모바일)·⌘K/Ctrl+K·`chambit:open-search` 이벤트로 연다.
// 전역 1개만 마운트(App.tsx) — 상태는 열려 있는 동안만 산다.

import { OPEN_CHATBOT_EVENT, OPEN_SEARCH_EVENT, isMacLike } from './commandEvents'
import { tokenStore } from '../../utils/tokenStore'
import { sermonKeys, dailyVerseKeys, worshipKeys } from '../../hooks/queryKeys'

type Row =
  | { kind: 'action'; id: string; label: string; desc: string; icon: keyof typeof NAV_ICONS | 'chambi'; to?: string; ask?: boolean; accent?: boolean }
  | { kind: 'recent'; id: string; item: RecentItem }
  | { kind: 'page'; id: string; entry: PageEntry }
  | { kind: 'ref'; id: string; label: string; desc: string; to: string }
  | { kind: 'verse'; id: string; label: string; desc: string; to: string }
  | { kind: 'sermon'; id: string; label: string; desc: string; to: string }
  | { kind: 'glossary'; id: string; entry: GlossaryEntry; to: string }
  | { kind: 'ask'; id: string; message: string }

const DEBOUNCE_MS = 180
const MAX_PAGES = 5

const useDebounced = (value: string, ms: number) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

const CommandPalette = () => {
  const { language, t } = useLanguage()
  const ko = language === 'ko'
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // 커서는 결과 목록(rowsKey)에 귀속 — 결과가 바뀌면 자동으로 0 (effect 없이 파생)
  const [cursorState, setCursorState] = useState<{ key: string; idx: number }>({ key: '', idx: 0 })
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounced = useDebounced(query.trim(), DEBOUNCE_MS)
  const loggedIn = !!tokenStore.getAccess()
  // 최근 항목 — 열릴 때 읽고, 실행할 때 갱신
  const [recentVersion, setRecentVersion] = useState(0)
  // recentVersion 은 "지우기" 뒤 다시 읽게 하는 버전 카운터 — 의존성으로만 쓴다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recent = useMemo<RecentItem[]>(() => (open ? readRecent() : []), [open, recentVersion])

  // 열기 — 단축키·이벤트
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen)
    }
  }, [])

  // 열릴 때 포커스·프리로드, 닫힐 때 입력 초기화
  useEffect(() => {
    if (!open) return
    void preloadMenuRoutes()
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setCursorState({ key: '', idx: 0 })
  }, [])
  useModalBackButton(close, open)

  // 뒤로가기 등 외부 내비게이션(HashRouter → hashchange)으로 라우트가 바뀌면 닫는다
  useEffect(() => {
    if (!open) return
    window.addEventListener('hashchange', close)
    window.addEventListener('popstate', close)
    return () => {
      window.removeEventListener('hashchange', close)
      window.removeEventListener('popstate', close)
    }
  }, [open, close])

  // ── 검색 소스 ──────────────────────────────────────────────
  // 성경 사전(인물·지명·용어 460여 개) — 한국어 전용, 팔레트를 처음 열 때 청크를 한 번 내려받는다
  const [glossaryReady, setGlossaryReady] = useState(false)
  useEffect(() => {
    if (!open || !ko || glossaryReady) return
    let alive = true
    loadGlossary().then(() => { if (alive) setGlossaryReady(true) }).catch(() => {})
    return () => { alive = false }
  }, [open, ko, glossaryReady])

  const ref = useMemo(() => {
    const p = parseBibleReference(debounced)
    return p && p.bookNumber ? p : null
  }, [debounced])

  // "창세기" / "창세기 1"처럼 장·절 표기가 없어도 책을 바로 펼칠 수 있게 한다
  const bookHits = useMemo(() => (ref ? [] : matchBibleBooks(debounced)), [debounced, ref])
  const textSearchable = debounced.length >= 2 && !ref
  // 키워드 검색 응답의 절 객체엔 책 이름이 없다(book_number만) → 책 목록(24h 캐시, 성경 페이지와 공유)으로 복원
  const { data: books } = useBibleBooks()
  const bookName = useMemo(() => {
    const m = new Map<number, string>()
    ;(books ?? []).forEach((b) => m.set(b.book_number, ko ? b.book_name_ko : b.book_name_en || b.book_name_ko))
    return m
  }, [books, ko])
  const { data: verses, isFetching: versesLoading } = useQuery({
    queryKey: ['cmdk', 'bible', debounced],
    queryFn: () => searchBible(debounced, { limit: 4 }),
    enabled: open && textSearchable,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
  const { data: sermons, isFetching: sermonsLoading } = useQuery({
    queryKey: ['cmdk', 'sermon', debounced],
    queryFn: () => searchSermons(debounced, 4),
    enabled: open && debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })

  // ── 커맨드 센터 첫 화면(빈 검색창) 데이터 — 다른 화면과 같은 캐시 키라 대부분 즉시 ──
  const home = open && !debounced
  const { data: recentSermons } = useQuery({
    queryKey: sermonKeys.list(0, 8, false),
    queryFn: () => getSermons(0, 8, false),
    enabled: home,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
  const lastSunday =
    recentSermons?.find((x) => /3\s*부/.test(x.title)) ??
    recentSermons?.find((x) => /주일|성수/.test(x.title)) ??
    recentSermons?.[0]
  const { data: services } = useQuery({
    queryKey: worshipKeys.services(),
    queryFn: async () => {
      const [sun, week] = await Promise.all([getSundayServices(), getWeekdayServices()])
      return [...sun, ...week]
    },
    enabled: home,
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const nextService = useMemo(() => {
    if (!services) return null
    const seoulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const next = soonestService(services, seoulNow)
    if (!next) return null
    const h = Math.floor(next.occ.startMin / 60)
    const m = next.occ.startMin % 60
    const clock = ko
      ? `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`
      : `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
    const day =
      next.occ.dayOffset === 0 ? (ko ? '오늘' : 'Today')
      : next.occ.dayOffset === 1 ? (ko ? '내일' : 'Tomorrow')
      : ko ? `${DAY_CHARS[(seoulNow.getDay() + next.occ.dayOffset) % 7]}요일`
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(seoulNow.getDay() + next.occ.dayOffset) % 7]
    return { name: ko ? next.service.name : next.service.name_en || next.service.name, when: `${day} ${clock}` }
  }, [services, ko])
  const { data: todayVerse } = useQuery({
    queryKey: dailyVerseKeys.current(),
    queryFn: getTodayVerse,
    enabled: home,
    staleTime: 1000 * 60 * 30,
    retry: false,
  })
  const todayVerseTo = useMemo(() => {
    const p = todayVerse?.verse_reference ? parseBibleReference(todayVerse.verse_reference) : null
    const bn = p?.bookNumber ?? (p ? resolveBookNumber(p.book) : null)
    return p && bn ? `/bible/${bn}/${p.chapter}${p.verse ? `?verse=${p.verse}` : ''}` : '/bible'
  }, [todayVerse])

  const actions: Row[] = useMemo(() => {
    if (!home) return []
    const out: Row[] = []
    if (lastSunday) {
      const d = new Date(lastSunday.sermon_date)
      const date = Number.isNaN(d.getTime()) ? '' : ko ? `${d.getMonth() + 1}월 ${d.getDate()}일` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      out.push({ kind: 'action', id: 'act:sermon', label: t('cmdkActSermon'), desc: [date, lastSunday.bible_verse].filter(Boolean).join(' · ') || t('cmdkActSermonDesc'), icon: 'sermon', to: `/sermon?id=${lastSunday.id}`, accent: true })
    } else {
      out.push({ kind: 'action', id: 'act:sermon', label: t('cmdkActSermon'), desc: t('cmdkActSermonDesc'), icon: 'sermon', to: '/sermon', accent: true })
    }
    out.push({ kind: 'action', id: 'act:worship', label: nextService ? nextService.name : t('cmdkActWorship'), desc: nextService ? nextService.when : t('cmdkActWorshipDesc'), icon: 'worship', to: '/worship' })
    out.push({ kind: 'action', id: 'act:visit', label: t('cmdkActVisit'), desc: t('cmdkActVisitDesc'), icon: 'visit', to: '/visit' })
    out.push({ kind: 'action', id: 'act:verse', label: t('cmdkActVerse'), desc: todayVerse?.verse_reference || t('cmdkActVerseDesc'), icon: 'bible', to: todayVerseTo })
    out.push({ kind: 'action', id: 'act:chambi', label: t('cmdkActChambi'), desc: t('cmdkActChambiDesc'), icon: 'chambi', ask: true })
    out.push(
      loggedIn
        ? { kind: 'action', id: 'act:feed', label: t('cmdkActFeed'), desc: t('cmdkActFeedDesc'), icon: 'answeredPrayers', to: '/feed' }
        : { kind: 'action', id: 'act:register', label: t('cmdkActRegister'), desc: t('cmdkActRegisterDesc'), icon: 'garden', to: '/register' },
    )
    return out
  }, [home, lastSunday, nextService, todayVerse, todayVerseTo, loggedIn, ko, t])

  const pages = useMemo(() => {
    const visible = PAGE_INDEX.filter((p) => (loggedIn ? p.to !== '/login' && p.to !== '/register' : !p.memberOnly))
    if (!debounced) return visible.filter((p) => p.quick)
    return visible
      .map((entry) => ({ entry, score: scorePage(entry, debounced) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PAGES)
      .map((x) => x.entry)
  }, [debounced, loggedIn])

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    if (!debounced) {
      out.push(...actions)
      recent.forEach((item) => out.push({ kind: 'recent', id: `recent:${item.id}`, item }))
    }
    if (ref) {
      const to = `/bible/${ref.bookNumber}/${ref.chapter}${ref.verse ? `?verse=${ref.verse}` : ''}`
      out.push({ kind: 'ref', id: `ref:${to}`, label: formatReference(ref), desc: t('cmdkOpenChapter'), to })
    }
    bookHits.forEach((b) => {
      const to = `/bible/${b.bookNumber}/${b.chapter ?? 1}`
      out.push({ kind: 'ref', id: `ref:${to}`, label: b.chapter ? `${b.book} ${b.chapter}장` : b.book, desc: b.chapter ? t('cmdkOpenChapter') : t('cmdkOpenBook'), to })
    })
    pages.forEach((entry) => out.push({ kind: 'page', id: `page:${entry.to}`, entry }))
    // 사전 행 — 메뉴 다음, 절 결과 앞. 누르면 검색 탭(정의 카드 + 본문 절)으로 간다
    if (debounced && !ref && ko && glossaryReady) {
      searchGlossary(debounced, 3).forEach((entry) => {
        out.push({ kind: 'glossary', id: `glossary:${entry.name}:${entry.first}`, entry, to: `/bible?tab=search&q=${encodeURIComponent(entry.name)}` })
      })
    }
    if (debounced && !ref && verses?.results?.length) {
      verses.results.slice(0, 4).forEach((v) => {
        const book = v.book_number ?? v.book_id
        const name = v.book_name_ko || bookName.get(book) || ''
        out.push({
          kind: 'verse',
          id: `verse:${v.id}`,
          label: `${name}${name ? ' ' : ''}${v.chapter}:${v.verse}`,
          desc: v.text,
          to: `/bible/${book}/${v.chapter}?verse=${v.verse}`,
        })
      })
    }
    if (debounced && sermons?.length) {
      // 백엔드 q 미배포(구버전)면 최신 목록이 그대로 오므로 클라이언트에서 한 번 더 거른다
      const q = debounced.toLowerCase()
      const matched = sermons.filter((s) => [s.title, s.pastor, s.bible_verse].some((f) => (f ?? '').toLowerCase().includes(q)))
      matched.slice(0, 4).forEach((s) => {
        const d = new Date(s.sermon_date)
        const date = Number.isNaN(d.getTime()) ? '' : ko ? `${d.getMonth() + 1}월 ${d.getDate()}일` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        out.push({
          kind: 'sermon',
          id: `sermon:${s.id}`,
          label: s.title,
          desc: [date, s.pastor, s.bible_verse].filter(Boolean).join(' · '),
          to: `/sermon?id=${s.id}`,
        })
      })
    }
    if (debounced) out.push({ kind: 'ask', id: 'ask', message: debounced })
    return out
  }, [ref, bookHits, pages, verses, sermons, debounced, ko, t, bookName, actions, recent, glossaryReady])

  const rowsKey = rows.map((r) => r.id).join('|')
  const cursor = cursorState.key === rowsKey ? cursorState.idx : 0
  const setCursor = useCallback((upd: number | ((c: number) => number)) => {
    setCursorState((prev) => {
      const cur = prev.key === rowsKey ? prev.idx : 0
      return { key: rowsKey, idx: typeof upd === 'function' ? upd(cur) : upd }
    })
  }, [rowsKey])

  const run = useCallback((row: Row) => {
    if (row.kind === 'ask' || (row.kind === 'action' && row.ask)) {
      close()
      window.dispatchEvent(new CustomEvent(OPEN_CHATBOT_EVENT, { detail: row.kind === 'ask' ? { message: row.message } : {} }))
      return
    }
    // 연 것을 최근 항목으로 (퀵 액션은 항상 있으니 기록하지 않는다)
    if (row.kind === 'page') pushRecent({ id: row.id, kind: 'page', label: ko ? row.entry.label.ko : row.entry.label.en, desc: ko ? row.entry.desc.ko : row.entry.desc.en, to: row.entry.to })
    else if (row.kind === 'ref' || row.kind === 'verse' || row.kind === 'sermon') pushRecent({ id: row.id, kind: row.kind, label: row.label, desc: row.desc, to: row.to })
    else if (row.kind === 'recent') pushRecent({ id: row.item.id, kind: row.item.kind, label: row.item.label, desc: row.item.desc, to: row.item.to })
    const to =
      row.kind === 'page' ? row.entry.to
      : row.kind === 'recent' ? row.item.to
      : row.kind === 'action' ? (row.to ?? '/')
      : row.to
    close()
    navigate(to)
  }, [close, navigate, ko])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(rows.length - 1, c + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); const r = rows[cursor]; if (r) run(r) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  // 커서 행이 보이게 스크롤
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  const loading = versesLoading || sermonsLoading
  const groupLabel = (kind: Row['kind']) =>
    kind === 'page' ? t('cmdkGroupPages')
    : kind === 'ref' || kind === 'verse' ? t('cmdkGroupBible')
    : kind === 'sermon' ? t('cmdkGroupSermon')
    : kind === 'glossary' ? t('cmdkGroupGlossary')
    : kind === 'recent' ? t('cmdkRecentTitle')
    : kind === 'action' ? t('cmdkActionsTitle')
    : t('cmdkGroupAsk')
  const hints = ko ? ['요 3:16', '예배 시간', '바리새인', '사랑', '위로'] : ['John 3:16', 'service time', 'parking', 'love']

  // 그룹 헤더는 같은 kind 가 처음 나올 때만
  let lastGroup = ''

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-start justify-center px-3 pt-[12vh] sm:pt-[16vh]" role="dialog" aria-modal="true" aria-label={t('cmdkTrigger')}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={close} />
      <div className="cmdk-panel relative w-full max-w-[640px] rounded-2xl overflow-hidden bg-white dark:bg-[#1b1b1d] ring-1 ring-black/[0.08] dark:ring-white/[0.1] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
        {/* 입력 */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-black/[0.06] dark:border-white/[0.08]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="w-5 h-5 text-ink-muted shrink-0" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('cmdkPlaceholder')}
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-ink-strong placeholder:text-ink-muted"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <span className="text-[12px] text-ink-muted shrink-0">{t('cmdkSearching')}</span>}
          <button type="button" onClick={close} className="cmdk-kbd hidden sm:inline-flex" aria-label={t('cmdkClose')}>esc</button>
        </div>

        {/* 결과 */}
        <div ref={listRef} className="max-h-[min(64vh,560px)] overflow-y-auto py-2">
          {/* ── 커맨드 센터 첫 화면: 퀵 액션 타일(벤토) → 최근 → 빠른 이동 ── */}
          {!debounced && actions.length > 0 && (
            <div className="px-3 pt-1 pb-2">
              <p className="px-1 pb-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted">{t('cmdkActionsTitle')}</p>
              <div className="cmdk-actions">
                {rows.map((row, idx) => {
                  if (row.kind !== 'action') return null
                  const active = idx === cursor
                  const I = row.icon === 'chambi' ? null : NAV_ICONS[row.icon]
                  return (
                    <button
                      key={row.id}
                      type="button"
                      data-idx={idx}
                      onMouseEnter={() => setCursor(idx)}
                      onClick={() => run(row)}
                      className={`cmdk-action${row.accent ? ' cmdk-action--accent' : ''}${active ? ' is-active' : ''}`}
                    >
                      <span className="cmdk-action-icon">
                        {I ? <I className="w-[18px] h-[18px]" /> : <img src={chambiAvatar} alt="" className="w-7 h-7 rounded-full" draggable={false} />}
                      </span>
                      <span className="cmdk-action-label">{row.label}</span>
                      <span className="cmdk-action-desc">{row.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {!debounced && recent.length > 0 && (
            <div className="px-4 pt-1 pb-1 flex items-center justify-between">
              <p className="text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted">{t('cmdkRecentTitle')}</p>
              <button type="button" onClick={() => { clearRecent(); setRecentVersion((v) => v + 1) }} className="text-[11.5px] font-semibold text-ink-muted hover:text-brand">{t('cmdkRecentClear')}</button>
            </div>
          )}
          {rows.map((row, idx) => {
            if (row.kind === 'action') return null
            const g = groupLabel(row.kind)
            const showGroup = !!debounced && g !== lastGroup
            lastGroup = g
            // 첫 화면: 최근 다음에 오는 첫 메뉴 행 위에 "빠른 이동" 제목
            const showQuick = !debounced && row.kind === 'page' && (idx === 0 || rows[idx - 1].kind !== 'page')
            const active = idx === cursor
            const rowClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-[var(--brand-soft)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'}`
            const iconBox = `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[var(--brand-soft-strong)] text-brand' : 'bg-black/[0.04] dark:bg-white/[0.07] text-ink'}`
            return (
              <div key={row.id} className="px-2">
                {showQuick && (
                  <p className="px-2 pt-2 pb-1 text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted">{t('cmdkQuickTitle')}</p>
                )}
                {showGroup && (
                  <p className="px-2 pt-2 pb-1 text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted">{g}</p>
                )}
                <button
                  type="button"
                  data-idx={idx}
                  onMouseEnter={() => setCursor(idx)}
                  onClick={() => run(row)}
                  className={rowClass}
                >
                  {row.kind === 'page' ? (
                    <>
                      <span className={iconBox}>
                        {row.entry.icon
                          ? (() => { const I = NAV_ICONS[row.entry.icon]; return <I className="w-[20px] h-[20px]" /> })()
                          : row.entry.glyph
                            ? (() => { const G = row.entry.glyph; return <G size={20} weight="duotone" color="currentColor" aria-hidden="true" /> })()
                            : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>{ko ? row.entry.label.ko : row.entry.label.en}</span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted truncate">{ko ? row.entry.desc.ko : row.entry.desc.en}</span>
                      </span>
                    </>
                  ) : row.kind === 'recent' ? (
                    <>
                      <span className={iconBox}>
                        {(() => { const I = row.item.kind === 'sermon' ? NAV_ICONS.sermon : row.item.kind === 'page' ? NAV_ICONS.news : NAV_ICONS.bible; return <I className="w-[20px] h-[20px]" /> })()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>{row.item.label}</span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted line-clamp-1">{row.item.desc}</span>
                      </span>
                    </>
                  ) : row.kind === 'glossary' ? (
                    <>
                      <span className={iconBox}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]" aria-hidden>
                          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                          <path d="M4 20.5V5.5M8 7.5h8M8 11h5" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>
                          {row.entry.name}
                          <span className="ml-1.5 text-[11px] font-semibold text-ink-muted">{GLOSSARY_TYPE_LABEL[row.entry.type]}</span>
                        </span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted line-clamp-1">{row.entry.desc}</span>
                      </span>
                    </>
                  ) : row.kind === 'ask' ? (
                    <>
                      <img src={chambiAvatar} alt="" className="w-9 h-9 rounded-full shrink-0" draggable={false} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>
                          {t('cmdkAskChambi')}: “{row.message}”
                        </span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted truncate">{t('cmdkAskChambiDesc')}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={iconBox}>
                        {row.kind === 'sermon'
                          ? (() => { const I = NAV_ICONS.sermon; return <I className="w-[20px] h-[20px]" /> })()
                          : (() => { const I = NAV_ICONS.bible; return <I className="w-[20px] h-[20px]" /> })()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>{row.label}</span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted line-clamp-1">{row.desc}</span>
                      </span>
                    </>
                  )}
                  {active && <span className="cmdk-kbd shrink-0 hidden sm:inline-flex">↵</span>}
                </button>
              </div>
            )
          })}
          {debounced && rows.length === 1 && !loading && (
            <p className="px-5 pt-1 pb-2 text-[12.5px] text-ink-muted">{t('cmdkNoResult')}</p>
          )}
          {!debounced && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted mb-1.5">{t('cmdkHintTitle')}</p>
              <div className="flex flex-wrap gap-1.5">
                {hints.map((h) => (
                  <button key={h} type="button" onClick={() => setQuery(h)} className="px-2.5 py-1 rounded-full bg-[var(--brand-soft)] text-brand text-[12.5px] font-semibold hover:bg-[var(--brand-soft-strong)]">
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 — 키 안내 (PC) */}
        <div className="hidden sm:flex items-center gap-4 px-4 h-9 border-t border-black/[0.06] dark:border-white/[0.08] text-[11.5px] text-ink-muted">
          <span className="inline-flex items-center gap-1"><span className="cmdk-kbd">↑</span><span className="cmdk-kbd">↓</span>{t('cmdkNav')}</span>
          <span className="inline-flex items-center gap-1"><span className="cmdk-kbd">↵</span>{t('cmdkSelect')}</span>
          <span className="inline-flex items-center gap-1"><span className="cmdk-kbd">esc</span>{t('cmdkClose')}</span>
          <span className="ml-auto inline-flex items-center gap-1"><span className="cmdk-kbd">{isMacLike() ? '⌘' : 'Ctrl'}</span><span className="cmdk-kbd">K</span></span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CommandPalette
