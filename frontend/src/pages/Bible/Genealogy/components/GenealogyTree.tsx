import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
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
}

interface TreeDatum {
  slug: string
  figure: BibleFigureSummary
  children?: TreeDatum[]
  spouses: BibleFigureSummary[]
}

const NODE_WIDTH = 140
const NODE_HEIGHT = 64
const V_GAP = 110

/**
 * 메시아 직계 라인을 수직 트리로 그린다.
 * - children: father 관계 우선, 없으면 mother
 * - spouses: 각 노드의 부부 관계는 별도 배지로 노드 우측에 표시
 * - 안개 효과: 비로그인 사용자에게는 균등 표시, 로그인 사용자에게는
 *   key_verses 진도에 비례해 opacity 적용
 */
export const GenealogyTree = ({
  nodes,
  links,
  readingProgress,
  selectedSlug,
  onSelect,
  isLoggedIn,
}: GenealogyTreeProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gRef = useRef<SVGGElement | null>(null)

  // 트리 + 부부 관계 인덱스 빌드
  const { root, spouseMap } = useMemo(() => {
    const nodeBySlug = new Map<string, BibleFigureSummary>(
      nodes.map((n) => [n.slug, n]),
    )

    // 자녀별 부모 결정 (father 우선)
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

    // 부부 관계 (양방향 인덱싱)
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

    // 트리 노드 빌드
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
        // spouse 중 자기 자신이 부모로 등록되지 않은(=트리 외부의) 사람만 표시
        spouses: (sm.get(slug) || []).filter((s) => !parentOf.has(s.slug) || parentOf.get(s.slug) === undefined),
      }
    }

    // 루트 후보: 부모가 없는 노드 (보통 'adam')
    const rootSlug = nodes.find((n) => !parentOf.has(n.slug) && n.is_messianic_line)?.slug
      || nodes.find((n) => !parentOf.has(n.slug))?.slug
      || nodes[0]?.slug

    const visited = new Set<string>()
    const tree = rootSlug ? buildNode(rootSlug, visited) : null

    return { root: tree, spouseMap: sm }
  }, [nodes, links])

  useEffect(() => {
    if (!root || !svgRef.current || !gRef.current) return
    const svg = d3.select(svgRef.current)
    const g = d3.select(gRef.current)

    // 기존 내용 제거
    g.selectAll('*').remove()

    const hierarchy = d3.hierarchy<TreeDatum>(root)
    const treeLayout = d3.tree<TreeDatum>().nodeSize([NODE_WIDTH + 30, V_GAP])
    const laidOut = treeLayout(hierarchy)

    // 좌표 정규화: 트리의 x 범위를 가운데 정렬용으로 추출
    const allNodes = laidOut.descendants()
    const xs = allNodes.map((n) => n.x)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const treeWidth = maxX - minX + NODE_WIDTH
    const treeHeight = (hierarchy.height + 1) * V_GAP + 40

    // viewBox 동적 설정 (좌측 여백 50)
    const viewBoxWidth = Math.max(treeWidth + 100, 400)
    const viewBoxHeight = treeHeight + 80

    svg.attr('viewBox', `${minX - 50} -40 ${viewBoxWidth} ${viewBoxHeight}`)

    // 링크 그리기
    const linkGen = d3
      .linkVertical<d3.HierarchyPointLink<TreeDatum>, d3.HierarchyPointNode<TreeDatum>>()
      .x((d) => d.x)
      .y((d) => d.y)

    g.append('g')
      .attr('class', 'links')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(laidOut.links() as d3.HierarchyPointLink<TreeDatum>[])
      .join('path')
      .attr('d', (d) => linkGen(d) as string)

    // 노드 그룹
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

    // 카드 배경 — 안개 효과
    nodeG
      .append('rect')
      .attr('x', -NODE_WIDTH / 2)
      .attr('y', -NODE_HEIGHT / 2)
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('fill', (d) => {
        const fig = d.data.figure
        if (fig.slug === 'jesus_christ') return '#fef3c7' // amber-100
        if (fig.role?.includes('왕')) return '#dbeafe' // blue-100
        if (fig.role?.includes('선지자')) return '#ede9fe' // violet-100
        if (fig.role?.includes('제사장')) return '#fce7f3' // pink-100
        return '#f3f4f6' // gray-100
      })
      .attr('stroke', (d) => (d.data.slug === selectedSlug ? '#0095f6' : '#d1d5db'))
      .attr('stroke-width', (d) => (d.data.slug === selectedSlug ? 3 : 1.5))
      .attr('opacity', (d) => {
        if (!isLoggedIn) return 1
        const p = readingProgress[d.data.slug] ?? 0
        return 0.3 + 0.7 * p
      })
      .style('filter', (d) => {
        if (!isLoggedIn) return null
        const p = readingProgress[d.data.slug] ?? 0
        if (p === 0) return 'blur(1px)'
        return null
      })

    // 이름
    nodeG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -2)
      .attr('font-size', 15)
      .attr('font-weight', 600)
      .attr('fill', '#111827')
      .attr('pointer-events', 'none')
      .text((d) => d.data.figure.name_ko)

    // 역할 라벨
    nodeG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 16)
      .attr('font-size', 11)
      .attr('fill', '#6b7280')
      .attr('pointer-events', 'none')
      .text((d) => d.data.figure.role || d.data.figure.era || '')

    // 메시아 라인 강조 점
    nodeG
      .filter((d) => d.data.figure.is_messianic_line)
      .append('circle')
      .attr('cx', NODE_WIDTH / 2 - 10)
      .attr('cy', -NODE_HEIGHT / 2 + 10)
      .attr('r', 4)
      .attr('fill', '#f59e0b')

    // 배우자(여인들) 옆에 작은 배지로 표시
    nodeG.each(function (d) {
      const spouses = d.data.spouses
      if (!spouses || spouses.length === 0) return
      const sg = d3
        .select(this)
        .append('g')
        .attr('transform', `translate(${NODE_WIDTH / 2 + 8}, 0)`)
      spouses.forEach((sp, i) => {
        const yOffset = i * 26 - ((spouses.length - 1) * 26) / 2
        const label = sp.name_ko
        const labelWidth = Math.max(label.length * 13 + 16, 44)

        sg.append('line')
          .attr('x1', 0)
          .attr('y1', yOffset)
          .attr('x2', 6)
          .attr('y2', yOffset)
          .attr('stroke', '#ec4899')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 2')

        const grp = sg
          .append('g')
          .attr('transform', `translate(${6}, ${yOffset})`)
          .style('cursor', 'pointer')
          .on('click', (event) => {
            event.stopPropagation()
            onSelect(sp.slug)
          })

        grp
          .append('rect')
          .attr('x', 0)
          .attr('y', -10)
          .attr('width', labelWidth)
          .attr('height', 20)
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', '#fce7f3')
          .attr('stroke', sp.slug === selectedSlug ? '#0095f6' : '#f9a8d4')
          .attr('stroke-width', sp.slug === selectedSlug ? 2 : 1)
          .attr('opacity', (() => {
            if (!isLoggedIn) return 1
            const p = readingProgress[sp.slug] ?? 0
            return 0.4 + 0.6 * p
          })())

        grp
          .append('text')
          .attr('x', labelWidth / 2)
          .attr('y', 4)
          .attr('text-anchor', 'middle')
          .attr('font-size', 11)
          .attr('font-weight', 600)
          .attr('fill', '#9d174d')
          .attr('pointer-events', 'none')
          .text(label)
      })
    })

    // zoom/pan
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })

    svg.call(zoomBehavior as any)
    // 초기 transform 리셋
    svg.call(zoomBehavior.transform as any, d3.zoomIdentity)
  }, [root, selectedSlug, readingProgress, isLoggedIn, onSelect, spouseMap])

  if (!root) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-20">
        가계도를 그릴 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="w-full h-[70vh] overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-200">
      <svg ref={svgRef} className="w-full h-full" preserveAspectRatio="xMidYMin meet">
        <g ref={gRef} />
      </svg>
    </div>
  )
}

export default GenealogyTree
