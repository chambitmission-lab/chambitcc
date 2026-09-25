import { useCallback, useEffect, useRef, useState } from 'react'
import { HistoryGlyph } from '../HistoryIcons'
import { LAB_MILESTONES, churchYearOf } from './labData'

const AUTO_INTERVAL = 6000

/** 진행 레일에서 연대가 바뀌는 첫 이정표에만 연도 라벨을 단다 */
const DECADE_STARTS = new Set(
  LAB_MILESTONES.flatMap((m, i) =>
    i === 0 || Math.floor(m.year / 10) !== Math.floor(LAB_MILESTONES[i - 1].year / 10) ? [i] : [],
  ),
)

/** ① 한 장씩 넘기는 이야기책 — 이정표 하나를 한 화면에 크게. ← → 키 · 자동 넘김 */
export default function StoryBook() {
  const [idx, setIdx] = useState(0)
  const [auto, setAuto] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const total = LAB_MILESTONES.length
  const m = LAB_MILESTONES[idx]
  const sameYear = LAB_MILESTONES.filter((x) => x.year === m.year).length

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return
      setIdx(next)
    },
    [total],
  )

  // 자동 넘김 — 마지막 장에서 멈춘다
  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => {
      if (idx >= total - 1) setAuto(false)
      else setIdx(idx + 1)
    }, AUTO_INTERVAL)
    return () => window.clearTimeout(t)
  }, [auto, idx, total])

  // 키보드 ← →. 입력 중이거나 다른 탭일 땐 무시
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current?.offsetParent) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') {
        setAuto(false)
        go(idx + 1)
      } else if (e.key === 'ArrowLeft') {
        setAuto(false)
        go(idx - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, idx])

  const toggleAuto = () => {
    if (auto) return setAuto(false)
    if (idx >= total - 1) setIdx(0)
    setAuto(true)
  }

  const pct = (i: number) => (i / (total - 1)) * 96 + 2

  return (
    <div ref={rootRef}>
      <article className="hlab-card hlab-book" aria-live="polite">
        <div className="hlab-book-side" key={`s${idx}`}>
          <div>
            <div className="hlab-book-year">{m.year}</div>
            <div className="hlab-book-date">
              {m.month}월 {m.day}일
            </div>
          </div>
          <div className="hlab-book-age">창립 {churchYearOf(m.year)}년째</div>
          <span className="hlab-book-glyph" aria-hidden="true">
            <HistoryGlyph emoji={m.icon} size={180} />
          </span>
        </div>

        <div className="hlab-book-main" key={`m${idx}`}>
          <p className="hlab-book-chap">
            이야기 {idx + 1} / {total}
            {sameYear > 1 && ` · 이 해의 이정표 ${sameYear}개`}
          </p>
          <h3 className="hlab-book-title">{m.title}</h3>
          <p className="hlab-book-text">{m.text}</p>

          <div className="hlab-book-ctrl">
            <button
              type="button"
              className="hlab-btn"
              disabled={idx === 0}
              onClick={() => {
                setAuto(false)
                go(idx - 1)
              }}
            >
              ◀ 이전
            </button>
            <button type="button" className="hlab-btn hlab-btn--soft" onClick={toggleAuto}>
              {auto ? '멈추기' : '자동으로 넘기기'}
            </button>
            <button
              type="button"
              className="hlab-btn hlab-btn--primary"
              disabled={idx === total - 1}
              onClick={() => {
                setAuto(false)
                go(idx + 1)
              }}
            >
              다음 이야기 ▶
            </button>
          </div>
        </div>
      </article>

      <div className="hlab-card hlab-rail">
        <div className="hlab-rail-track">
          <div className="hlab-rail-line" />
          <div className="hlab-rail-fill" style={{ width: `${pct(idx)}%` }} />
          {LAB_MILESTONES.map((x, i) => {
            const showLabel = DECADE_STARTS.has(i)
            return (
              <span key={x.index}>
                <button
                  type="button"
                  className={`hlab-rail-dot${i < idx ? ' is-past' : ''}${i === idx ? ' is-on' : ''}`}
                  style={{ left: `${pct(i)}%` }}
                  aria-label={`${x.year}년 ${x.title}`}
                  title={`${x.year} ${x.title}`}
                  onClick={() => {
                    setAuto(false)
                    go(i)
                  }}
                />
                {showLabel && (
                  <span className="hlab-rail-label" style={{ left: `${pct(i)}%` }}>
                    {x.year}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
      <p className="hlab-hint">키보드 ← → 로도 넘길 수 있어요</p>
    </div>
  )
}
