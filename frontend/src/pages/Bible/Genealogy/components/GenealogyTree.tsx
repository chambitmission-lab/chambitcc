import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useTheme } from '../../../../contexts/ThemeContext'
import type { BibleFigureSummary, GenealogyLink } from '../../../../types/bibleFigure'
import {
  FIGURE_HOOK,
  JESUS_SLUG,
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
  /** 별에 포인터가 닿으면 상세를 미리 받아둔다 (클릭 시 즉시 표시) */
  onHover?: (slug: string) => void
  isLoggedIn: boolean
  /** 비어있지 않으면 이 slug 집합에 속하지 않는 노드는 흐리게 표시 */
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
    }
  | { kind: 'gap'; id: string; gap: GenGap; gen: number }

interface Placed {
  slot: Slot
  x: number
  y: number
  /** 라벨이 뻗는 쪽: 1 = 오른쪽, -1 = 왼쪽, 0 = 가운데(예수) */
  side: 1 | -1 | 0
  era?: SkyEra
  headerY?: number
  lineX?: number
}

/* ── 별자리 레이아웃 상수 ─────────────────────────────────────────── */
const TOP = 20
const STEP = 64 // 한 세대 세로 간격 — 같은 쪽 라벨끼리는 2배(128px) 떨어진다
const HEAD = 72 // 시대가 바뀌는 굽이에 더하는 간격
const FINALE_GAP = 44 // 예수 앞 여백
const LABEL_DX = 18 // 별 → 라벨 간격
const EDGE = 10 // 라벨 ↔ 하늘 가장자리

// 4각 반짝임(스파클) 패스
const sparklePath = (r: number) => {
  const c = r * 0.28
  return `M0,${-r} C0,${-c} ${c},0 ${r},0 C${c},0 0,${c} 0,${r} C0,${c} ${-c},0 ${-r},0 C${-c},0 0,${-c} 0,${-r}Z`
}

// 결정적 난수 — 리렌더마다 별무리·굽이가 흔들리지 않게
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/* 테마별 하늘 팔레트(SVG 전용) — 다크: 밤하늘, 라이트: 새벽 하늘(잉크 남색 별). 글자색은 Genealogy.css 토큰 */
interface SkyPalette {
  star: string; starSide: string; starJesus: string
  starShadow: string; jesusShadow: string
  glow: [string, string, string]
  jesusGlow: [string, string, string]
  spine: [string, string, string]
  link: string; flow: string; rays: string; eraMark: string
  matchRing: string; matchFill: string; selectRing: string
  bgStar: string
}
const NIGHT: SkyPalette = {
  star: '#f4f8ff', starSide: '#e6eeff', starJesus: '#fff3c4',
  starShadow: 'drop-shadow(0 0 4px rgba(156,196,255,0.9))', jesusShadow: 'drop-shadow(0 0 10px rgba(255,214,102,0.9))',
  glow: ['#dbe9ff', '#7fb2ff', '#3182f6'],
  jesusGlow: ['#fff7d6', '#ffe08a', '#ffd166'],
  spine: ['rgba(156,196,255,0.35)', 'rgba(143,184,255,0.75)', 'rgba(255,224,138,0.95)'],
  link: 'rgba(255,255,255,0.32)', flow: 'rgba(255,255,255,0.9)', rays: 'rgba(255,224,138,0.5)', eraMark: '#9cc4ff',
  matchRing: 'rgba(156,196,255,0.7)', matchFill: 'rgba(156,196,255,0.10)', selectRing: '#9cc4ff',
  bgStar: '#ffffff',
}
const DAWN: SkyPalette = {
  star: '#1d4ed8', starSide: '#3b5bb5', starJesus: '#f59e0b',
  starShadow: 'drop-shadow(0 0 4px rgba(49,130,246,0.7))', jesusShadow: 'drop-shadow(0 0 10px rgba(245,158,11,0.7))',
  glow: ['#bfdbfe', '#60a5fa', '#3182f6'],
  jesusGlow: ['#fde68a', '#fbbf24', '#f59e0b'],
  spine: ['rgba(49,130,246,0.25)', 'rgba(49,130,246,0.7)', 'rgba(245,158,11,0.95)'],
  link: 'rgba(15,31,77,0.3)', flow: 'rgba(49,130,246,0.95)', rays: 'rgba(245,158,11,0.45)', eraMark: '#3182f6',
  matchRing: 'rgba(49,130,246,0.7)', matchFill: 'rgba(49,130,246,0.10)', selectRing: '#3182f6',
  bgStar: '#7ea6e8',
}

