import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { BibleFigureSummary, GenealogyLink } from '../../../../types/bibleFigure'
import { useBibleFigureDetail } from '../../../../hooks/useBibleFigure'
import { smoothScrollToElement } from '../../../../utils/scrollTo'
import {
  FIGURE_HOOK,
  JESUS_SLUG,
  MAJOR_GLYPH,
  MATTHEW_WOMEN,
  SKY_ERA_START,
  SKY_GAP_AFTER,
  SKY_MT_MARK,
  type GenGap,
  type SkyEra,
} from '../genealogyStory'

interface GenealogyTreeProps {
  nodes: BibleFigureSummary[]
  links: GenealogyLink[]
  readingProgress: Record<string, number>
  selectedSlug: string | null
  onSelect: (slug: string) => void
  /** 역에 포인터가 닿으면 상세를 미리 받아둔다 (클릭 시 즉시 표시) */
  onHover?: (slug: string) => void
  isLoggedIn: boolean
  /** 비어있지 않으면 이 slug 집합에 속하지 않는 역은 흐리게 표시 */
  highlightSlugs: Set<string> | null
}

/** 계보 한 칸 — 인물이거나, 성경이 건너뛴 세대 묶음 */
type Slot =
  | {
      kind: 'fig'
      id: string
      figure: BibleFigureSummary
      spouses: BibleFigureSummary[]
      /** 계보에서 갈라진 자녀(현재 데이터엔 없음 — 생기면 이름 칩으로만) */
      branches: BibleFigureSummary[]
      gen: number
      viaMother: boolean
      era: number
    }
  | { kind: 'gap'; id: string; gap: GenGap; gen: number; era: number }

/** 화면에 그리는 한 줄 — 구간 표지판 · 역 · 접힌 세대 · 건너뛴 세대 */
type Row =
  | { kind: 'sign'; key: string; era: number }
  | { kind: 'fig'; key: string; idx: number }
  | { kind: 'fold'; key: string; idxs: number[] }
  | { kind: 'gap'; key: string; idx: number }

const DONE = 0.999
const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '')
const pct = (v: number) => `${Math.round(v * 100)}%`
/** 앱 헤더(3.5rem) 아래 붙는 구간 바 높이까지 비켜 스크롤한다 */
const SCROLL_OFFSET = 150

const TrainIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2C8 2 4 2.5 4 6v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5V21h2.2l2-2h3.6l2 2H18v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
)

/**
 * 메시아 직계 라인 — "내 열차 위치" 노선도.
 * 데이터는 가지 없는 한 줄기라 지하철 노선처럼 위→아래 한 줄로 놓는다. 시대마다 노선 색이 바뀌고,
 * 아담역부터 이어서 다 읽은 역까지 열차가 내려와 있다(지나온 역은 진하게, 앞으로 갈 역은 흐리게).
 * 성경이 건너뛴 세대는 점선 구간, 한 줄 설명 없는 세대가 이어지면 "+n대 더"로 접는다.
 */
