import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import { ensureFontFamily } from '../../../utils/deferredFonts'
import { usePassageVerses } from '../hooks/usePassageVerses'
import { parseRef } from '../data/crossRefs'
import { formatPromiseRef } from '../components/messiah/promiseText'
import { nextParable, TOPIC_LABEL, PARABLES, type Parable, type ParableMark } from '../data/parables'
import ParableArt from './ParableArt'
import ParableVisual from './ParableVisual'
import { hasParableImage } from './parableImages'
import { markParableRead, useParableRead } from './parableProgress'
import './parables-tone.css'
import './ParableSheet.css'

// 포털 시트라 <main data-text-scale> 를 상속받지 못한다 — 약속 시트와 같은 값으로 직접 세팅
const TEXT_MUL: Record<FeedTextScale, number> = { base: 1, large: 1.1, xlarge: 1.2 }

/** 받침 따라 을/를 ('잃은 양을' · '겨자씨를') */
const eulReul = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '을' : '를'
}

/** 본문에서 각 낱말이 처음 나오는 자리 — 겹치면 먼저 나온 것만 */
const findMarks = (text: string, marks: readonly ParableMark[], taken: Set<number>) => {
  const spans: { start: number; end: number; idx: number }[] = []
  marks.forEach((m, idx) => {
    if (taken.has(idx)) return
    const at = text.indexOf(m.text)
    if (at >= 0) spans.push({ start: at, end: at + m.text.length, idx })
  })
  spans.sort((a, b) => a.start - b.start)
  const out: typeof spans = []
  let end = -1
  for (const s of spans) {
    if (s.start < end) continue
    out.push(s)
    end = s.end
    taken.add(s.idx)
  }
  return out
}

/** 핵심 절 인용 — 붉은 글씨(예수님 말씀) 위에 눌러 볼 낱말을 연필 밑줄 단추로 */
const QuoteWithMarks = ({ p, active, onPick }: { p: Parable; active: number; onPick: (i: number) => void }) => {
  const ref = useMemo(() => parseRef(p.quote), [p.quote])
  const { verses, isLoading } = usePassageVerses(ref)
  if (isLoading) return <p className="pbs-quote pbs-quote--loading">본문을 불러오는 중…</p>
  if (!verses.length) return <p className="pbs-quote pbs-quote--loading">본문을 불러오지 못했어요.</p>
  const taken = new Set<number>()
  return (
    <p className="pbs-quote">
      {verses.map((v, vi) => {
        const parts: ReactNode[] = []
        let at = 0
        for (const s of findMarks(v.text, p.marks, taken)) {
          if (s.start > at) parts.push(v.text.slice(at, s.start))
          parts.push(
            <button
              key={s.idx}
              type="button"
              className={`pbs-mark${active === s.idx ? ' is-on' : ''}`}
              aria-pressed={active === s.idx}
              onClick={() => onPick(s.idx)}
            >
              {v.text.slice(s.start, s.end)}
            </button>,
          )
          at = s.end
        }
        if (at < v.text.length) parts.push(v.text.slice(at))
        return (
          <span key={v.id}>
            {vi > 0 && ' '}
            <sup className="pbs-quote__num">{v.verse}</sup>
            {parts}
          </span>
        )
      })}
    </p>
  )
}

interface ParableSheetProps {
  parable: Parable
  onClose: () => void
  /** 다 읽은 뒤 '다음 비유'를 누르면 시트를 닫지 않고 바꿔 연다 */
  onOpen: (p: Parable) => void
}

/**
 * 비유 시트 — 한 장에 정리(맥락 → 말씀 속 낱말 풀이 → 놀란 이유 → 다른 복음서 → 오늘 나에게)
 * 하고, 맨 아래 '다 읽었어요'를 누르면 점선 도장이 찍히며 이어 읽을 비유를 권한다.
 */
