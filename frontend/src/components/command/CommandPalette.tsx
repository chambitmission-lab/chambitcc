import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useLanguage } from '../../contexts/LanguageContext'
import { searchBible } from '../../api/bible'
import { useBibleBooks } from '../../hooks/useBible'
import { searchSermons } from '../../api/sermon'
import { formatReference, parseBibleReference } from '../../pages/Sermon/utils/sermonMeta'
import { preloadMenuRoutes } from '../../utils/routePreload'
import { useModalBackButton } from '../../hooks/useModalBackButton'
import { NAV_ICONS } from '../layout/NewHeader/components/NavIcons'
import { PAGE_INDEX, scorePage, type PageEntry } from './commandIndex'
import chambiAvatar from '../chatbot/img/default.webp'
import './CommandPalette.css'

// ⌘K "무엇이든 찾기" — 메뉴·설교·성구를 한 입력창에서 찾고, 못 찾으면 참비에게 넘긴다.
// 헤더 캡슐(PC)·검색 아이콘(모바일)·⌘K/Ctrl+K·`chambit:open-search` 이벤트로 연다.
// 전역 1개만 마운트(App.tsx) — 상태는 열려 있는 동안만 산다.

import { OPEN_CHATBOT_EVENT, OPEN_SEARCH_EVENT, isMacLike } from './commandEvents'

type Row =
  | { kind: 'page'; id: string; entry: PageEntry }
  | { kind: 'ref'; id: string; label: string; desc: string; to: string }
  | { kind: 'verse'; id: string; label: string; desc: string; to: string }
  | { kind: 'sermon'; id: string; label: string; desc: string; to: string }
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
  const loggedIn = !!localStorage.getItem('access_token')

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
  const ref = useMemo(() => {
    const p = parseBibleReference(debounced)
    return p && p.bookNumber ? p : null
  }, [debounced])

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
    if (ref) {
      const to = `/bible/${ref.bookNumber}/${ref.chapter}${ref.verse ? `?verse=${ref.verse}` : ''}`
      out.push({ kind: 'ref', id: `ref:${to}`, label: formatReference(ref), desc: t('cmdkOpenChapter'), to })
    }
    pages.forEach((entry) => out.push({ kind: 'page', id: `page:${entry.to}`, entry }))
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
  }, [ref, pages, verses, sermons, debounced, ko, t, bookName])

  const rowsKey = rows.map((r) => r.id).join('|')
  const cursor = cursorState.key === rowsKey ? cursorState.idx : 0
  const setCursor = useCallback((upd: number | ((c: number) => number)) => {
    setCursorState((prev) => {
      const cur = prev.key === rowsKey ? prev.idx : 0
      return { key: rowsKey, idx: typeof upd === 'function' ? upd(cur) : upd }
    })
  }, [rowsKey])

  const run = useCallback((row: Row) => {
    if (row.kind === 'ask') {
      close()
      window.dispatchEvent(new CustomEvent(OPEN_CHATBOT_EVENT, { detail: { message: row.message } }))
      return
    }
    const to = row.kind === 'page' ? row.entry.to : row.to
    close()
    navigate(to)
  }, [close, navigate])

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
    kind === 'page' ? t('cmdkGroupPages') : kind === 'ref' || kind === 'verse' ? t('cmdkGroupBible') : kind === 'sermon' ? t('cmdkGroupSermon') : t('cmdkGroupAsk')
  const hints = ko ? ['요 3:16', '예배 시간', '주차', '사랑', '위로'] : ['John 3:16', 'service time', 'parking', 'love']

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
        <div ref={listRef} className="max-h-[min(60vh,520px)] overflow-y-auto py-2">
          {!debounced && (
            <p className="px-4 pt-1 pb-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase text-ink-muted">{t('cmdkQuickTitle')}</p>
          )}
          {rows.map((row, idx) => {
            const g = groupLabel(row.kind)
            const showGroup = !!debounced && g !== lastGroup
            lastGroup = g
            const active = idx === cursor
            const rowClass = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${active ? 'bg-[var(--brand-soft)]' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'}`
            const iconBox = `w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[var(--brand-soft-strong)] text-brand' : 'bg-black/[0.04] dark:bg-white/[0.07] text-ink'}`
            return (
              <div key={row.id} className="px-2">
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
                        {row.entry.icon ? (() => { const I = NAV_ICONS[row.entry.icon]; return <I className="w-[20px] h-[20px]" /> })() : <span className="text-[17px]">{row.entry.emoji}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] leading-tight ${active ? 'text-brand font-bold' : 'text-ink-strong font-semibold'}`}>{ko ? row.entry.label.ko : row.entry.label.en}</span>
                        <span className="block mt-0.5 text-[12px] text-ink-muted truncate">{ko ? row.entry.desc.ko : row.entry.desc.en}</span>
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