export const GenealogyTree = ({
  nodes,
  links,
  readingProgress,
  selectedSlug,
  onSelect,
  onHover,
  isLoggedIn,
  highlightSlugs,
}: GenealogyTreeProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [openFolds, setOpenFolds] = useState<Set<string>>(() => new Set())
  const [nowEra, setNowEra] = useState(0)

  /* ── 한 줄기 계보 + 건너뛴 세대 + 구간 ── */
  const { slots, eras } = useMemo(() => {
    const bySlug = new Map<string, BibleFigureSummary>(nodes.map((n) => [n.slug, n]))
    const parentOf = new Map<string, string>()
    const viaMother = new Set<string>()
    for (const link of links) {
      if (link.type === 'father') parentOf.set(link.target, link.source)
    }
    for (const link of links) {
      if (link.type === 'mother' && !parentOf.has(link.target)) {
        parentOf.set(link.target, link.source)
        viaMother.add(link.target)
      }
    }

    const spousesOf = new Map<string, BibleFigureSummary[]>()
    const addSpouse = (a: string, b: string) => {
      const bFig = bySlug.get(b)
      if (!bySlug.has(a) || !bFig) return
      const list = spousesOf.get(a) || []
      if (!list.find((f) => f.slug === b)) list.push(bFig)
      spousesOf.set(a, list)
    }
    for (const link of links) {
      if (link.type === 'spouse') {
        addSpouse(link.source, link.target)
        addSpouse(link.target, link.source)
      }
    }

    const childrenOf = new Map<string, BibleFigureSummary[]>()
    for (const [child, parent] of parentOf) {
      const fig = bySlug.get(child)
      if (!fig) continue
      childrenOf.set(parent, [...(childrenOf.get(parent) || []), fig])
    }

    const rootSlug =
      nodes.find((n) => !parentOf.has(n.slug) && n.is_messianic_line)?.slug ||
      nodes.find((n) => !parentOf.has(n.slug))?.slug ||
      nodes[0]?.slug

    const out: Slot[] = []
    const eraList: SkyEra[] = []
    const startEra = (id: string) => {
      const e = SKY_ERA_START[id]
      if (e) eraList.push(e)
    }
    const seen = new Set<string>()
    let gen = 1
    let cur = rootSlug
    while (cur && !seen.has(cur)) {
      seen.add(cur)
      const figure = bySlug.get(cur)
      if (!figure) break
      startEra(cur)
      if (eraList.length === 0) eraList.push({ label: '계보의 시작', meta: '', color: '#12b886' })
      const kids = (childrenOf.get(cur) || []).slice().sort((a, b) => a.sort_order - b.sort_order)
      const next = kids.find((k) => k.is_messianic_line) ?? kids[0]
      out.push({
        kind: 'fig',
        id: cur,
        figure,
        spouses: (spousesOf.get(cur) || []).filter((s) => !parentOf.has(s.slug)),
        branches: kids.filter((k) => k !== next),
        gen,
        viaMother: viaMother.has(cur),
        era: eraList.length - 1,
      })
      gen += 1
      const gap = SKY_GAP_AFTER[cur]
      if (gap && next?.slug === gap.until) {
        const id = `gap:${cur}`
        startEra(id)
        out.push({ kind: 'gap', id, gap, gen, era: eraList.length - 1 })
        gen += gap.count
      }
      cur = next?.slug
    }
    return { slots: out, eras: eraList }
  }, [nodes, links])

  const totalGen = useMemo(() => {
    const last = slots[slots.length - 1]
    if (!last) return 0
    return last.kind === 'gap' ? last.gen + last.gap.count - 1 : last.gen
  }, [slots])

  const progressOf = (slug: string) => Math.min(1, readingProgress[slug] ?? 0)

  /* ── 열차 위치 — 아담역부터 끊기지 않고 다 읽은 마지막 역 (건너뛴 세대 구간은 통과) ── */
  const train = useMemo(() => {
    if (!isLoggedIn) return null
    let at = -1
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      if (s.kind === 'gap') continue
      if ((readingProgress[s.id] ?? 0) >= DONE) at = i
      else break
    }
    const next = slots.findIndex((s, i) => i > at && s.kind === 'fig' && (readingProgress[s.id] ?? 0) < DONE)
    const doneCount = slots.filter((s) => s.kind === 'fig' && (readingProgress[s.id] ?? 0) >= DONE).length
    const figCount = slots.filter((s) => s.kind === 'fig').length
    return { at, next, doneCount, figCount }
  }, [isLoggedIn, slots, readingProgress])

  const filtering = !!highlightSlugs
  const hit = (slug: string) => !!highlightSlugs && highlightSlugs.has(slug)
  const slotHit = (s: Slot) => s.kind === 'fig' && (hit(s.id) || s.spouses.some((sp) => hit(sp.slug)))

  /* ── 줄 만들기 — 한 줄 설명 없는 세대가 같은 구간에 2명 이상 이어지면 접는다(필터 중엔 안 접음) ── */
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    // 열차가 선 역과 다음 역은 늘 펼쳐 둔다
    const pinned = new Set([train?.at ?? -1, train?.next ?? -1])
    const plain = (s: Slot, i: number) =>
      s.kind === 'fig' &&
      !pinned.has(i) &&
      !FIGURE_HOOK[s.id] &&
      !MAJOR_GLYPH[s.id] &&
      s.id !== JESUS_SLUG &&
      s.spouses.length === 0 &&
      !SKY_MT_MARK[s.id] &&
      s.id !== selectedSlug
    let lastEra = -1
    let i = 0
    while (i < slots.length) {
      const s = slots[i]
      if (s.era !== lastEra) {
        lastEra = s.era
        out.push({ kind: 'sign', key: `sign-${s.era}`, era: s.era })
      }
      if (s.kind === 'gap') {
        out.push({ kind: 'gap', key: s.id, idx: i })
        i++
        continue
      }
      if (!filtering && plain(s, i)) {
        let j = i
        while (j < slots.length && slots[j].era === s.era && plain(slots[j], j)) j++
        const key = `fold-${s.id}`
        if (j - i >= 2 && !openFolds.has(key)) {
          out.push({ kind: 'fold', key, idxs: Array.from({ length: j - i }, (_, k) => i + k) })
          i = j
          continue
        }
      }
      out.push({ kind: 'fig', key: s.id, idx: i })
      i++
    }
    return out
  }, [slots, filtering, openFolds, selectedSlug, train])

  /* ── 다음 역의 대표 장 — "이어 읽기" 바로가기 ── */
  const nextSlot = train && train.next >= 0 ? slots[train.next] : null
  const nextSlug = nextSlot?.kind === 'fig' ? nextSlot.id : null
  const { data: nextDetail } = useBibleFigureDetail(nextSlug)
  const nextVerse = nextDetail?.key_verses?.find((kv) => kv.book_number && kv.chapter)

  /* ── 지금 구간 — 스크롤하며 구간 바의 이름·색이 바뀐다 ── */
  useEffect(() => {
    let raf = 0
    const measure = () => {
      raf = 0
      const root = rootRef.current
      const bar = barRef.current
      if (!root || !bar) return
      const line = bar.getBoundingClientRect().bottom + 8
      let era = 0
      root.querySelectorAll<HTMLElement>('[data-sign]').forEach((el) => {
        if (el.getBoundingClientRect().top <= line) era = Number(el.dataset.sign)
      })
      setNowEra(era)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [rows])

  // 필터가 바뀌면 첫 매칭 역(배우자 포함)으로 데려간다
  const prevHighlightRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (highlightSlugs === prevHighlightRef.current) return
    prevHighlightRef.current = highlightSlugs
    if (!highlightSlugs || highlightSlugs.size === 0) return
    const first = slots.find(slotHit)
    if (!first) return
    const t = window.setTimeout(() => {
      smoothScrollToElement(rootRef.current?.querySelector(`[data-slug="${first.id}"]`) ?? null, {
        offset: SCROLL_OFFSET + 40,
      })
    }, 60)
    return () => window.clearTimeout(t)
    // slotHit 은 highlightSlugs 로만 바뀐다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightSlugs, slots])

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        가계도를 그릴 데이터가 없습니다.
      </div>
    )
  }

  const jumpTo = (selector: string) =>
    smoothScrollToElement(rootRef.current?.querySelector(selector) ?? null, { offset: SCROLL_OFFSET })

  const eraGens = eras.map((_, k) =>
    slots.filter((s) => s.era === k).reduce((a, s) => a + (s.kind === 'gap' ? s.gap.count : 1), 0),
  )
  const trainSlot = train && train.at >= 0 ? slots[train.at] : null
  const trainGen = trainSlot ? trainSlot.gen : 0
  const arrived = !!train && train.next < 0
  const select = (slug: string) => () => onSelect(slug)
  const hover = (slug: string) => () => onHover?.(slug)

  /** 역 상태 — 지나온(passed) · 앞으로(ahead) — 로그인 안 하면 모두 보통 */
  const isAhead = (idx: number) => !!train && idx > train.at
  const eraStyle = (era: number) => ({ '--c': eras[era]?.color ?? '#3182f6' }) as CSSProperties

  const renderFig = (idx: number, isLast: boolean) => {
    const s = slots[idx]
    if (s.kind !== 'fig') return null
    const fig = s.figure
    const isJesus = s.id === JESUS_SLUG
    const major = isJesus || !!MAJOR_GLYPH[s.id]
    const p = progressOf(s.id)
    const done = p >= DONE
    const hook = isJesus ? '모든 계보가 기다려 온 그분' : FIGURE_HOOK[s.id] ?? fig.role ?? ''
    const mark = SKY_MT_MARK[s.id]
    const here = !!train && train.at === idx
    const dim = filtering && !slotHit(s)
    const cls = [
      'grl-st',
      major ? 'is-major' : 'is-minor',
      isJesus ? 'is-jesus' : '',
      isLast ? 'is-last' : '',
      isAhead(idx) ? 'is-ahead' : train ? 'is-passed' : '',
      here ? 'is-here' : '',
      isLoggedIn && done ? 'is-done' : '',
      isLoggedIn && !done && p > 0 ? 'is-part' : '',
      s.id === selectedSlug ? 'is-sel' : '',
      dim ? 'is-dim' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return (
      <li key={s.id} className={cls} style={eraStyle(s.era)} data-slug={s.id}>
        <span className="grl-dot" aria-hidden />
        <div className="grl-st__body">
          <button
            type="button"
            className="grl-st__name"
            onClick={select(s.id)}
            onPointerEnter={hover(s.id)}
            onTouchStart={hover(s.id)}
          >
            <b>{fig.name_ko}</b>
            <em>
              {s.viaMother ? '母 ' : ''}
              {s.gen}대
            </em>
            {here && <span className="grl-here">내 위치</span>}
            {mark && <span className="grl-mark">{mark}</span>}
          </button>
          {hook && <span className="grl-st__hook">{hook}</span>}
          {(s.spouses.length > 0 || s.branches.length > 0) && (
            <span className="grl-st__chips">
              {s.spouses.map((sp) => {
                const note = MATTHEW_WOMEN[sp.slug]
                const ref = note?.split('·').pop()?.trim()
                return (
                  <button
                    key={sp.slug}
                    type="button"
                    data-slug={sp.slug}
                    className={`grl-woman${note ? ' is-mt' : ''}${hit(sp.slug) ? ' is-hit' : ''}${filtering && !hit(sp.slug) ? ' is-dim' : ''}${sp.slug === selectedSlug ? ' is-sel' : ''}`}
                    onClick={select(sp.slug)}
                    onPointerEnter={hover(sp.slug)}
                    title={note}
                  >
                    {shortName(sp.name_ko)}
                    {ref && <small>{ref}</small>}
                  </button>
                )
              })}
              {s.branches.map((b) => (
                <button
                  key={b.slug}
                  type="button"
                  data-slug={b.slug}
                  className="grl-branch"
                  onClick={select(b.slug)}
                  onPointerEnter={hover(b.slug)}
                >
                  ↳ {shortName(b.name_ko)}
                </button>
              ))}
            </span>
          )}
        </div>
        {isLoggedIn && (
          <span className="grl-st__read" aria-label={`읽은 정도 ${pct(p)}`}>
            <i>
              <b style={{ width: pct(p) }} />
            </i>
            {done ? '읽음' : p > 0 ? pct(p) : ''}
          </span>
        )}
        {here && !isLast && (
          <span className="grl-train" aria-hidden>
            <TrainIcon />
          </span>
        )}
      </li>
    )
  }

  return (
    <div ref={rootRef} className="grl">
      {/* 구간 바 — 앱 헤더 아래 붙어 따라온다 */}
      <div ref={barRef} className="grl-bar" style={eraStyle(nowEra)}>
        <div className="grl-bar__top">
          <span className="grl-now">
            <i aria-hidden />
            지금 구간 <b>{eras[nowEra]?.label}</b>
          </span>
          <span className="grl-bar__meta">
            {train ? `${train.doneCount} / ${train.figCount}역 읽음` : `${totalGen}대 · 아담 → 예수`}
          </span>
        </div>
        <div className="grl-map" role="group" aria-label="구간으로 이동">
          {eras.map((e, k) => (
            <button
              key={k}
              type="button"
              className={k === nowEra ? 'is-on' : undefined}
              style={{ flex: eraGens[k] || 1, background: e.color }}
              onClick={() => jumpTo(`[data-sign="${k}"]`)}
              aria-label={`${e.label}로 이동`}
              title={e.label}
            />
          ))}
          {train && (
            <span
              className="grl-map__train"
              style={{ left: `${totalGen ? (Math.max(0.5, trainGen - 0.5) / totalGen) * 100 : 0}%` }}
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* 내 열차 카드 */}
      {train && (
        <div className="grl-ticket">
          <span className="grl-ticket__icon" aria-hidden>
            <TrainIcon />
          </span>
          <div className="grl-ticket__body">
            {arrived ? (
              <>
                <b>종착역에 도착했어요</b>
                <span>아담에서 예수 그리스도까지 {totalGen}대를 모두 지나왔어요.</span>
              </>
            ) : (
              <>
                <b>
                  {trainSlot && trainSlot.kind === 'fig'
                    ? `내 열차는 ${trainSlot.figure.name_ko}역 · ${trainSlot.gen}대`
                    : '아직 출발 전이에요'}
                </b>
                {nextSlot?.kind === 'fig' && (
                  <span>
                    다음 역 <strong>{nextSlot.figure.name_ko}</strong>
                    {nextVerse && ` · ${[nextVerse.book_name_ko, `${nextVerse.chapter}장`].filter(Boolean).join(' ')}`}
                  </span>
                )}
              </>
            )}
            <span className="grl-ticket__bar" aria-hidden>
              <i style={{ width: `${totalGen ? (trainGen / totalGen) * 100 : 0}%` }} />
            </span>
          </div>
          {!arrived && nextSlot?.kind === 'fig' && (
            <div className="grl-ticket__acts">
              <button type="button" className="grl-btn grl-btn--sub" onClick={select(nextSlot.id)}>
                역 보기
              </button>
              {nextVerse && (
                <Link to={`/bible/${nextVerse.book_number}/${nextVerse.chapter}`} className="grl-btn grl-btn--pri">
                  이어 읽기
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <ol className="grl-route">
        {train && train.at < 0 && (
          <li className="grl-start" style={eraStyle(0)}>
            <span className="grl-train grl-train--start" aria-hidden>
              <TrainIcon />
            </span>
            <span>출발 · 아담역부터 달려 볼까요?</span>
          </li>
        )}
        {rows.map((row, r) => {
          const isLast = r === rows.length - 1
          if (row.kind === 'sign') {
            const e = eras[row.era]
            const firstIdx = slots.findIndex((s) => s.era === row.era)
            return (
              <li
                key={row.key}
                data-sign={row.era}
                className={`grl-sign${r === 0 && !(train && train.at < 0) ? ' is-first' : ''}${isAhead(firstIdx) ? ' is-ahead' : ''}${filtering ? ' is-dim' : ''}`}
                style={eraStyle(row.era)}
              >
                <span className="grl-knot" aria-hidden />
                <span className="grl-sign__label">{e.label}</span>
                {e.meta && <span className="grl-sign__meta">{e.meta}</span>}
              </li>
            )
          }
          if (row.kind === 'gap') {
            const s = slots[row.idx]
            if (s.kind !== 'gap') return null
            const mark = SKY_MT_MARK[s.id]
            return (
              <li
                key={row.key}
                className={`grl-gap${isAhead(row.idx) ? ' is-ahead' : ''}${filtering ? ' is-dim' : ''}`}
                style={eraStyle(s.era)}
              >
                <span className="grl-pill">
                  성경이 건너뛴 {s.gap.count}대 · {s.gen}–{s.gen + s.gap.count - 1}대
                </span>
                {mark && <span className="grl-mark">{mark}</span>}
                <span className="grl-st__hook">
                  {s.gap.names} · {s.gap.ref}
                </span>
              </li>
            )
          }
          if (row.kind === 'fold') {
            const first = slots[row.idxs[0]]
            const names = row.idxs.map((i) => {
              const s = slots[i]
              return s.kind === 'fig' ? s.figure.name_ko : ''
            })
            return (
              <li
                key={row.key}
                className={`grl-fold${isAhead(row.idxs[0]) ? ' is-ahead' : ''}`}
                style={eraStyle(first.era)}
              >
                <button
                  type="button"
                  className="grl-pill"
                  onClick={() => setOpenFolds((prev) => new Set(prev).add(row.key))}
                  aria-label={`${names.length}대 펼치기`}
                >
                  + {names.length}대 더 · {names.join(' · ')}
                </button>
              </li>
            )
          }
          return <Fragment key={row.key}>{renderFig(row.idx, isLast)}</Fragment>
        })}
      </ol>

      <div className="grl-end">
        <span>{arrived ? '종착역 도착' : `종착역 · ${totalGen}대`}</span>
        <b>예수 그리스도</b>
        <span>아담에서 4,000년, 약속이 도착했어요 · 갈라디아서 4:4</span>
      </div>
    </div>
  )
}

export default GenealogyTree
