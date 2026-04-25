import { motion } from 'framer-motion'
import type { Tile } from '../../../types/bluemarble'
import { type FogState } from '../journeyLayout'

interface Props {
  tile: Tile
  fog: FogState
  isCurrent: boolean
  isNext: boolean
  onClick?: () => void
}

const TYPE_LABEL: Record<string, string> = {
  start: '출발',
  quiz: '발자취',
  bonus: '보너스',
  mission: '미션',
  rest: '쉼터',
  warp: '워프',
  finish: '도착',
  milestone: '이정표',
}

export default function JourneyTile({ tile, fog, isCurrent, isNext, onClick }: Props) {
  const isHidden = fog === 'hidden'
  const isSilhouette = fog === 'silhouette'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`jt ${isCurrent ? 'jt-current' : ''} ${isNext ? 'jt-next' : ''} jt-fog-${fog}`}
      style={{
        ['--tile-color' as string]: isHidden ? '#1e293b' : tile.theme_color,
      }}
      title={isHidden ? '???' : tile.title}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isHidden ? 0.35 : isSilhouette ? 0.55 : 1,
        scale: 1,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={!isHidden ? { scale: 1.06, y: -2 } : undefined}
    >
      <div className="jt-bg" />
      <div className="jt-content">
        {isHidden ? (
          <span className="jt-icon">·</span>
        ) : (
          <>
            <span className="jt-icon">{tile.icon ?? '·'}</span>
            {!isSilhouette && (
              <span className="jt-title">{tile.title}</span>
            )}
            {!isSilhouette && (
              <span className="jt-type">{TYPE_LABEL[tile.tile_type] ?? tile.tile_type}</span>
            )}
          </>
        )}
      </div>
      <div className="jt-pos">{tile.position}</div>
      {isCurrent && (
        <motion.div
          className="jt-ring"
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}