const shortName = (name: string) => name.replace(/\s*\(.*\)\s*$/, '')

/**
 * 메시아 직계 라인 — 별자리(Constellation) 렌더.
 * 데이터는 가지 없는 한 줄기라 트리 대신 시대마다 좌우로 굽이치는 지그재그로 놓는다.
 * 별의 크기·밝기 = 통독 진도, 성경이 건너뛴 세대는 점선 칸, 마태복음 1장의 여인은 분홍 카드.
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
  const { theme } = useTheme()
  const sky = theme === 'dark' ? NIGHT : DAWN
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  /* ── 한 줄기 계보 + 건너뛴 세대 ── */
  const slots = useMemo<Slot[]>(() => {
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
    const seen = new Set<string>()
    let gen = 1
    let cur = rootSlug
    while (cur && !seen.has(cur)) {
      seen.add(cur)
      const figure = bySlug.get(cur)
      if (!figure) break
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
      })
      gen += 1
      const gap = SKY_GAP_AFTER[cur]
      if (gap && next?.slug === gap.until) {
        out.push({ kind: 'gap', id: `gap:${cur}`, gap, gen })
        gen += gap.count
      }
      cur = next?.slug
    }
    return out
  }, [nodes, links])

  // 하늘 폭을 재서 그 폭 안에 굽이를 그린다 — 가로 스크롤 없음
  const hasSlots = slots.length > 0
  useLayoutEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const sync = () => setWidth(Math.round(el.clientWidth))
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [hasSlots])

  /* ── 지그재그 배치: 시대 안에서는 좌우 교대, 시대가 바뀌면 같은 쪽으로 내려와 굽이 머리를 단다 ── */
  const layout = useMemo(() => {
    if (!width || slots.length === 0) return null
    const cx = width / 2
    const amp = Math.min(110, Math.max(34, width * 0.1))
    const placed: Placed[] = []
    let y = 0
    let side: 1 | -1 = -1
    slots.forEach((slot, i) => {
      const isJesus = slot.kind === 'fig' && slot.id === JESUS_SLUG
      const era = isJesus ? undefined : SKY_ERA_START[slot.id]
      if (i === 0) {
        y = TOP + (era ? HEAD : 0)
      } else {
        y += STEP + (era ? HEAD : 0) + (isJesus ? FINALE_GAP : 0)
        if (!era && !isJesus) side = side === 1 ? -1 : 1
      }
      if (isJesus) {
        placed.push({ slot, x: cx, y, side: 0 })
        return
      }
      const rnd = mulberry32(i * 7919 + 11)
      const x = cx + side * amp + (rnd() - 0.5) * amp * 0.3
      const yy = y + (rnd() - 0.5) * 6
      const p: Placed = { slot, x, y: yy, side, era }
      if (era) {
        const headerY = yy - HEAD / 2 - 14
        const prev = placed[placed.length - 1]
        p.headerY = headerY
        p.lineX = prev ? prev.x + ((x - prev.x) * (headerY - prev.y)) / (yy - prev.y) : x
      }
      placed.push(p)
    })
    const last = placed[placed.length - 1]
    const height = last.y + (last.side === 0 ? 190 : 110)
    return { placed, height }
  }, [slots, width])

  const height = layout?.height ?? 0

  /* ── 배경 별무리 — 하늘 크기에 맞춰 뿌린다 ── */
  const bgStars = useMemo(() => {
    if (!width || !height) return []
    const rnd = mulberry32(20260828)
    const count = Math.min(700, Math.round((width * height) / 7000))
    return Array.from({ length: count }, (_, i) => ({
      x: rnd() * width,
      y: rnd() * height,
      r: 0.4 + rnd() * 1.3,
      o: 0.2 + rnd() * 0.55,
      twinkle: i % 5 === 0,
      delay: (rnd() * 4).toFixed(2),
    }))
  }, [width, height])

  // 필터가 바뀌면 첫 매칭 인물(배우자 포함)로 페이지를 데려간다
  const prevHighlightRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!layout || highlightSlugs === prevHighlightRef.current) return
    prevHighlightRef.current = highlightSlugs
    if (!highlightSlugs || highlightSlugs.size === 0) return
    const first = slots.find(
      (s) => s.kind === 'fig' && (highlightSlugs.has(s.id) || s.spouses.some((sp) => highlightSlugs.has(sp.slug))),
    )
    if (!first) return
    canvasRef.current
      ?.querySelector(`[data-slug="${first.id}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlightSlugs, slots, layout])

  if (!hasSlots) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        가계도를 그릴 데이터가 없습니다.
      </div>
    )
  }

  const progressOf = (slug: string) => (isLoggedIn ? Math.min(1, readingProgress[slug] ?? 0) : 1)
  const dimmed = (slug: string) => !!highlightSlugs && !highlightSlugs.has(slug)
  const matched = (slug: string) => !!highlightSlugs && highlightSlugs.has(slug)

  const segmentPath = (a: Placed, b: Placed) => {
    if (b.side === 0) {
      // 예수로 내려오는 마지막 획 — 곡선으로 가운데에 내려앉는다
      const my = (a.y + b.y) / 2
      return `M${a.x},${a.y + 10}C${a.x},${my + 10},${b.x},${my - 10},${b.x},${b.y - 18}`
    }
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    return `M${a.x + ux * 10},${a.y + uy * 10}L${b.x - ux * 10},${b.y - uy * 10}`
  }

  const labelStyle = (p: Placed): CSSProperties => {
    if (p.side === 0) return { left: EDGE, right: EDGE, top: p.y + 36 }
    if (p.side === 1) {
      const left = p.x + LABEL_DX
      return { left, width: width - left - EDGE, top: p.y - 11 }
    }
    const right = p.x - LABEL_DX
    return { right: width - right, width: right - EDGE, top: p.y - 11 }
  }

  const select = (slug: string) => () => onSelect(slug)
  const hover = (slug: string) => () => onHover?.(slug)

  return (
    <div className="gen-sky-wrap w-full rounded-[22px] relative">
      <div className="gen-sky" aria-hidden>
        <div className="gen-sky__nebula gen-sky__nebula--a" />
        <div className="gen-sky__nebula gen-sky__nebula--b" />
        <div className="gen-sky__nebula gen-sky__nebula--c" />
      </div>

      <div className="gsky-legend">
        <span><i className="gsky-legend__star" />메시아 계보</span>
        <span><i className="gsky-legend__woman" />마태복음 1장의 다섯 여인</span>
        <span><i className="gsky-legend__gap" />성경이 건너뛴 세대</span>
        {isLoggedIn && <span className="gsky-legend__hint">밝은 별 = 많이 읽은 인물</span>}
      </div>

      <div ref={canvasRef} className="gsky" style={{ height }}>
        {layout && (
          <>
            <svg className="gsky__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              <defs>
                <radialGradient id="genStarGlow">
                  <stop offset="0%" stopColor={sky.glow[0]} stopOpacity={0.9} />
                  <stop offset="45%" stopColor={sky.glow[1]} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={sky.glow[2]} stopOpacity={0} />
                </radialGradient>
                <radialGradient id="genJesusGlow">
                  <stop offset="0%" stopColor={sky.jesusGlow[0]} stopOpacity={1} />
                  <stop offset="35%" stopColor={sky.jesusGlow[1]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={sky.jesusGlow[2]} stopOpacity={0} />
                </radialGradient>
                <linearGradient id="genSpineGrad" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={height}>
                  <stop offset="0%" stopColor={sky.spine[0]} />
                  <stop offset="80%" stopColor={sky.spine[1]} />
                  <stop offset="100%" stopColor={sky.spine[2]} />
                </linearGradient>
              </defs>

              {/* 배경 별무리 */}
              <g aria-hidden>
                {bgStars.map((s, i) => (
                  <circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill={sky.bgStar}
                    opacity={s.o}
                    className={s.twinkle ? 'gen-twinkle' : undefined}
                    style={s.twinkle ? { animationDelay: `${s.delay}s` } : undefined}
                  />
                ))}
              </g>

              {/* 별자리 선 — 건너뛴 세대 구간은 점선 */}
              <g fill="none" strokeLinecap="round">
                {layout.placed.map((b, i) => {
                  if (i === 0) return null
                  const a = layout.placed[i - 1]
                  const gapped = a.slot.kind === 'gap' || b.slot.kind === 'gap'
                  const d = segmentPath(a, b)
                  const faded = b.slot.kind === 'fig' && dimmed(b.slot.id)
                  return (
                    <g key={b.slot.id} opacity={faded ? 0.3 : 1}>
                      <path
                        d={d}
                        stroke={gapped ? sky.link : 'url(#genSpineGrad)'}
                        strokeWidth={gapped ? 1.2 : 1.6}
                        strokeDasharray={gapped ? '2 5' : undefined}
                      />
                      {!gapped && <path className="gen-flow" d={d} stroke={sky.flow} strokeWidth={1.6} strokeDasharray="2 30" />}
                    </g>
                  )
                })}
              </g>

              {/* 시대 굽이 표식 — 선 위 마름모 + 머리글 쪽으로 짧은 눈금 */}
              {layout.placed.map((p) => {
                if (!p.era || p.headerY === undefined || p.lineX === undefined || p.side === 0) return null
                const inward = -p.side
                return (
                  <g key={`era-${p.slot.id}`} opacity={highlightSlugs ? 0.4 : 1}>
                    <rect
                      x={p.lineX - 3.5}
                      y={p.headerY - 3.5}
                      width={7}
                      height={7}
                      fill={sky.eraMark}
                      transform={`rotate(45 ${p.lineX} ${p.headerY})`}
                    />
                    <line
                      x1={p.lineX + inward * 8}
                      y1={p.headerY}
                      x2={p.lineX + inward * 15}
                      y2={p.headerY}
                      stroke={sky.eraMark}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </g>
                )
              })}

              {/* 별 */}
              {layout.placed.map((p) => {
                const { slot } = p
                if (slot.kind === 'gap') {
                  return (
                    <g key={slot.id} transform={`translate(${p.x},${p.y})`} opacity={highlightSlugs ? 0.3 : 1}>
                      <circle r={8} fill="none" stroke={sky.link} strokeWidth={1.2} strokeDasharray="2 3" />
                      {[-3, 0, 3].map((dx) => (
                        <circle key={dx} cx={dx} r={0.9} fill={sky.link} />
                      ))}
                    </g>
                  )
                }
                const fig = slot.figure
                const isJesus = slot.id === JESUS_SLUG
                const prog = progressOf(slot.id)
                return (
                  <g
                    key={slot.id}
                    className="node"
                    transform={`translate(${p.x},${p.y})`}
                    opacity={dimmed(slot.id) ? 0.15 : 1}
                    style={{ cursor: 'pointer' }}
                    onClick={select(slot.id)}
                    onPointerEnter={hover(slot.id)}
                    onTouchStart={hover(slot.id)}
                  >
                    <circle r={22} fill="transparent" />
                    {matched(slot.id) && (
                      <circle
                        className="gen-match-ring"
                        r={15}
                        fill={sky.matchFill}
                        stroke={sky.matchRing}
                        strokeWidth={1}
                        strokeDasharray="2 3"
                      />
                    )}
                    {slot.id === selectedSlug && (
                      <circle className="gen-select-ring" r={18} fill="none" stroke={sky.selectRing} strokeWidth={1.2} opacity={0.9} />
                    )}
                    {isJesus ? (
                      <>
                        <circle className="gen-halo" r={54} fill="url(#genJesusGlow)" />
                        <g className="gen-rays">
                          {[0, 45, 90, 135].map((a) => (
                            <line
                              key={a}
                              x1={0}
                              y1={-30}
                              x2={0}
                              y2={30}
                              transform={`rotate(${a})`}
                              stroke={sky.rays}
                              strokeWidth={a % 90 === 0 ? 1.2 : 0.6}
                              strokeLinecap="round"
                            />
                          ))}
                        </g>
                      </>
                    ) : (
                      <circle
                        className="gen-star-glow"
                        r={fig.is_messianic_line ? 12 + 16 * prog : 6 + 8 * prog}
                        fill="url(#genStarGlow)"
                        opacity={matched(slot.id) ? 1 : 0.4 + 0.6 * prog}
                      />
                    )}
                    {fig.is_messianic_line ? (
                      <path
                        className="gen-star"
                        d={isJesus ? sparklePath(13) : sparklePath(3.5 + 3.5 * prog)}
                        fill={isJesus ? sky.starJesus : sky.star}
                        opacity={0.65 + 0.35 * prog}
                        style={{ filter: isJesus ? sky.jesusShadow : sky.starShadow }}
                      />
                    ) : (
                      <circle className="gen-star" r={2 + 1.5 * prog} fill={sky.starSide} opacity={0.55 + 0.45 * prog} />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* 시대 머리글 — 선의 안쪽(가운데 쪽)에 붙는다 */}
            {layout.placed.map((p) => {
              if (!p.era || p.headerY === undefined || p.lineX === undefined || p.side === 0) return null
              const style: CSSProperties =
                p.side === 1
                  ? { right: width - (p.lineX - 20), maxWidth: p.lineX - 20 - EDGE, top: p.headerY }
                  : { left: p.lineX + 20, maxWidth: width - p.lineX - 20 - EDGE, top: p.headerY }
              return (
                <div
                  key={`eh-${p.slot.id}`}
                  className={`gsky-era${highlightSlugs ? ' is-dim' : ''}`}
                  data-side={p.side === 1 ? 'r' : 'l'}
                  style={style}
                >
                  <span className="gsky-era__label">{p.era.label}</span>
                  <span className="gsky-era__meta">{p.era.meta}</span>
                </div>
              )
            })}

            {/* 라벨 — 별의 바깥쪽 */}
            {layout.placed.map((p) => {
              const { slot } = p
              const side = p.side === 1 ? 'r' : p.side === -1 ? 'l' : 'c'
              const mark = SKY_MT_MARK[slot.id]

              if (slot.kind === 'gap') {
                return (
                  <div
                    key={`lb-${slot.id}`}
                    className={`gsky-label gsky-gap${highlightSlugs ? ' is-dim' : ''}`}
                    data-side={side}
                    style={labelStyle(p)}
                  >
                    <span className="gsky-gap__count">
                      ⋯ {slot.gap.count}대
                      <span className="gsky-gen">{slot.gen}–{slot.gen + slot.gap.count - 1}대</span>
                      {mark && <span className="gsky-mark">{mark}</span>}
                    </span>
                    <span className="gsky-gap__names">{slot.gap.names}</span>
                    <span className="gsky-gap__names">{slot.gap.ref} · 이 화면엔 별로 넣지 않았어요</span>
                  </div>
                )
              }

              const fig = slot.figure
              const isJesus = slot.id === JESUS_SLUG
              const dim = dimmed(slot.id)
              const role = isJesus ? '메시아 · 약속의 성취' : FIGURE_HOOK[slot.id] ?? fig.role ?? fig.era ?? ''
              const finale = isJesus ? SKY_ERA_START[JESUS_SLUG] : undefined
              return (
                <div
                  key={`lb-${slot.id}`}
                  data-slug={slot.id}
                  className={`gsky-label${isJesus ? ' gsky-finale' : ''}`}
                  data-side={side}
                  style={labelStyle(p)}
                >
                  <button
                    type="button"
                    className={`gsky-name${dim ? ' is-dim' : ''}${slot.id === selectedSlug ? ' is-sel' : ''}`}
                    onClick={select(slot.id)}
                    onPointerEnter={hover(slot.id)}
                  >
                    <span className="gsky-name__text">{fig.name_ko}</span>
                    <span className="gsky-gen">
                      {slot.viaMother ? '母 ' : ''}
                      {slot.gen}대
                    </span>
                    {mark && <span className="gsky-mark">{mark}</span>}
                  </button>
                  {role && <span className={`gsky-role${dim ? ' is-dim' : ''}`}>{role}</span>}
                  {finale && (
                    <span className="gsky-finale__era">
                      {finale.label} · {finale.meta}
                    </span>
                  )}

                  {slot.spouses.length > 0 && (
                    <div className="gsky-pair">
                      {slot.spouses.map((sp) => {
                        const note = MATTHEW_WOMEN[sp.slug]
                        const cls = `${dimmed(sp.slug) ? ' is-dim' : ''}${matched(sp.slug) ? ' is-hit' : ''}${sp.slug === selectedSlug ? ' is-sel' : ''}`
                        return note ? (
                          <button
                            key={sp.slug}
                            type="button"
                            data-slug={sp.slug}
                            className={`gsky-woman${cls}`}
                            onClick={select(sp.slug)}
                            onPointerEnter={hover(sp.slug)}
                          >
                            <span className="gsky-woman__name">{shortName(sp.name_ko)}</span>
                            <span className="gsky-woman__note">{note}</span>
                          </button>
                        ) : (
                          <button
                            key={sp.slug}
                            type="button"
                            data-slug={sp.slug}
                            className={`gsky-spouse${cls}`}
                            onClick={select(sp.slug)}
                            onPointerEnter={hover(sp.slug)}
                          >
                            {shortName(sp.name_ko)}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {slot.branches.length > 0 && (
                    <div className="gsky-pair">
                      {slot.branches.map((b) => (
                        <button
                          key={b.slug}
                          type="button"
                          data-slug={b.slug}
                          className={`gsky-branch${dimmed(b.slug) ? ' is-dim' : ''}`}
                          onClick={select(b.slug)}
                          onPointerEnter={hover(b.slug)}
                        >
                          ↳ {shortName(b.name_ko)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
      <div className="gen-sky__caption">아담에서 예수까지 · 하늘의 별과 같이 (창 15:5)</div>
    </div>
  )
}

export default GenealogyTree
