import { useEffect, useRef } from 'react'
import {
  HIGHLIGHT_COLORS,
  HIGHLIGHT_STYLES,
  highlightStyle,
  swatchColor,
  type HighlightColor,
  type HighlightOptions,
  type HighlightStyle,
} from './highlightMarkup'

interface Props {
  language: string
  options: HighlightOptions
  onChange: (next: HighlightOptions) => void
  onApply: () => void
  onRemove?: () => void
  onClose: () => void
  /** 선택된 문구 (미리보기용). 없으면 안내 문구 */
  sampleText: string
}

const COLOR_LABEL: Record<HighlightColor, [string, string]> = {
  brand: ['파랑', 'Blue'],
  yellow: ['노랑', 'Yellow'],
  green: ['초록', 'Green'],
  pink: ['분홍', 'Pink'],
  orange: ['주황', 'Orange'],
  purple: ['보라', 'Purple'],
}
const STYLE_LABEL: Record<HighlightStyle, [string, string]> = {
  marker: ['형광펜', 'Marker'],
  underline: ['밑줄', 'Underline'],
  wavy: ['물결', 'Wavy'],
  dotted: ['점선', 'Dotted'],
  text: ['글자색', 'Text'],
}

/** 하이라이트 옵션 팝오버 — 색상 · 밑줄 스타일 · 굵게 + 미리보기 */
export default function HighlightPopover({ language, options, onChange, onApply, onRemove, onClose, sampleText }: Props) {
  const ko = language === 'ko'
  const ref = useRef<HTMLDivElement>(null)

  // 바깥 클릭 / ESC 닫기
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const preview = sampleText.trim() || (ko ? '선택한 문구가 이렇게 보여요' : 'Selected text will look like this')

  return (
    <div
      ref={ref}
      // textarea 포커스(선택 영역)를 잃지 않도록 mousedown 기본동작 차단
      onMouseDown={(e) => e.preventDefault()}
      className="absolute right-0 top-full mt-2 z-30 w-[268px] rounded-2xl border border-border-light dark:border-white/[0.1] bg-white dark:bg-[#1c1c1c] shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-3.5 text-left"
    >
      {/* 미리보기 */}
      <div className="rounded-xl bg-surface-light dark:bg-white/[0.04] px-3 py-2.5 mb-3 text-sm text-ink-strong leading-relaxed overflow-hidden">
        <span className="line-clamp-2" style={highlightStyle(options)}>{preview}</span>
      </div>

      {/* 색상 */}
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{ko ? '색상' : 'Color'}</p>
      <div className="flex items-center gap-2 mb-3">
        {HIGHLIGHT_COLORS.map((c) => {
          const active = options.color === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...options, color: c })}
              title={COLOR_LABEL[c][ko ? 0 : 1]}
              aria-label={COLOR_LABEL[c][ko ? 0 : 1]}
              aria-pressed={active}
              className={`w-7 h-7 rounded-full transition-transform ${active ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1c1c1c] ring-[var(--brand)]' : 'hover:scale-105'}`}
              style={{ background: swatchColor(c) }}
            />
          )
        })}
      </div>

      {/* 스타일 */}
      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{ko ? '스타일' : 'Style'}</p>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {HIGHLIGHT_STYLES.map((s) => {
          const active = options.style === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...options, style: s })}
              aria-pressed={active}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                  : 'border-border-light dark:border-white/[0.08] text-ink-strong hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
              }`}
            >
              <span style={highlightStyle({ ...options, style: s, bold: false })}>{STYLE_LABEL[s][ko ? 0 : 1]}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => onChange({ ...options, bold: !options.bold })}
          aria-pressed={options.bold}
          className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            options.bold
              ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
              : 'border-border-light dark:border-white/[0.08] text-ink-strong hover:bg-black/[0.03] dark:hover:bg-white/[0.06]'
          }`}
        >
          {ko ? '굵게' : 'Bold'}
        </button>
      </div>

      <div className="flex gap-2">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 bg-surface-light dark:bg-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.09] transition-colors"
          >
            {ko ? '해제' : 'Remove'}
          </button>
        )}
        <button
          type="button"
          onClick={onApply}
          className="flex-1 py-2 rounded-xl brand-gradient text-xs font-semibold shadow-[0_2px_8px_var(--brand-glow)]"
        >
          {ko ? '적용' : 'Apply'}
        </button>
      </div>
    </div>
  )
}
