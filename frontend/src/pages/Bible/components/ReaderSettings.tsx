import { useEffect, useRef, useState } from 'react'
import { loadCopyPrefs, saveCopyPrefs, type CopyPrefs, type CopyStyle } from './verseCopy'
import { isGlossaryEnabled, setGlossaryEnabled } from '../data/bibleGlossary'

/**
 * Aa 읽기 설정 — 성경 본문의 서체/글자 크기/줄 간격 + 구절 복사 형식을 개인화한다.
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
  /** 야간 따뜻한 톤 — 다크 테마에서 본문의 푸른 빛을 걷어내 밤에 눈이 덜 부시게 */
  warm: boolean
}

const DEFAULT_PREFS: ReaderPrefs = { font: 'gothic', scaleIdx: 1, leadingIdx: 1, warm: false }

const loadPrefs = (): ReaderPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw)
    return {
      font: p.font === 'serif' ? 'serif' : 'gothic',
      scaleIdx: FONT_SCALES[p.scaleIdx] !== undefined ? p.scaleIdx : 1,
      leadingIdx: LINE_HEIGHTS[p.leadingIdx] !== undefined ? p.leadingIdx : 1,
      warm: p.warm === true,
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
  // verse-display.css가 [data-theme="dark"][data-bible-warm="true"] 분기로 참조한다
  if (p.warm) {
    root.setAttribute('data-bible-warm', 'true')
  } else {
    root.removeAttribute('data-bible-warm')
  }
}

const COPY_STYLE_OPTIONS: { key: CopyStyle; label: string }[] = [
  { key: 'refAfter', label: '본문+출처' },
  { key: 'refBefore', label: '출처+본문' },
  { key: 'textOnly', label: '본문만' },
]

const ReaderSettings = () => {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<ReaderPrefs>(loadPrefs)
  // 복사 형식은 읽기 설정과 저장소를 따로 쓴다 (복사 유틸이 매번 직접 읽어간다)
  const [copyPrefs, setCopyPrefs] = useState<CopyPrefs>(loadCopyPrefs)
  // 인물·지명 사전 칩 — 저장·전파는 bibleGlossary 모듈이 담당 (열린 본문에 즉시 반영)
  const [glossaryOn, setGlossaryOn] = useState(isGlossaryEnabled)
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

  const updateCopy = (patch: Partial<CopyPrefs>) =>
    setCopyPrefs(prev => {
      const next = { ...prev, ...patch }
      saveCopyPrefs(next)
      return next
    })

  return (
    <div ref={wrapRef} className="reader-settings">
      <button
        type="button"
        className={`reader-settings__btn ${open ? 'is-open' : ''}`}
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

          {/* 야간 톤 — 다크 테마에서만 시각 효과가 있다 (라이트에선 저장만 되고 대기) */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">야간 따뜻한 톤</span>
            <div className="reader-settings__seg">
              <button
                type="button"
                className={prefs.warm ? 'active' : ''}
                onClick={() => update({ warm: true })}
              >
                켜기
              </button>
              <button
                type="button"
                className={!prefs.warm ? 'active' : ''}
                onClick={() => update({ warm: false })}
              >
                끄기
              </button>
            </div>
          </div>
          <p className="reader-settings__hint">
            다크 테마에서 본문을 촛불처럼 따뜻한 색감으로 바꿔 밤에 눈이 덜 부셔요.
          </p>

          {/* 인물·지명 사전 칩 — 본문 표제어의 옅은 점선 밑줄 */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">인물·지명 사전</span>
            <div className="reader-settings__seg">
              <button
                type="button"
                className={glossaryOn ? 'active' : ''}
                onClick={() => {
                  setGlossaryEnabled(true)
                  setGlossaryOn(true)
                }}
              >
                켜기
              </button>
              <button
                type="button"
                className={!glossaryOn ? 'active' : ''}
                onClick={() => {
                  setGlossaryEnabled(false)
                  setGlossaryOn(false)
                }}
              >
                끄기
              </button>
            </div>
          </div>
          <p className="reader-settings__hint">
            바로·라합 같은 인물·지명에 옅은 점선이 표시되고, 누르면 한 줄 설명이 열려요.
          </p>

          <p className="reader-settings__preview" style={{
            fontFamily: prefs.font === 'serif' ? SERIF_STACK : undefined,
            fontSize: `${0.9375 * FONT_SCALES[prefs.scaleIdx]}rem`,
            lineHeight: LINE_HEIGHTS[prefs.leadingIdx],
          }}>
            태초에 하나님이 천지를 창조하시니라
          </p>

          <div className="reader-settings__divider" aria-hidden />

          {/* 복사 형식 — 절 액션바의 복사/공유가 만드는 문자열 모양 */}
          <div className="reader-settings__row reader-settings__row--stack">
            <span className="reader-settings__label">구절 복사 형식</span>
            <div className="reader-settings__seg">
              {COPY_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  className={copyPrefs.style === opt.key ? 'active' : ''}
                  onClick={() => updateCopy({ style: opt.key })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 링크 첨부 — 받은 사람이 누르면 그 절로 앱이 열린다 */}
          <div className="reader-settings__row">
            <span className="reader-settings__label">링크 첨부</span>
            <div className="reader-settings__seg">
              <button
                type="button"
                className={copyPrefs.withLink ? 'active' : ''}
                onClick={() => updateCopy({ withLink: true })}
              >
                켜기
              </button>
              <button
                type="button"
                className={!copyPrefs.withLink ? 'active' : ''}
                onClick={() => updateCopy({ withLink: false })}
              >
                끄기
              </button>
            </div>
          </div>

          <p className="reader-settings__hint">
            {copyPrefs.style === 'textOnly'
              ? '“태초에 하나님이 천지를 창조하시니라”'
              : copyPrefs.style === 'refBefore'
                ? '창세기 1:1 · 개역개정\n\n“태초에 하나님이 천지를 창조하시니라”'
                : '“태초에 하나님이 천지를 창조하시니라”\n\n창세기 1:1 · 개역개정'}
            {copyPrefs.withLink ? '\n(+ 바로 열리는 링크)' : ''}
          </p>
          <p className="reader-settings__hint">
            여러 절을 문단으로 흘릴지, 절 번호를 붙일지는 공유 버튼의 미리보기에서 바꿀 수 있어요.
          </p>
        </div>
      )}
    </div>
  )
}

export default ReaderSettings
