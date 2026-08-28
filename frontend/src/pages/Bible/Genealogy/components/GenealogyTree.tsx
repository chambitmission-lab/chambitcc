import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../../../../contexts/ThemeContext'
import type {
  BibleFigureSummary,
  GenealogyLink,
  RelationshipType,
} from '../../../../types/bibleFigure'

interface GenealogyTreeProps {
  nodes: BibleFigureSummary[]
  links: GenealogyLink[]
  readingProgress: Record<string, number>
  selectedSlug: string | null
  onSelect: (slug: string) => void
  isLoggedIn: boolean
  /** 비어있지 않으면 이 slug 집합에 속하지 않는 노드는 흐리게 표시 */
  highlightSlugs: Set<string> | null
}

interface TreeDatum {
  slug: string
  figure: BibleFigureSummary
  children?: TreeDatum[]
  spouses: BibleFigureSummary[]
}

/* ── 별자리 레이아웃 상수 ─────────────────────────────────────────── */
const COL_W = 210 // 형제 노드 간격 (이름 라벨이 별 우측으로 뻗으므로 넉넉히)
const ROW_H = 104 // 세대 간격
const LABEL_DX = 16 // 별 → 이름 라벨 간격
const SPOUSE_DX = 26 // 별 → 배우자 별 간격(좌측)
const STAR_R_MAX = 7 // 메시아 라인 별 최대 반지름

// 4각 반짝임(스파클) 패스
const sparklePath = (r: number) => {
  const c = r * 0.28
  return `M0,${-r} C0,${-c} ${c},0 ${r},0 C${c},0 0,${c} 0,${r} C0,${c} ${-c},0 ${-r},0 C${-c},0 0,${-c} 0,${-r}Z`
}

// 결정적 난수 — 리렌더마다 별무리가 흔들리지 않게
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const roleText = (fig: BibleFigureSummary) => {
  if (fig.slug === 'jesus_christ') return '메시아 · 약속의 성취'
  return fig.role || fig.era || ''
}

/**
 * 메시아 직계 라인 — 별자리(Constellation) 렌더.
 * 인물은 밤하늘의 별, 메시아 라인은 별자리 선으로 이어진다.
 * 별의 크기·밝기 = 통독 진도, 배경 별무리는 스크롤 패럴랙스.
 */
