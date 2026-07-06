import { useEffect, useRef, useState } from 'react'

/**
 * Aa 읽기 설정 — 성경 본문의 서체/글자 크기/줄 간격을 개인화한다.
 * 설정은 :root CSS 변수(--bible-font-scale 등)로 심어지고 verse-display.css가 참조한다.
 * localStorage에 저장되어 다음 방문에도 유지된다.
 */

const STORAGE_KEY = 'bible-reader-prefs'

const FONT_SCALES = [0.9, 1, 1.1, 1.22, 1.35]
const LINE_HEIGHTS = [1.8, 2.0, 2.3]
const SERIF_STACK = "'Noto Serif KR', 'Nanum Myeongjo', serif"

export interface ReaderPrefs {
  font: 'gothic' | 'serif'
  scaleIdx: number // FONT_SCALES 인덱스
  leadingIdx: number // LINE_HEIGHTS 인덱스
}

const DEFAULT_PREFS: ReaderPrefs = { font: 'gothic', scaleIdx: 1, leadingIdx: 1 }

const loadPrefs = (): ReaderPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw)
    return {
      font: p.font === 'serif' ? 'serif' : 'gothic',
      scaleIdx: FONT_SCALES[p.scaleIdx] !== undefined ? p.scaleIdx : 1,
      leadingIdx: LINE_HEIGHTS[p.leadingIdx] !== undefined ? p.leadingIdx : 1,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

const applyPrefs = (p: ReaderPrefs) => {
  const root = document.documentElement
  root.style.setProperty('--bible-font-scale', String(FONT_SCALES[p.scaleIdx]))
  root.style.setProperty('--bible-line-height', String(LINE_HEIGHTS[p.leadingIdx]))
  if (p.font === 'serif') {
    root.style.setProperty('--bible-font-family', SERIF_STACK)
  } else {
    root.style.removeProperty('--bible-font-family')
  }
}

const ReaderSettings = () => {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<ReaderPrefs>(loadPrefs)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 마운트 시(및 변경 시) 저장된 설정을 CSS 변수로 반영
  useEffect(() => {
    applyPrefs(prefs)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  // 패널 밖을 탭하면 닫기
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const update = (patch: Partial<ReaderPrefs>) => setPrefs(prev => ({ ...prev, ...patch }))

  return (
    <div ref={wrapRef} className="reader-settings">
      <button
        type="button"
        className={`nav-button reader-settings__btn ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="읽기 설정"
        title="읽기 설정"
      >
        <span className="reader-settings__aa">Aa</span>
      </button>

      {open && (
        <div className="reader-settings__panel" role="dialog" aria-label="읽기 설정">
          {/* 서체 */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">서체</span>
            <div className="reader-settings__seg">
              <button
                type="button"
                className={prefs.font === 'gothic' ? 'active' : ''}
                onClick={() => update({ font: 'gothic' })}
              >
                고딕
              </button>
              <button
                type="button"
                className={prefs.font === 'serif' ? 'active' : ''}
                style={{ fontFamily: SERIF_STACK }}
                onClick={() => update({ font: 'serif' })}
              >
                명조
              </button>
            </div>
          </div>

          {/* 글자 크기 */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">글자 크기</span>
            <div className="reader-settings__stepper">
              <button
                type="button"
                aria-label="글자 작게"
                disabled={prefs.scaleIdx === 0}
                onClick={() => update({ scaleIdx: Math.max(0, prefs.scaleIdx - 1) })}
              >
                A−
              </button>
              <span className="reader-settings__dots" aria-hidden>
                {FONT_SCALES.map((_, i) => (
                  <span key={i} className={i === prefs.scaleIdx ? 'on' : ''} />
                ))}
              </span>
              <button
                type="button"
                aria-label="글자 크게"
                disabled={prefs.scaleIdx === FONT_SCALES.length - 1}
                onClick={() => update({ scaleIdx: Math.min(FONT_SCALES.length - 1, prefs.scaleIdx + 1) })}
              >
                A＋
              </button>
            </div>
          </div>

          {/* 줄 간격 */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">줄 간격</span>
            <div className="reader-settings__seg">
              {(['좁게', '보통', '넓게'] as const).map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={prefs.leadingIdx === i ? 'active' : ''}
                  onClick={() => update({ leadingIdx: i })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="reader-settings__preview" style={{
            fontFamily: prefs.font === 'serif' ? SERIF_STACK : undefined,
            fontSize: `${0.9375 * FONT_SCALES[prefs.scaleIdx]}rem`,
            lineHeight: LINE_HEIGHTS[prefs.leadingIdx],
          }}>
            태초에 하나님이 천지를 창조하시니라
          </p>
        </div>
      )}
    </div>
  )
}

export default ReaderSettings
