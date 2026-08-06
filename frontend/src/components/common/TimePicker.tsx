// 커스텀 시간 선택 — 네이티브 <input type="time">/<datetime-local>은 브라우저마다
// UI가 제각각이고 모바일에서 시·분을 따로 굴려야 해서, DatePicker와 짝을 이루는
// 30분 간격 목록 팝오버로 쓴다. 값은 'HH:mm' (24시간) 문자열.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../contexts/LanguageContext'

interface TimePickerProps {
  value: string // 'HH:mm' 또는 ''
  onChange: (time: string) => void
  placeholder?: string
  disabled?: boolean
  /** 트리거 버튼 스타일 덮어쓰기 — 폼의 다른 입력과 테두리·높이를 맞출 때 */
  className?: string
}

const PANEL_W = 148
const PANEL_MAX_H = 276
const PANEL_GAP = 8
const VIEWPORT_PAD = 12

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 'HH:mm' → '오전/오후 h:mm' (en이면 'h:mm AM/PM') */
const label12 = (hm: string, isEn: boolean) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm)
  if (!m) return hm
  const h = +m[1]
  const h12 = h % 12 === 0 ? 12 : h % 12
  return isEn
    ? `${h12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
    : `${h < 12 ? '오전' : '오후'} ${h12}:${m[2]}`
}

const TimePicker = ({ value, onChange, placeholder, disabled, className }: TimePickerProps) => {
  const { language } = useLanguage()
  const isEn = language === 'en'
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // 30분 간격 48개. 수정 중 15:45 같은 그리드 밖 값이 오면 목록에 끼워 넣어
  // 현재 값이 목록에서 사라지는 일이 없게 한다.
  const options = useMemo(() => {
    const opts: string[] = []
    for (let i = 0; i < 48; i++) opts.push(`${pad2(Math.floor(i / 2))}:${i % 2 ? '30' : '00'}`)
    if (/^\d{2}:\d{2}$/.test(value) && !opts.includes(value)) {
      opts.push(value)
      opts.sort()
    }
    return opts
  }, [value])

  /* DatePicker와 같은 이유로 body 포털 + fixed — 모달의 overflow에 잘리지 않게 */
  useLayoutEffect(() => {
    if (!isOpen) return
    const place = () => {
      const trigger = containerRef.current
      if (!trigger) return
      const r = trigger.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const panelH = Math.min(PANEL_MAX_H, panelRef.current?.scrollHeight || PANEL_MAX_H)
      const left = Math.max(
        VIEWPORT_PAD,
        Math.min(r.left, vw - PANEL_W - VIEWPORT_PAD),
      )
      const below = r.bottom + PANEL_GAP
      const above = r.top - PANEL_GAP - panelH
      const top =
        below + panelH <= vh - VIEWPORT_PAD
          ? below
          : above >= VIEWPORT_PAD
            ? above
            : Math.max(VIEWPORT_PAD, vh - panelH - VIEWPORT_PAD)
      setPos(prev => (prev && prev.top === top && prev.left === left ? prev : { top, left }))
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [isOpen])

  // 열릴 때 선택값(없으면 오전 9시)이 가운데 오도록 목록을 미리 감아 둔다
  useEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    const target = panel?.querySelector<HTMLElement>(
      `[data-time="${/^\d{2}:\d{2}$/.test(value) ? value : '09:00'}"]`,
    )
    if (panel && target) {
      panel.scrollTop = target.offsetTop - panel.clientHeight / 2 + target.clientHeight / 2
    }
  }, [isOpen, value])

  // 바깥 클릭 · Esc 로 닫기
  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (containerRef.current && !containerRef.current.contains(target)) setIsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  const pick = (hm: string) => {
    onChange(hm)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={
          className ??
          'flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-[14px] text-ink-strong transition-colors hover:border-brand focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/[0.08] dark:bg-white/[0.03]'
        }
      >
        {value ? (
          <span className="font-semibold tabular-nums">{label12(value, isEn)}</span>
        ) : (
          <span className="text-gray-400 dark:text-white/35">
            {placeholder ?? (isEn ? 'Time' : '시간')}
          </span>
        )}
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-colors ${isOpen ? 'text-brand' : 'text-gray-400 dark:text-white/40'}`}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          role="listbox"
          aria-label={isEn ? 'Select time' : '시간 선택'}
          className="fixed z-[300] animate-pop-in overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.35)] dark:border-white/[0.08] dark:bg-card-dark"
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            width: PANEL_W,
            maxHeight: PANEL_MAX_H,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {options.map(hm => {
            const selected = hm === value
            return (
              <button
                key={hm}
                type="button"
                role="option"
                aria-selected={selected}
                data-time={hm}
                onClick={() => pick(hm)}
                className={`block w-full rounded-xl px-3 py-2 text-left text-[13px] font-semibold tabular-nums transition-all active:scale-95 ${
                  selected
                    ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
                    : 'text-ink hover:bg-[var(--brand-soft)]'
                }`}
              >
                {label12(hm, isEn)}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}

export default TimePicker
