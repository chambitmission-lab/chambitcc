// 수채화 지도 위 한 장(phase)의 발자취 길 — 걸은 칸은 금빛 발자국, 다음 칸은 파란 "걸어가기", 앞은 안개.
import { useEffect, useMemo, useRef } from 'react'
import RabbitAvatar, { type RabbitMood } from '../../../components/rabbit/RabbitAvatar'
import BmIcon, { type BmIconName } from '../components/BluemarbleIcons'
import type { TileType } from '../../../types/bluemarble'
import type { Chapter } from './chapters'

const NODE_GAP = 116
const TOP = 96

const TYPE_ICON: Partial<Record<TileType, BmIconName>> = {
  boss: 'swords',
  milestone: 'flag',
  rest: 'rest',
  finish: 'crown',
  start: 'flag',
  bonus: 'gift',
  warp: 'warp',
}

interface Props {
  chapter: Chapter
  prevChapter?: Chapter
  nextChapter?: Chapter
  position: number
  /** 다음 칸을 열 수 있는지(걸음 남음 + 모달 없음) */
  canWalk: boolean
  /** 풀던 문제가 있으면 다음 칸 버튼이 "이어 풀기"가 된다 */
  hasPending: boolean
  onWalk: () => void
  rabbitStage: number
  rabbitEquipped: Record<string, string>
  rabbitMood: RabbitMood
}

export default function JourneyMap({
  chapter,
  prevChapter,
  nextChapter,
  position,
  canWalk,
  hasPending,
  onWalk,
  rabbitStage,
  rabbitEquipped,
  rabbitMood,
}: Props) {
  const tiles = chapter.tiles
  const nodes = useMemo(
    () =>
      tiles.map((t, i) => ({
        tile: t,
        x: 50 + Math.sin(i * 1.05 + 0.5) * 27,
        y: TOP + i * NODE_GAP,
      })),
    [tiles],
  )
  const height = TOP + tiles.length * NODE_GAP + (nextChapter ? 70 : 20)

  // 걸은 구간은 지금 칸까지 따로 그린 곡선 — non-scaling-stroke 에선 pathLength 비율 대시가 어긋난다
  const doneIdx = tiles.findIndex((t) => t.position === position)
  const [pathD, donePathD] = useMemo(() => {
    const pts = nodes.map((n) => [n.x * 10, n.y] as const)
    const curve = (upto: number) =>
      pts.slice(0, upto + 1).reduce((d, [x, y], i) => {
        if (i === 0) return `M ${x} ${y}`
        const [px, py] = pts[i - 1]
        const my = (py + y) / 2
        return `${d} C ${px} ${my}, ${x} ${my}, ${x} ${y}`
      }, '')
    return [curve(pts.length - 1), doneIdx > 0 ? curve(doneIdx) : '']
  }, [nodes, doneIdx])

  // 지금 칸이 보이게 — window.scrollTo 는 이 앱에서 무력(#root clip)이라 scrollIntoView
  const hereRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    hereRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [chapter.index])

  return (
    <div className="qj-map" style={{ height }}>
      {prevChapter && (
        <div className="qj-chapter-gate is-done">
          <BmIcon name="footprints" size={14} />
          {prevChapter.name} 완주
          {/* 앞 장 끝에 서 있으면(새 장 첫 칸 직전) 토끼는 문 앞에서 기다린다 */}
          {position < chapter.start && (
            <span className="qj-rabbit qj-rabbit--gate" aria-hidden>
              <RabbitAvatar stage={rabbitStage} equipped={rabbitEquipped} mood={rabbitMood} size={50} />
            </span>
          )}
        </div>
      )}

      <svg className="qj-path" viewBox={`0 0 1000 ${height}`} preserveAspectRatio="none" aria-hidden>
        <path d={pathD} className="qj-path-base" />
        {donePathD && <path d={donePathD} className="qj-path-done" />}
      </svg>

      {nodes.map(({ tile, x, y }) => {
        const state = tile.position <= position ? 'done' : tile.position === position + 1 ? 'next' : 'locked'
        const isHere = tile.position === position
        const special = TYPE_ICON[tile.tile_type]
        const label =
          state === 'locked' ? (tile.tile_type === 'boss' ? '보스' : tile.tile_type === 'milestone' ? '이정표' : '') : tile.title
        return (
          <div
            key={tile.id}
            ref={isHere || (position < chapter.start && tile.position === chapter.start) ? hereRef : undefined}
            className={`qj-node is-${state} qj-type-${tile.tile_type}`}
            style={{ top: y, left: `${x}%` }}
          >
            <button
              type="button"
              className="qj-node-disc"
              disabled={state !== 'next' || !canWalk}
              onClick={onWalk}
              aria-label={state === 'next' ? `${tile.title}(으)로 걸어가기` : tile.title}
            >
              {state === 'done' ? (
                <BmIcon name={special ?? 'footprints'} size={24} strokeWidth={1.8} />
              ) : state === 'next' ? (
                <BmIcon name={special ?? 'sparkle'} size={28} strokeWidth={1.9} />
              ) : (
                <BmIcon name={special ?? 'footprints'} size={20} strokeWidth={1.6} />
              )}
            </button>
            {label && <span className="qj-node-label">{label}</span>}
            {state === 'next' && canWalk && <span className="qj-node-cta">{hasPending ? '이어 풀기' : '걸어가기'}</span>}
            {isHere && (
              <span className="qj-rabbit" aria-hidden>
                <RabbitAvatar stage={rabbitStage} equipped={rabbitEquipped} mood={rabbitMood} size={58} />
              </span>
            )}
          </div>
        )
      })}

      {nextChapter && (
        <div className="qj-chapter-gate is-next" style={{ top: height - 46 }}>
          <BmIcon name="scroll" size={14} />
          다음 장 · {nextChapter.name}
        </div>
      )}
    </div>
  )
}
