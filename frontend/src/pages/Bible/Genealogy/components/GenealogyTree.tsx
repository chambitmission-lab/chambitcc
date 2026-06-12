import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import { useTheme } from '../../../../contexts/ThemeContext'
import type {
  BibleFigureSummary,
  GenealogyLink,
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

interface Palette {
  bg: string
  textPrimary: string
  textSecondary: string
  link: string
  selectedStroke: string
  defaultStroke: string
  messianicStroke: string
  messianicGlow: string
  jesusFill: string
  jesusText: string
  messianicFill: string
  defaultFill: string
  spouseFill: string
  spouseStroke: string
  spouseText: string
  spouseLine: string
  roleBadgeFill: string
  roleBadgeText: string
}

const LIGHT: Palette = {
  bg: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  link: '#cbd5e1',
  selectedStroke: '#a855f7',
  defaultStroke: '#e5e7eb',
  messianicStroke: '#c084fc',
  messianicGlow: 'rgba(168,85,247,0.35)',
  jesusFill: 'url(#jesusGradLight)',
  jesusText: '#ffffff',
  messianicFill: '#faf5ff',
  defaultFill: '#f9fafb',
  spouseFill: '#fdf2f8',
  spouseStroke: '#f9a8d4',
  spouseText: '#9d174d',
  spouseLine: '#ec4899',
  roleBadgeFill: '#f3f4f6',
  roleBadgeText: '#6b7280',
}

const DARK: Palette = {
  bg: '#15151d',
  textPrimary: '#f3f4f6',
  textSecondary: 'rgba(255,255,255,0.55)',
  link: 'rgba(255,255,255,0.18)',
  selectedStroke: '#c084fc',
  defaultStroke: 'rgba(255,255,255,0.10)',
  messianicStroke: 'rgba(168,85,247,0.55)',
  messianicGlow: 'rgba(168,85,247,0.5)',
  jesusFill: 'url(#jesusGradDark)',
  jesusText: '#ffffff',
  messianicFill: 'rgba(168,85,247,0.10)',
  defaultFill: '#1c1c26',
  spouseFill: 'rgba(236,72,153,0.10)',
  spouseStroke: 'rgba(236,72,153,0.55)',
  spouseText: '#f9a8d4',
  spouseLine: '#ec4899',
  roleBadgeFill: 'rgba(255,255,255,0.06)',
  roleBadgeText: 'rgba(255,255,255,0.6)',
}

const NODE_WIDTH = 148
const NODE_HEIGHT = 68
const V_GAP = 116
const SPOUSE_GAP = 10 // 노드 우측과 배우자 pill 사이 간격

// 배우자 pill 너비 (이름 길이 기반). viewBox 계산과 렌더링이 동일 값을 쓰도록 공유
const spouseLabelWidth = (name: string) => Math.max(name.length * 13 + 18, 46)

const roleLabel = (figure: BibleFigureSummary): string | null => {
  if (figure.slug === 'jesus_christ') return null
  const r = figure.role || ''
  if (r.includes('왕')) return '왕'
  if (r.includes('선지자')) return '선지자'
  if (r.includes('제사장')) return '제사장'
  if (r.includes('족장')) return '족장'
  if (figure.gender === 'female') return '여인'
  return null
}

/**
 * 메시아 직계 라인 수직 트리.
 * - 다크/라이트 자동 전환
 * - 메시아 직계는 보라 ring + 글로우, 예수는 솔리드 그라데이션
 * - 배우자(여인)는 핑크 pill
 * - highlightSlugs 가 있으면 비매칭 노드 흐리게
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
  const palette = theme === 'dark' ? DARK : LIGHT
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const spineOffsetRef = useRef<number>(0)

  const { root, spouseMap } = useMemo(() => {
    const nodeBySlug = new Map<string, BibleFigureSummary>(
      nodes.map((n) => [n.slug, n]),
    )

    const parentOf = new Map<string, string>()
    for (const link of links) {
      if (link.type === 'father') {
        parentOf.set(link.target, link.source)
      }
    }
    for (const link of links) {
      if (link.type === 'mother' && !parentOf.has(link.target)) {
        parentOf.set(link.target, link.source)
      }
    }

    const sm = new Map<string, BibleFigureSummary[]>()
    const addSpouse = (a: string, b: string) => {
      const aFig = nodeBySlug.get(a)
      const bFig = nodeBySlug.get(b)
      if (!aFig || !bFig) return
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
        spouses: (sm.get(slug) || []).filter(
          (s) => !parentOf.has(s.slug) || parentOf.get(s.slug) === undefined,
        ),
      }
    }

    const rootSlug =
      nodes.find((n) => !parentOf.has(n.slug) && n.is_messianic_line)?.slug ||
      nodes.find((n) => !parentOf.has(n.slug))?.slug ||
      nodes[0]?.slug

    const visited = new Set<string>()
    const tree = rootSlug ? buildNode(rootSlug, visited) : null

    return { root: tree, spouseMap: sm }
  }, [nodes, links])

  useEffect(() => {
    if (!root || !svgRef.current || !gRef.current) return
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    g.selectAll('*').remove()
    svg.selectAll('defs').remove()

    // defs: 그라데이션 + 글로우 필터
    const defs = svg.append('defs')

    const jesusGrad = defs
      .append('linearGradient')
      .attr('id', theme === 'dark' ? 'jesusGradDark' : 'jesusGradLight')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
    jesusGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7')
    jesusGrad.append('stop').attr('offset', '100%').attr('stop-color', '#ec4899')

    const glow = defs
      .append('filter')
      .attr('id', 'messianicGlow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%')
    glow
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '4')
    glow.append('feFlood').attr('flood-color', '#a855f7').attr('flood-opacity', '0.6')
    glow.append('feComposite').attr('in2', 'SourceAlpha').attr('operator', 'in')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    const hierarchy = d3.hierarchy<TreeDatum>(root)
    const treeLayout = d3.tree<TreeDatum>().nodeSize([NODE_WIDTH + 36, V_GAP])
    const laidOut = treeLayout(hierarchy)

    const allNodes = laidOut.descendants()
    const xs = allNodes.map((n) => n.x)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const treeHeight = (hierarchy.height + 1) * V_GAP + 40

    // 배우자 pill 은 노드 우측으로 뻗어나가므로 그 최대 지점을 viewBox 에 반영(안 하면 잘림)
    let maxSpouseRightEdge = 0
    allNodes.forEach((n) => {
      const spouses = n.data.spouses
      if (spouses && spouses.length > 0) {
        const widest = Math.max(...spouses.map((sp) => spouseLabelWidth(sp.name_ko)))
        maxSpouseRightEdge = Math.max(
          maxSpouseRightEdge,
          n.x + NODE_WIDTH / 2 + SPOUSE_GAP + widest,
        )
      }
    })

    // spine(x=0)이 SVG 가로 정중앙에 오도록 viewBox 를 좌우 대칭으로 잡는다.
    // 그래야 좌측 가지가 없는 초반부 체인에서도 메시아 spine 이 화면 중앙에 보인다.
    const PAD = 60
    const rightExtent = Math.max(maxX + NODE_WIDTH / 2, maxSpouseRightEdge)
    const leftExtent = Math.abs(minX) + NODE_WIDTH / 2
    const halfWidth = Math.max(leftExtent, rightExtent) + PAD
    const viewBoxWidth = halfWidth * 2
    const viewBoxStartX = -halfWidth
    const viewBoxHeight = treeHeight + 80

    svg
      .attr('viewBox', `${viewBoxStartX} -40 ${viewBoxWidth} ${viewBoxHeight}`)
      .attr('width', viewBoxWidth)
      .attr('height', viewBoxHeight)
      .style('width', `${viewBoxWidth}px`)
      .style('height', `${viewBoxHeight}px`)
      .style('max-width', 'none')

    // SVG 의 가로 정중앙(= spine x=0) 픽셀 위치 → 컨테이너 가로 스크롤 정렬에 사용
    spineOffsetRef.current = viewBoxWidth / 2

    // 부모/자식 링크 — 카드 중심이 아니라 가장자리(부모 카드 하단 → 자식 카드 상단)에서
    // 시작/종료하도록 직접 그린다. 카드 배경이 반투명이라 라인이 카드 중앙을 관통하면
    // 이름 텍스트 위로 비쳐 보이기 때문.
    g.append('g')
      .attr('class', 'links')
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(laidOut.links() as d3.HierarchyPointLink<TreeDatum>[])
      .join('path')
      .attr('d', (d) => {
        const sx = d.source.x
        const sy = d.source.y + NODE_HEIGHT / 2
        const tx = d.target.x
        const ty = d.target.y - NODE_HEIGHT / 2
        const my = (sy + ty) / 2
        return `M${sx},${sy}C${sx},${my},${tx},${my},${tx},${ty}`
      })
      .attr('stroke', (d) => {
        const targetMessianic = d.target.data.figure.is_messianic_line
        const sourceMessianic = d.source.data.figure.is_messianic_line
        if (targetMessianic && sourceMessianic) {
          return theme === 'dark'
            ? 'rgba(168,85,247,0.45)'
            : 'rgba(168,85,247,0.55)'
        }
        return palette.link
      })
      .attr('stroke-width', (d) => {
        const targetMessianic = d.target.data.figure.is_messianic_line
        const sourceMessianic = d.source.data.figure.is_messianic_line
        return targetMessianic && sourceMessianic ? 2.2 : 1.5
      })

    // 노드
    const nodeG = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g.node')
      .data(allNodes as d3.HierarchyPointNode<TreeDatum>[])
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => onSelect(d.data.slug))

    const dim = (slug: string) => {
      if (!highlightSlugs) return false
      return !highlightSlugs.has(slug)
    }

    nodeG.attr('opacity', (d) => (dim(d.data.slug) ? 0.25 : 1))

    // 카드 — 메시아 라인은 글로우 ring
    nodeG
      .filter((d) => d.data.figure.is_messianic_line && d.data.figure.slug !== 'jesus_christ')
      .append('rect')
      .attr('x', -NODE_WIDTH / 2 - 1)
      .attr('y', -NODE_HEIGHT / 2 - 1)
      .attr('width', NODE_WIDTH + 2)
      .attr('height', NODE_HEIGHT + 2)
      .attr('rx', 14)
      .attr('ry', 14)
      .attr('fill', 'none')
      .attr('stroke', palette.messianicStroke)
      .attr('stroke-width', 1.5)
      .style(
        'filter',
        theme === 'dark' ? 'drop-shadow(0 0 8px rgba(168,85,247,0.35))' : 'none',
      )

    // 카드 배경
    nodeG
      .append('rect')
      .attr('x', -NODE_WIDTH / 2)
      .attr('y', -NODE_HEIGHT / 2)
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 13)
      .attr('ry', 13)
      .attr('fill', (d) => {
        const fig = d.data.figure
        if (fig.slug === 'jesus_christ') return palette.jesusFill
        if (fig.is_messianic_line) return palette.messianicFill
        return palette.defaultFill
      })
      .attr('stroke', (d) => {
        if (d.data.slug === selectedSlug) return palette.selectedStroke
        if (d.data.figure.is_messianic_line) return 'transparent'
        return palette.defaultStroke
      })
      .attr('stroke-width', (d) => (d.data.slug === selectedSlug ? 2.5 : 1))
      .style('filter', (d) =>
        d.data.figure.slug === 'jesus_christ'
          ? 'drop-shadow(0 8px 18px rgba(236,72,153,0.45))'
          : 'none',
      )
      .attr('opacity', (d) => {
        if (!isLoggedIn) return 1
        const p = readingProgress[d.data.slug] ?? 0
        return 0.45 + 0.55 * p
      })

    // 안개 효과 (로그인 + 미통독)
    if (isLoggedIn) {
      nodeG
        .filter((d) => (readingProgress[d.data.slug] ?? 0) === 0)
        .select('rect:last-of-type')
        .style('filter', (d) =>
          d.data.figure.slug === 'jesus_christ'
            ? 'drop-shadow(0 8px 18px rgba(236,72,153,0.45))'
            : 'blur(0.8px)',
        )
    }

    // 이름
    nodeG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -4)
      .attr('font-size', 15)
      .attr('font-weight', 700)
      .attr('letter-spacing', '-0.01em')
      .attr('fill', (d) =>
        d.data.figure.slug === 'jesus_christ'
          ? palette.jesusText
          : palette.textPrimary,
      )
      .attr('pointer-events', 'none')
      .text((d) => d.data.figure.name_ko)

    // 역할 라벨 (예수는 "메시아", 기타는 role 또는 era)
    nodeG.each(function (d) {
      const fig = d.data.figure
      const label = fig.slug === 'jesus_christ' ? '메시아' : fig.role || fig.era || ''
      if (!label) return
      const isJesus = fig.slug === 'jesus_christ'
      d3.select(this)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 14)
        .attr('font-size', 11)
        .attr('font-weight', isJesus ? 600 : 500)
        .attr('fill', isJesus ? 'rgba(255,255,255,0.92)' : palette.textSecondary)
        .attr('pointer-events', 'none')
        .text(label)
    })

    // 역할 배지 (왕/선지자/여인/족장)
    nodeG.each(function (d) {
      const fig = d.data.figure
      const rl = roleLabel(fig)
      if (!rl || fig.is_messianic_line) return
      const charW = 12
      const padding = 8
      const w = rl.length * charW + padding
      const h = 14
      const grp = d3
        .select(this)
        .append('g')
        .attr('transform', `translate(${-w / 2}, ${-NODE_HEIGHT / 2 - 8})`)
      grp
        .append('rect')
        .attr('width', w)
        .attr('height', h)
        .attr('rx', 7)
        .attr('ry', 7)
        .attr('fill', palette.roleBadgeFill)
      grp
        .append('text')
        .attr('x', w / 2)
        .attr('y', h / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('font-size', 9.5)
        .attr('font-weight', 600)
        .attr('fill', palette.roleBadgeText)
        .text(rl)
    })

    // 배우자 핑크 pill
    nodeG.each(function (d) {
      const spouses = d.data.spouses
      if (!spouses || spouses.length === 0) return
      const sg = d3
        .select(this)
        .append('g')
        .attr('transform', `translate(${NODE_WIDTH / 2 + SPOUSE_GAP}, 0)`)
      spouses.forEach((sp, i) => {
        const yOffset = i * 26 - ((spouses.length - 1) * 26) / 2
        const label = sp.name_ko
        const labelWidth = spouseLabelWidth(label)

        sg.append('line')
          .attr('x1', -4)
          .attr('y1', yOffset)
          .attr('x2', 4)
          .attr('y2', yOffset)
          .attr('stroke', palette.spouseLine)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 2')
          .attr('opacity', highlightSlugs && !highlightSlugs.has(sp.slug) ? 0.25 : 0.85)

        const grp = sg
          .append('g')
          .attr('transform', `translate(${4}, ${yOffset})`)
          .style('cursor', 'pointer')
          .attr('opacity', highlightSlugs && !highlightSlugs.has(sp.slug) ? 0.25 : 1)
          .on('click', (event) => {
            event.stopPropagation()
            onSelect(sp.slug)
          })

        grp
          .append('rect')
          .attr('x', 0)
          .attr('y', -11)
          .attr('width', labelWidth)
          .attr('height', 22)
          .attr('rx', 11)
          .attr('ry', 11)
          .attr('fill', palette.spouseFill)
          .attr('stroke', sp.slug === selectedSlug ? palette.selectedStroke : palette.spouseStroke)
          .attr('stroke-width', sp.slug === selectedSlug ? 2 : 1)
          .attr('opacity', (() => {
            if (!isLoggedIn) return 1
            const p = readingProgress[sp.slug] ?? 0
            return 0.45 + 0.55 * p
          })())

        grp
          .append('text')
          .attr('x', labelWidth / 2)
          .attr('y', 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', 11)
          .attr('font-weight', 600)
          .attr('fill', palette.spouseText)
          .attr('pointer-events', 'none')
          .text(label)
      })
    })

    // zoom/pan — 메인 컨테이너 스크롤이 기본
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .filter((event: any) => {
        if (event.type === 'wheel') return event.ctrlKey || event.metaKey
        if (event.type === 'touchstart') {
          return !!event.touches && event.touches.length >= 2
        }
        return !event.button
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoomBehavior as any)
    svg.call(zoomBehavior.transform as any, d3.zoomIdentity)

    // 트리가 컨테이너보다 넓으면 spine(x=0)을 가로 중앙으로 스크롤
    // 내부 flex wrapper 의 px-4 (16px) padding 보정
    if (scrollRef.current) {
      const container = scrollRef.current
      const INNER_PAD = 16
      const target = spineOffsetRef.current + INNER_PAD - container.clientWidth / 2
      container.scrollLeft = Math.max(0, target)
    }
  }, [
    root,
    selectedSlug,
    readingProgress,
    isLoggedIn,
    onSelect,
    spouseMap,
    theme,
    palette,
    highlightSlugs,
  ])

  if (!root) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1c1c26] py-16 text-center text-gray-500 dark:text-white/50 text-[14px]">
        가계도를 그릴 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="w-full max-h-[78vh] overflow-auto rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#15151d] relative"
    >
      <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none bg-gradient-to-br from-white/[0.04] via-transparent to-white/[0.02]" />
      <div className="flex justify-center min-w-min relative py-4 px-4">
        <svg
          ref={svgRef}
          preserveAspectRatio="xMidYMin meet"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <g ref={gRef} />
        </svg>
      </div>
    </div>
  )
}

export default GenealogyTree