export const GenealogyTree = ({
  nodes,
  links,
  readingProgress,
  selectedSlug,
  onSelect,
  isLoggedIn,
  highlightSlugs,
}: GenealogyTreeProps) => {
  const { theme } = useTheme()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const skyRef = useRef<HTMLDivElement | null>(null)
  const farRef = useRef<SVGGElement | null>(null)
  const nearRef = useRef<SVGGElement | null>(null)
  const spineOffsetRef = useRef<number>(0)
  const prevHighlightRef = useRef<Set<string> | null>(null)

  const { root, parentLinkType } = useMemo(() => {
    const nodeBySlug = new Map<string, BibleFigureSummary>(nodes.map((n) => [n.slug, n]))

    const parentOf = new Map<string, string>()
    const parentLinkType = new Map<string, RelationshipType>()
    for (const link of links) {
      if (link.type === 'father') {
        parentOf.set(link.target, link.source)
        parentLinkType.set(link.target, 'father')
      }
    }
    for (const link of links) {
      if (link.type === 'mother' && !parentOf.has(link.target)) {
        parentOf.set(link.target, link.source)
        parentLinkType.set(link.target, 'mother')
      }
    }

    const sm = new Map<string, BibleFigureSummary[]>()
    const addSpouse = (a: string, b: string) => {
      const bFig = nodeBySlug.get(b)
      if (!nodeBySlug.has(a) || !bFig) return
      const list = sm.get(a) || []
      if (!list.find((f) => f.slug === b)) list.push(bFig)
      sm.set(a, list)
    }
    for (const link of links) {
      if (link.type === 'spouse') {
        addSpouse(link.source, link.target)
        addSpouse(link.target, link.source)
      }
    }

    const childrenOf = new Map<string, string[]>()
    for (const [child, parent] of parentOf) {
      const arr = childrenOf.get(parent) || []
      arr.push(child)
      childrenOf.set(parent, arr)
    }

    const buildNode = (slug: string, visited: Set<string>): TreeDatum | null => {
      if (visited.has(slug)) return null
      visited.add(slug)
      const fig = nodeBySlug.get(slug)
      if (!fig) return null
      const childSlugs = (childrenOf.get(slug) || []).slice().sort((a, b) => {
        const fa = nodeBySlug.get(a)?.sort_order ?? 0
        const fb = nodeBySlug.get(b)?.sort_order ?? 0
        return fa - fb
      })
      const children = childSlugs
        .map((c) => buildNode(c, visited))
        .filter((c): c is TreeDatum => c !== null)
      return {
        slug,
        figure: fig,
        children: children.length > 0 ? children : undefined,
        spouses: (sm.get(slug) || []).filter((s) => !parentOf.has(s.slug)),
      }
    }

    const rootSlug =
      nodes.find((n) => !parentOf.has(n.slug) && n.is_messianic_line)?.slug ||
      nodes.find((n) => !parentOf.has(n.slug))?.slug ||
      nodes[0]?.slug

    const tree = rootSlug ? buildNode(rootSlug, new Set<string>()) : null
    return { root: tree, parentLinkType }
  }, [nodes, links])

  /* ── 배경 별무리 (패럴랙스 두 겹) ── */
  useEffect(() => {
    const far = farRef.current
    const near = nearRef.current
    if (!far || !near) return
    const rnd = mulberry32(20260828)
    const make = (g: SVGGElement, count: number, rMin: number, rMax: number, twinkleEvery: number) => {
      const sel = d3.select(g)
      sel.selectAll('*').remove()
      for (let i = 0; i < count; i++) {
        const c = sel
          .append('circle')
          .attr('cx', rnd() * 1000)
          .attr('cy', rnd() * 2000)
          .attr('r', rMin + rnd() * (rMax - rMin))
          .attr('fill', '#fff')
          .attr('opacity', 0.25 + rnd() * 0.6)
        if (i % twinkleEvery === 0) {
          c.attr('class', 'gen-twinkle').style('animation-delay', `${(rnd() * 4).toFixed(2)}s`)
        }
      }
    }
    make(far, 160, 0.4, 1.1, 5)
    make(near, 70, 0.9, 1.9, 3)
  }, [])

  // 스크롤 패럴랙스 + 하늘 높이 동기화
  useEffect(() => {
    const container = scrollRef.current
    const sky = skyRef.current
    if (!container || !sky) return
    const sync = () => {
      sky.style.setProperty('--sky-h', `${container.clientHeight}px`)
    }
    const onScroll = () => {
      const y = container.scrollTop
      if (farRef.current) farRef.current.style.transform = `translateY(${(-y * 0.08).toFixed(1)}px)`
      if (nearRef.current) nearRef.current.style.transform = `translateY(${(-y * 0.18).toFixed(1)}px)`
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(container)
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      container.removeEventListener('scroll', onScroll)
    }
  }, [root])

  /* ── 별자리 본체 ── */
  useEffect(() => {
    if (!root || !svgRef.current || !gRef.current) return
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)
    g.selectAll('*').remove()
    svg.selectAll('defs').remove()

    const defs = svg.append('defs')
    const starGlow = defs.append('radialGradient').attr('id', 'genStarGlow')
    starGlow.append('stop').attr('offset', '0%').attr('stop-color', '#dbe9ff').attr('stop-opacity', 0.9)
    starGlow.append('stop').attr('offset', '45%').attr('stop-color', '#7fb2ff').attr('stop-opacity', 0.28)
    starGlow.append('stop').attr('offset', '100%').attr('stop-color', '#3182f6').attr('stop-opacity', 0)

    const jesusGlow = defs.append('radialGradient').attr('id', 'genJesusGlow')
    jesusGlow.append('stop').attr('offset', '0%').attr('stop-color', '#fff7d6').attr('stop-opacity', 1)
    jesusGlow.append('stop').attr('offset', '35%').attr('stop-color', '#ffe08a').attr('stop-opacity', 0.35)
    jesusGlow.append('stop').attr('offset', '100%').attr('stop-color', '#ffd166').attr('stop-opacity', 0)

    const spouseGlow = defs.append('radialGradient').attr('id', 'genSpouseGlow')
    spouseGlow.append('stop').attr('offset', '0%').attr('stop-color', '#ffd6ea').attr('stop-opacity', 0.9)
    spouseGlow.append('stop').attr('offset', '100%').attr('stop-color', '#f472b6').attr('stop-opacity', 0)

    const hierarchy = d3.hierarchy<TreeDatum>(root)
    const laidOut = d3.tree<TreeDatum>().nodeSize([COL_W, ROW_H])(hierarchy)
    const allNodes = laidOut.descendants() as d3.HierarchyPointNode<TreeDatum>[]
    const hierarchyLinks = laidOut.links() as d3.HierarchyPointLink<TreeDatum>[]

    const spineGrad = defs
      .append('linearGradient')
      .attr('id', 'genSpineGrad')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', 0).attr('y2', (hierarchy.height + 1) * ROW_H)
    spineGrad.append('stop').attr('offset', '0%').attr('stop-color', '#9cc4ff').attr('stop-opacity', 0.35)
    spineGrad.append('stop').attr('offset', '80%').attr('stop-color', '#8fb8ff').attr('stop-opacity', 0.75)
    spineGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ffe08a').attr('stop-opacity', 0.95)

    // viewBox — spine(x=0)이 가로 정중앙
    const xs = allNodes.map((n) => n.x)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const LABEL_W = 150
    const SPOUSE_W = 90
    const PAD = 50
    const halfWidth = Math.max(Math.abs(minX) + SPOUSE_W, maxX + LABEL_W) + PAD
    const viewBoxWidth = halfWidth * 2
    const viewBoxStartX = -halfWidth
    const treeHeight = (hierarchy.height + 1) * ROW_H
    const viewBoxHeight = treeHeight + 140

    svg
      .attr('viewBox', `${viewBoxStartX} -70 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr('width', viewBoxWidth)
      .attr('height', viewBoxHeight)
      .style('width', `${viewBoxWidth}px`)
      .style('height', `${viewBoxHeight}px`)
      .style('max-width', 'none')
    spineOffsetRef.current = viewBoxWidth / 2

    const progressOf = (slug: string) => (isLoggedIn ? Math.min(1, readingProgress[slug] ?? 0) : 1)
    const dimmed = (slug: string) => !!highlightSlugs && !highlightSlugs.has(slug)
    const matched = (slug: string) => !!highlightSlugs && highlightSlugs.has(slug)
    const isJesus = (f: BibleFigureSummary) => f.slug === 'jesus_christ'
    const isSpine = (d: d3.HierarchyPointLink<TreeDatum>) =>
      d.source.data.figure.is_messianic_line && d.target.data.figure.is_messianic_line

    /* 별자리 선 — 별 가장자리에서 시작/끝, 살짝만 휘어지게 */
    const linkPath = (d: d3.HierarchyPointLink<TreeDatum>) => {
      const sx = d.source.x, sy = d.source.y + 10
      const tx = d.target.x, ty = d.target.y - 10
      const my = (sy + ty) / 2
      return `M${sx},${sy}C${sx},${my},${tx},${my},${tx},${ty}`
    }
    const linkG = g.append('g').attr('fill', 'none')
    linkG
      .selectAll('path.base')
      .data(hierarchyLinks)
      .join('path')
      .attr('class', 'base')
      .attr('d', linkPath)
      .attr('stroke', (d) => {
        if (isSpine(d)) return 'url(#genSpineGrad)'
        if (parentLinkType.get(d.target.data.slug) === 'mother') return 'rgba(244,114,182,0.45)'
        return 'rgba(255,255,255,0.18)'
      })
      .attr('stroke-width', (d) => (isSpine(d) ? 1.6 : 1))
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', (d) =>
        parentLinkType.get(d.target.data.slug) === 'mother' ? '1 5' : isSpine(d) ? null : '1 4',
      )
      .attr('opacity', (d) => (dimmed(d.target.data.slug) ? 0.25 : 1))

    // spine 위를 타고 내려오는 빛
    linkG
      .selectAll('path.flow')
      .data(hierarchyLinks.filter(isSpine))
      .join('path')
      .attr('class', 'gen-flow')
      .attr('d', linkPath)
      .attr('stroke', 'rgba(255,255,255,0.9)')
      .attr('stroke-width', 1.6)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', '2 30')

    /* 노드 = 별 */
    const nodeG = g
      .append('g')
      .selectAll('g.node')
      .data(allNodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .attr('opacity', (d) => (dimmed(d.data.slug) ? 0.12 : 1))
      .on('click', (_e, d) => onSelect(d.data.slug))

    // 큰 히트 영역 (별이 작아서)
    nodeG.append('circle').attr('r', 22).attr('fill', 'transparent')

    // 필터 매칭 강조 — 은은한 링 + 글로우 부스트
    nodeG
      .filter((d) => matched(d.data.slug))
      .append('circle')
      .attr('class', 'gen-match-ring')
      .attr('r', 15)
      .attr('fill', 'rgba(156,196,255,0.10)')
      .attr('stroke', 'rgba(156,196,255,0.7)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 3')

    // 선택 링
    nodeG
      .filter((d) => d.data.slug === selectedSlug)
      .append('circle')
      .attr('class', 'gen-select-ring')
      .attr('r', 18)
      .attr('fill', 'none')
      .attr('stroke', '#9cc4ff')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.9)

    // 예수: 넓은 금빛 후광 + 빛살
    const jesusG = nodeG.filter((d) => isJesus(d.data.figure))
    jesusG.append('circle').attr('class', 'gen-halo').attr('r', 54).attr('fill', 'url(#genJesusGlow)')
    jesusG
      .append('g')
      .attr('class', 'gen-rays')
      .selectAll('line')
      .data([0, 45, 90, 135])
      .join('line')
      .attr('x1', 0).attr('y1', -30).attr('x2', 0).attr('y2', 30)
      .attr('transform', (a) => `rotate(${a})`)
      .attr('stroke', 'rgba(255,224,138,0.5)')
      .attr('stroke-width', (a) => (a % 90 === 0 ? 1.2 : 0.6))
      .attr('stroke-linecap', 'round')

    // 별 글로우 (진도에 따라 커진다)
    nodeG
      .filter((d) => !isJesus(d.data.figure))
      .append('circle')
      .attr('class', 'gen-star-glow')
      .attr('r', (d) => {
        const p = progressOf(d.data.slug)
        return d.data.figure.is_messianic_line ? 12 + 16 * p : 6 + 8 * p
      })
      .attr('fill', 'url(#genStarGlow)')
      .attr('opacity', (d) => (matched(d.data.slug) ? 1 : 0.4 + 0.6 * progressOf(d.data.slug)))

    // 별 본체 — 메시아 라인은 스파클, 곁가지는 작은 점
    nodeG
      .filter((d) => d.data.figure.is_messianic_line)
      .append('path')
      .attr('class', 'gen-star')
      .attr('d', (d) => {
        if (isJesus(d.data.figure)) return sparklePath(13)
        return sparklePath(3.5 + (STAR_R_MAX - 3.5) * progressOf(d.data.slug))
      })
      .attr('fill', (d) => (isJesus(d.data.figure) ? '#fff3c4' : '#f4f8ff'))
      .attr('opacity', (d) => 0.65 + 0.35 * progressOf(d.data.slug))
      .style('filter', (d) =>
        isJesus(d.data.figure)
          ? 'drop-shadow(0 0 10px rgba(255,214,102,0.9))'
          : 'drop-shadow(0 0 4px rgba(156,196,255,0.9))',
      )
    nodeG
      .filter((d) => !d.data.figure.is_messianic_line)
      .append('circle')
      .attr('class', 'gen-star')
      .attr('r', (d) => 2 + 1.5 * progressOf(d.data.slug))
      .attr('fill', '#e6eeff')
      .attr('opacity', (d) => 0.55 + 0.45 * progressOf(d.data.slug))

    /* 라벨 — 별 우측. 이름 + 세대, 아래에 역할 */
    const label = nodeG.append('g').attr('pointer-events', 'none')
    label
      .append('text')
      .attr('x', (d) => (isJesus(d.data.figure) ? LABEL_DX + 14 : LABEL_DX))
      .attr('y', -2)
      .attr('font-size', (d) => (isJesus(d.data.figure) ? 20 : d.data.figure.is_messianic_line ? 15 : 13.5))
      .attr('font-weight', (d) => (d.data.figure.is_messianic_line ? 700 : 500))
      .attr('letter-spacing', '-0.02em')
      .attr('fill', (d) =>
        isJesus(d.data.figure) ? '#fff3c4' : d.data.figure.is_messianic_line ? '#f4f8ff' : 'rgba(255,255,255,0.72)',
      )
      .attr('opacity', (d) => (d.data.figure.is_messianic_line ? 0.75 + 0.25 * progressOf(d.data.slug) : 0.85))
      .text((d) => d.data.figure.name_ko)

    // 세대 — 이름 뒤 얇은 숫자
    label.each(function (d) {
      const fig = d.data.figure
      if (isJesus(fig)) return
      const nameW = fig.name_ko.length * (fig.is_messianic_line ? 15 : 13.5) * 0.98
      const ltype = parentLinkType.get(fig.slug)
      d3.select(this)
        .append('text')
        .attr('x', LABEL_DX + nameW + 6)
        .attr('y', -2)
        .attr('font-size', 10)
        .attr('font-weight', 500)
        .attr('letter-spacing', '0.04em')
        .attr('fill', ltype === 'mother' ? 'rgba(244,114,182,0.85)' : 'rgba(255,255,255,0.38)')
        .text(`${ltype === 'mother' ? '母 ' : ''}${d.depth + 1}대`)
    })

    label
      .append('text')
      .attr('x', (d) => (isJesus(d.data.figure) ? LABEL_DX + 14 : LABEL_DX))
      .attr('y', 14)
      .attr('font-size', (d) => (isJesus(d.data.figure) ? 12 : 11))
      .attr('font-weight', 400)
      .attr('letter-spacing', '-0.01em')
      .attr('fill', (d) => (isJesus(d.data.figure) ? 'rgba(255,236,180,0.8)' : 'rgba(255,255,255,0.45)'))
      .text((d) => {
        const t = roleText(d.data.figure)
        return t.length > 16 ? `${t.slice(0, 15)}…` : t
      })

    /* 배우자 — 별 좌측의 작은 분홍 별. 노드 그룹 바깥의 별도 레이어(부모 노드가 흐려져도 독립) */
    const spouseLayer = g.append('g')
    allNodes.forEach((d) => {
      const spouses = d.data.spouses
      if (!spouses || spouses.length === 0) return
      spouses.forEach((sp, i) => {
        const y = d.y + i * 24 - ((spouses.length - 1) * 24) / 2
        const x = d.x - SPOUSE_DX
        const dim = dimmed(sp.slug)
        const spMatched = matched(sp.slug)
        spouseLayer
          .append('line')
          .attr('x1', x + 6).attr('y1', y).attr('x2', d.x - 8).attr('y2', d.y)
          .attr('stroke', 'rgba(244,114,182,0.55)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '1 4')
          .attr('stroke-linecap', 'round')
          .attr('opacity', dim ? 0.12 : 1)
        const grp = spouseLayer
          .append('g')
          .attr('transform', `translate(${x},${y})`)
          .style('cursor', 'pointer')
          .attr('opacity', dim ? 0.12 : 1)
          .on('click', (event) => {
            event.stopPropagation()
            onSelect(sp.slug)
          })
        if (spMatched) {
          grp
            .append('circle')
            .attr('class', 'gen-match-ring')
            .attr('r', 11)
            .attr('fill', 'rgba(244,114,182,0.10)')
            .attr('stroke', 'rgba(244,114,182,0.75)')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2 3')
        }
        grp.append('circle').attr('r', 14).attr('fill', 'transparent')
        grp.append('circle').attr('r', (spMatched ? 14 : 7) + 5 * progressOf(sp.slug)).attr('fill', 'url(#genSpouseGlow)')
        grp
          .append('circle')
          .attr('r', (spMatched ? 3.4 : 2.2) + 1.2 * progressOf(sp.slug))
          .attr('fill', '#ffd6ea')
          .attr('stroke', sp.slug === selectedSlug ? '#9cc4ff' : 'none')
          .attr('stroke-width', 1.5)
        grp
          .append('text')
          .attr('x', -10)
          .attr('y', 0)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .attr('font-size', spMatched ? 13.5 : 12)
          .attr('font-weight', spMatched ? 700 : 500)
          .attr('letter-spacing', '-0.01em')
          .attr('fill', spMatched ? '#ffe3f0' : 'rgba(255,214,234,0.85)')
          .attr('pointer-events', 'none')
          .text(sp.name_ko)
      })
    })

    /* zoom/pan — Ctrl+휠·핀치만 */
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .filter((event) => {
        if (event.type === 'wheel') return event.ctrlKey || event.metaKey
        if (event.type === 'touchstart') return !!event.touches && event.touches.length >= 2
        return !event.button
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })
    svg.call(zoomBehavior)
    svg.call(zoomBehavior.transform, d3.zoomIdentity)

    if (scrollRef.current) {
      const container = scrollRef.current
      const target = spineOffsetRef.current + 16 - container.clientWidth / 2
      container.scrollLeft = Math.max(0, target)

      // 필터가 바뀌었으면 첫 매칭 인물(배우자 포함)의 세로 위치로 스크롤
      if (highlightSlugs !== prevHighlightRef.current) {
        prevHighlightRef.current = highlightSlugs
        if (highlightSlugs && highlightSlugs.size > 0) {
          // 트리 상자가 폴드 아래에 있으면 내부만 스크롤돼도 보이지 않는다 — 페이지도 끌어온다
          container.scrollIntoView({ block: 'start', behavior: 'smooth' })
          let firstY: number | null = null
          for (const n of allNodes) {
            const hit = highlightSlugs.has(n.data.slug) || n.data.spouses.some((sp) => highlightSlugs.has(sp.slug))
            if (hit) { firstY = n.y; break }
          }
          if (firstY !== null) {
            // svg 는 viewBox y=-70 부터, 래퍼 py-2(8px) 보정
            const top = firstY + 70 + 8 - container.clientHeight * 0.35
            container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
          }
        } else {
          container.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }
  }, [root, selectedSlug, readingProgress, isLoggedIn, onSelect, parentLinkType, theme, highlightSlugs])

  if (!root) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        가계도를 그릴 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="gen-sky-wrap w-full max-h-[78vh] overflow-auto rounded-[22px] relative">
      {/* 배경 하늘 — sticky 로 화면에 고정, 별무리는 스크롤에 따라 패럴랙스 */}
      <div ref={skyRef} className="gen-sky" aria-hidden>
        <svg className="gen-sky__stars" viewBox="0 0 1000 2000" preserveAspectRatio="xMidYMin slice">
          <g ref={farRef} />
          <g ref={nearRef} />
        </svg>
        <div className="gen-sky__nebula gen-sky__nebula--a" />
        <div className="gen-sky__nebula gen-sky__nebula--b" />
      </div>
      <div className="flex justify-center min-w-min relative py-2 px-4">
        <svg ref={svgRef} preserveAspectRatio="xMidYMin meet" style={{ display: 'block', flexShrink: 0 }}>
          <g ref={gRef} />
        </svg>
      </div>
      <div className="gen-sky__caption">아담에서 예수까지 · 하늘의 별과 같이</div>
    </div>
  )
}

export default GenealogyTree
