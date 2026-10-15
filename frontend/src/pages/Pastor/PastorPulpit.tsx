import { pastorKeys } from '../../hooks/queryKeys'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchOutline, type SermonOutline } from '../../api/pastor'
import { usePastorGate } from './components/pastorUtils'
import { buildSlides, countChars, estimateMinutes, sectionBody, usePace, type Slide } from './components/manuscript'

// 강단 보기 — PC 에서 쓴 원고를 강단(주로 태블릿)에서 한 장씩 넘겨 본다.
//   넘기기: 화면 오른쪽 탭/왼쪽 탭 · 좌우 스와이프 · ← → · 스페이스 · PageUp/PageDown(블루투스 넘김 리모컨)
//   설교 중 사고 막기: 화면 꺼짐 방지(Wake Lock), 닫기는 두 번 눌러야, 새로고침해도 보던 장 그대로(sessionStorage)
//   보기: 글씨 3단계 · 어두운/종이 바탕(기기마다 기억) · 대지 진행 막대(누르면 그 대지로) · 경과 시간/예상 시간
// 원고가 빈 칸은 개요 글로, 그것도 없으면 칸 이름만 한 장으로 보여 준다.

const FONT_KEY = 'pastor-pulpit-font'
const THEME_KEY = 'pastor-pulpit-theme'
const FONT_SIZES = ['clamp(24px, 3.1vw, 40px)', 'clamp(28px, 3.8vw, 50px)', 'clamp(32px, 4.6vw, 60px)'] as const
const FONT_LABELS = ['보통', '크게', '아주 크게'] as const

type Theme = 'dark' | 'paper'

const THEMES: Record<Theme, { bg: string; fg: string; sub: string; soft: string; line: string }> = {
  dark: { bg: '#0e0e12', fg: 'rgba(255,255,255,0.95)', sub: 'rgba(255,255,255,0.5)', soft: 'rgba(255,255,255,0.07)', line: 'rgba(255,255,255,0.1)' },
  paper: { bg: '#f7f5ef', fg: '#191919', sub: 'rgba(25,25,25,0.5)', soft: 'rgba(0,0,0,0.06)', line: 'rgba(0,0,0,0.1)' },
}

const readNumber = (key: string, fallback: number, max: number, store: Storage | null = safeLocal()): number => {
  try {
    const n = Number(store?.getItem(key))
    return Number.isInteger(n) && n >= 0 && n <= max && store?.getItem(key) != null ? n : fallback
  } catch {
    return fallback
  }
}

function safeLocal(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
function safeSession(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}
const write = (store: Storage | null, key: string, value: string) => {
  try {
    store?.setItem(key, value)
  } catch {
    /* 사생활 보호 모드 — 이번 화면에서만 */
  }
}

const PastorPulpit = () => {
  const pastor = usePastorGate()
  const id = Number(useParams().id)
  const { data, isPending } = useQuery<SermonOutline>({
    queryKey: pastorKeys.outline(id),
    queryFn: () => fetchOutline(id),
    enabled: pastor && !!id,
    refetchOnMount: 'always',
  })

  // 앱 머리·레일 위로 덮는 전체 화면 — 뒤 화면은 스크롤되지 않게
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  let content
  if (isPending) content = <Centered text="원고를 불러오는 중..." />
  else if (!data) content = <Centered text="원고를 찾을 수 없습니다" back={id} />
  else content = <Stage outline={data} />

  return createPortal(<div className="fixed inset-0 z-[130]">{content}</div>, document.body)
}

const Centered = ({ text, back }: { text: string; back?: number }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0e0e12] text-white/70 text-[18px]">
    {text}
    {back != null && (
      <Link to="/pastor/sermon/outlines" className="text-[15px] font-bold text-brand">
        개요 목록으로
      </Link>
    )}
  </div>
)

