import type { Tile } from '../../../types/bluemarble'
import { getTileSide } from '../boardLayout'

interface Props {
  tile: Tile
  isCurrent: boolean
  isPath?: boolean // 이동 경로 강조
  isLanded?: boolean // 방금 도착한 칸
}

const TYPE_LABEL: Record<string, string> = {
  start: '출발',
  quiz: '문제',
  bonus: '보너스',
  mission: '미션',
  rest: '쉼터',
  warp: '워프',
  finish: '도착',
}

const TYPE_BG: Record<string, string> = {
  start: 'from-amber-300 to-amber-500',
  quiz: 'from-emerald-200 to-emerald-400',
  bonus: 'from-yellow-200 to-amber-300',
  mission: 'from-orange-300 to-rose-400',
  rest: 'from-slate-200 to-slate-300',
  warp: 'from-cyan-300 to-blue-400',
  finish: 'from-pink-300 to-pink-500',
}

export default function BoardTile({ tile, isCurrent, isLanded }: Props) {
  const side = getTileSide(tile.position)
  const isCorner = side.startsWith('corner')

  return (
    <div
      className={`bm-tile bm-tile-${tile.tile_type} bm-side-${side} ${
        isCurrent ? 'bm-tile-current' : ''
      } ${isLanded ? 'bm-tile-landed' : ''} ${isCorner ? 'bm-tile-corner' : ''}`}
      style={{
        ['--tile-color' as string]: tile.theme_color,
      }}
      title={`${tile.title} - ${tile.description ?? ''}`}
    >
      <div className={`bm-tile-bg bg-gradient-to-br ${TYPE_BG[tile.tile_type] ?? 'from-white to-slate-100'}`} />
      <div className="bm-tile-content">
        <div className="bm-tile-icon">{tile.icon ?? '·'}</div>
        <div className="bm-tile-title">{tile.title}</div>
        <div className="bm-tile-type-badge">{TYPE_LABEL[tile.tile_type] ?? tile.tile_type}</div>
      </div>
      <div className="bm-tile-pos">{tile.position}</div>
    </div>
  )
}