const ParableSheet = ({ parable: p, onClose, onOpen }: ParableSheetProps) => {
  useModalBackButton(onClose)
  // 낱말 풀이의 손글씨(나눔펜)는 지연 서체 — 시트를 열 때 받는다(못 받으면 명조로)
  useEffect(() => {
    void ensureFontFamily('nanumPen')
  }, [])
  const navigate = useNavigate()
  const textScale = useFeedTextScale()
  const read = useParableRead()
  const [active, setActive] = useState(0)
  const [justStamped, setJustStamped] = useState(false)
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null)
  const done = read.has(p.id)
  const next = done ? nextParable(p.id, read) : undefined
  const passage = parseRef(p.passage)
  const mark = p.marks[active] ?? p.marks[0]

  const go = (ref: string) => {
    const r = parseRef(ref)
    onClose()
    navigate(`/bible/${r.b}/${r.c}?verse=${r.v}`)
  }

  const openNext = (n: Parable) => {
    setActive(0)
    setJustStamped(false)
    scrollEl?.scrollTo({ top: 0 })
    onOpen(n)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 sheet-backdrop sm:p-4"
      style={{ '--text-mul': TEXT_MUL[textScale] } as CSSProperties}
      onClick={onClose}
    >
      <div
        className={`pbs-panel pb-tone--${p.topic} bg-background-light dark:bg-card-dark relative w-full sm:max-w-md lg:max-w-[1040px] sheet-rise rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.35)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.45)]`}
        role="dialog"
        aria-modal="true"
        aria-label={`예수님의 비유 · ${p.title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />

        <div className="pbs-scroll" ref={setScrollEl}>
          {/* PC(lg+)에선 두 칸 — 왼쪽(그림·제목·맥락)은 붙어 있고 오른쪽(말씀·풀이·마무리)만 흘러간다 */}
          <div className="pbs-cols">
          <div className="pbs-col pbs-col--a">
          {/* 머리 — 삽화 띠 + 제목 */}
          <div className={`pbs-art${hasParableImage(p.id) ? ' has-img' : ''}`}>
            <ParableVisual p={p} size="full" />
            <button type="button" onClick={onClose} aria-label="닫기" className="pbs-close">
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>
          <p className="pbs-kicker">
            비유 · {TOPIC_LABEL[p.topic]} · {formatPromiseRef(passage)}
          </p>
          <h3 className="pbs-title">{p.title}</h3>
          <p className="pbs-summary">{p.summary}</p>

          {/* 누구에게, 왜 */}
          <section className="pbs-block">
            <h4 className="pbs-label">누구에게, 왜 하셨나</h4>
            <div className="pbs-who">
              <div>
                <span>듣는 사람</span>
                <b>{p.audience}</b>
              </div>
              <div>
                <span>계기</span>
                <b>{p.trigger}</b>
              </div>
            </div>
            <p className="pbs-context">{p.context}</p>
          </section>

          </div>
          <div className="pbs-col pbs-col--b">
          {/* 말씀 + 낱말 풀이 */}
          <section className="pbs-block">
            <h4 className="pbs-label">
              예수님의 말씀 <span className="pbs-label__hint">· 연필 밑줄을 눌러 보세요</span>
            </h4>
            <QuoteWithMarks p={p} active={active} onPick={setActive} />
            <p className="pbs-quote__ref">{formatPromiseRef(p.quote)}</p>
            {mark && (
              <div className="pbs-tip" aria-live="polite">
                <span className="pbs-tip__key">{mark.text}</span>
                <p>{mark.meaning}</p>
              </div>
            )}
          </section>

          {/* 놀란 이유 */}
          <section className="pbs-block">
            <h4 className="pbs-label">그때 사람들이 놀란 이유</h4>
            <p className="pbs-shock">{p.shock}</p>
          </section>

          {/* 다른 복음서 */}
          {!!p.parallels?.length && (
            <section className="pbs-block">
              <h4 className="pbs-label">같은 비유, 다른 복음서</h4>
              <div className="pbs-par">
                {p.parallels.map((r) => (
                  <button key={r} type="button" onClick={() => go(r)}>
                    {formatPromiseRef(r)}
                    <span className="material-icons-round text-[16px]" aria-hidden>chevron_right</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 오늘 나에게 */}
          <section className="pbs-block">
            <h4 className="pbs-label">오늘 나에게</h4>
            <p className="pbs-ask">
              {p.ask}
              <span className="pbs-ask__sub">답은 저장되지 않아요. 잠깐 떠올려만 보세요.</span>
            </p>
          </section>

          {/* 마무리 — 도장 + 이어 읽기 */}
          {done ? (
            <section className={`pbs-done${justStamped ? ' is-new' : ''}`}>
              <span className="pbs-stamp" aria-hidden>
                <ParableArt kind={p.art} className="pbs-stamp__glyph" />
                <b>읽음</b>
              </span>
              <h4 className="pbs-done__title">‘{p.title}’{eulReul(p.title)} 읽었어요</h4>
              <p className="pbs-done__sub">
                비유 도감 {read.size} / {PARABLES.length}
              </p>
              {next && (
                <button type="button" className={`pbs-next pb-tone--${next.topic}`} onClick={() => openNext(next)}>
                  <span className={`pbs-next__art${hasParableImage(next.id) ? ' has-img' : ''}`}>
                    <ParableVisual p={next} />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="pbs-next__k">이어서 읽기</span>
                    <span className="pbs-next__t">{next.title}</span>
                    <span className="pbs-next__g">{next.gist}</span>
                  </span>
                  <span className="material-icons-round text-[20px]" aria-hidden>chevron_right</span>
                </button>
              )}
            </section>
          ) : null}

          <div className="pbs-actions">
            {!done && (
              <button
                type="button"
                className="pbs-btn"
                onClick={() => {
                  markParableRead(p.id)
                  setJustStamped(true)
                }}
              >
                다 읽었어요
              </button>
            )}
            <button type="button" className="pbs-btn pbs-btn--primary" onClick={() => go(p.passage)}>
              <span className="material-icons-round text-[18px]" aria-hidden>auto_stories</span>
              성경에서 읽기
            </button>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ParableSheet