// dev 미리보기(/dev/sermon-desk?v=pulpit)도 표본 원고로 이 무대를 그린다
export const Stage = ({ outline }: { outline: SermonOutline }) => {
  const navigate = useNavigate()
  const slides = useMemo(() => buildSlides(outline.sections), [outline.sections])
  const posKey = `pastor-pulpit-pos-${outline.id}`
  const [index, setIndex] = useState(() => Math.min(readNumber(posKey, 0, 9999, safeSession()), Math.max(0, slides.length - 1)))
  const [font, setFont] = useState(() => readNumber(FONT_KEY, 1, FONT_SIZES.length - 1))
  const [theme, setTheme] = useState<Theme>(() => (safeLocal()?.getItem(THEME_KEY) === 'paper' ? 'paper' : 'dark'))
  const [, , perMin] = usePace()
  const t = THEMES[theme]

  const total = outline.sections.reduce((n, s) => n + countChars(sectionBody(s)), 0)
  const target = estimateMinutes(total, perMin)

  useEffect(() => write(safeSession(), posKey, String(index)), [posKey, index])

  // ── 경과 시간 — 처음 넘길 때 시작, 시계를 누르면 멈춤/계속 ──
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex(i => Math.max(0, Math.min(slides.length - 1, i + dir)))
      // 처음 넘기는 순간 시계가 간다 — 멈춰 둔 시계는 그대로
      if (dir === 1 && elapsed === 0) setRunning(true)
    },
    [slides.length, elapsed],
  )
  const jumpSection = (sectionIdx: number) => {
    const at = slides.findIndex(s => s.sectionIdx === sectionIdx)
    if (at >= 0) setIndex(at)
  }

  // ── 닫기는 두 번 — 설교 중 실수로 눌러 원고가 사라지지 않게 ──
  const [exitArmed, setExitArmed] = useState(false)
  useEffect(() => {
    if (!exitArmed) return
    const timer = setTimeout(() => setExitArmed(false), 3000)
    return () => clearTimeout(timer)
  }, [exitArmed])
  const exit = useCallback(() => {
    if (!exitArmed) return setExitArmed(true)
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    navigate(`/pastor/sermon/outlines/${outline.id}?mode=manuscript`, { replace: true })
  }, [exitArmed, navigate, outline.id])

  // ── 키보드 · 블루투스 넘김 리모컨 ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        go(1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Escape') {
        exit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, exit])

  // ── 화면 꺼짐 방지 — 탭이 다시 보이면 다시 건다(가려지면 브라우저가 풀어 버린다) ──
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const acquire = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen')
      } catch {
        /* 배터리 절약 모드 등 — 못 걸면 그대로 */
      }
    }
    void acquire()
    const onVisible = () => document.visibilityState === 'visible' && void acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release().catch(() => undefined)
    }
  }, [])

  // ── 전체 화면 ──
  const [isFull, setIsFull] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const on = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const canFullscreen = typeof document.documentElement.requestFullscreen === 'function'
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  // ── 스와이프 · 탭 ──
  const touch = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY }
    swiped.current = false
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swiped.current = true
      go(dx < 0 ? 1 : -1)
    }
  }
  const onStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    go(e.clientX - rect.left < rect.width / 3 ? -1 : 1)
  }

  const changeFont = () => {
    const next = (font + 1) % FONT_SIZES.length
    setFont(next)
    write(safeLocal(), FONT_KEY, String(next))
  }
  const changeTheme = () => {
    const next: Theme = theme === 'dark' ? 'paper' : 'dark'
    setTheme(next)
    write(safeLocal(), THEME_KEY, next)
  }

  if (!slides.length) {
    return <Centered text="원고가 비어 있어요" back={outline.id} />
  }

  const slide = slides[index]
  const nextSlide: Slide | undefined = slides[index + 1]
  const sectionCount = outline.sections.length
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')
  const over = target > 0 && elapsed / 60 > target
  const btn: CSSProperties = { background: t.soft, color: t.fg }

  return (
    <div
      className="w-full h-full flex flex-col select-none"
      style={{ background: t.bg, color: t.fg, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 위: 닫기 · 제목 · 보기 설정 · 시간 */}
      <div className="flex items-center gap-2 px-4 lg:px-6 pt-3 pb-2">
        <button
          type="button"
          onClick={exit}
          className="h-11 rounded-full flex items-center justify-center gap-1 px-3 text-[14px] font-bold transition-colors"
          style={exitArmed ? { background: '#e5484d', color: '#fff' } : btn}
          aria-label="강단 보기 닫기"
        >
          <span className="material-icons-outlined text-[22px]">close</span>
          {exitArmed && '한 번 더 누르면 나가요'}
        </button>
        <p className="min-w-0 truncate text-[15px] lg:text-[16px] font-bold" style={{ color: t.sub }}>
          {[outline.passage, outline.title].filter(Boolean).join(' · ')}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={changeFont} className="h-11 px-3 rounded-full inline-flex items-center gap-1 text-[14px] font-bold" style={btn} aria-label="글씨 크기">
            <span className="material-icons-outlined text-[20px]">text_increase</span>
            <span className="hidden sm:inline">{FONT_LABELS[font]}</span>
          </button>
          <button type="button" onClick={changeTheme} className="w-11 h-11 rounded-full inline-flex items-center justify-center" style={btn} aria-label={theme === 'dark' ? '밝은 종이 바탕' : '어두운 바탕'}>
            <span className="material-icons-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {canFullscreen && (
            <button type="button" onClick={toggleFull} className="w-11 h-11 rounded-full inline-flex items-center justify-center" style={btn} aria-label={isFull ? '전체 화면 끝내기' : '전체 화면'}>
              <span className="material-icons-outlined text-[20px]">{isFull ? 'close_fullscreen' : 'open_in_full'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setRunning(r => !r)}
            onDoubleClick={() => {
              setRunning(false)
              setElapsed(0)
            }}
            title="누르면 멈춤/계속 · 두 번 누르면 처음부터"
            className="h-11 px-3.5 rounded-full inline-flex items-center gap-1.5 text-[18px] font-bold tabular-nums"
            style={over ? { background: 'rgba(229,72,77,0.18)', color: '#e5484d' } : btn}
          >
            <span className="material-icons-outlined text-[19px]">{running ? 'timer' : 'play_arrow'}</span>
            {mm}:{ss}
            {target > 0 && <span className="text-[13px] font-semibold" style={{ color: over ? undefined : t.sub }}>/ {target}분</span>}
          </button>
        </div>
      </div>

      {/* 대지 진행 — 누르면 그 대지 첫 장으로 */}
      <div className="flex gap-1.5 px-4 lg:px-6">
        {outline.sections.map((s, k) => {
          const state = k < slide.sectionIdx ? 'past' : k === slide.sectionIdx ? 'now' : 'next'
          return (
            <button key={s.id} type="button" onClick={() => jumpSection(k)} className="flex-1 min-w-0 text-left py-1" aria-label={`${s.label}로 가기`}>
              <span
                className="block h-1.5 rounded-full"
                style={{ background: state === 'next' ? t.line : 'var(--brand)', opacity: state === 'past' ? 0.55 : 1 }}
              />
              <span
                className={`block mt-1 text-[14px] lg:text-[15px] truncate ${state === 'now' ? 'font-bold' : ''}`}
                style={{ color: state === 'now' ? t.fg : t.sub }}
              >
                {sectionCount <= 7 || state === 'now' ? s.label : ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* 본문 — 왼쪽 1/3 은 이전, 나머지는 다음 */}
      <div
        className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-6 sm:px-10 lg:px-20 py-6"
        onClick={onStageClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <SlideView slide={slide} fontSize={FONT_SIZES[font]} theme={t} />
      </div>

      {/* 아래: 이전 · 다음 미리보기 · 다음 */}
      <div className="flex items-center gap-3 px-4 lg:px-6 pb-4 pt-1">
        <button type="button" onClick={() => go(-1)} disabled={index === 0} className="h-14 w-20 rounded-2xl flex items-center justify-center disabled:opacity-30" style={btn} aria-label="이전 장">
          <span className="material-icons-outlined text-[30px]">chevron_left</span>
        </button>
        <p className="flex-1 min-w-0 text-center text-[13.5px] lg:text-[14.5px] truncate" style={{ color: t.sub }}>
          {index + 1} / {slides.length}
          {nextSlide ? ` · 다음: ${nextSlide.kind === 'verse' ? `📖 ${nextSlide.ref}` : nextSlide.body.split('\n')[0].slice(0, 40)}` : ' · 마지막 장'}
        </p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === slides.length - 1}
          className="h-14 w-20 rounded-2xl flex items-center justify-center bg-brand text-white disabled:opacity-30"
          aria-label="다음 장"
        >
          <span className="material-icons-outlined text-[30px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

const SlideView = ({ slide, fontSize, theme }: { slide: Slide; fontSize: string; theme: (typeof THEMES)[Theme] }) => {
  if (slide.kind === 'verse') {
    return (
      <div
        className="w-full max-w-[1400px] rounded-3xl border-2 px-7 sm:px-10 py-8 sm:py-10"
        style={{ borderColor: 'var(--brand)', background: 'var(--brand-soft)', boxShadow: '0 0 60px var(--brand-glow)' }}
      >
        <p className="text-brand font-bold mb-3" style={{ fontSize: `calc(${fontSize} * 0.5)` }}>
          {slide.ref}
        </p>
        <p className="font-bold leading-[1.55] whitespace-pre-line tracking-[-0.01em] break-keep" style={{ fontSize, color: theme.fg }}>
          {slide.body}
        </p>
      </div>
    )
  }
  if (slide.kind === 'title') {
    return (
      <p className="w-full max-w-[1400px] text-center font-bold tracking-[-0.02em]" style={{ fontSize: `calc(${fontSize} * 1.15)`, color: theme.sub }}>
        {slide.body}
      </p>
    )
  }
  return (
    <p className="w-full max-w-[1400px] font-semibold leading-[1.6] whitespace-pre-line tracking-[-0.01em] break-keep" style={{ fontSize }}>
      {slide.body}
    </p>
  )
}

export default PastorPulpit
