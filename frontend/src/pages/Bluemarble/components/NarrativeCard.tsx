import { AnimatePresence, motion } from 'framer-motion'
import type { Tile } from '../../../types/bluemarble'

const BOOK_NAMES_KO: Record<number, string> = {
  40: '마태복음',
  41: '마가복음',
  42: '누가복음',
  43: '요한복음',
  44: '사도행전',
}

const formatRef = (tile: Tile): string => {
  if (!tile.bible_book || !tile.bible_chapter) return ''
  const book = BOOK_NAMES_KO[tile.bible_book] ?? `책 ${tile.bible_book}`
  const v = tile.bible_verse_start
    ? tile.bible_verse_end && tile.bible_verse_end !== tile.bible_verse_start
      ? `:${tile.bible_verse_start}-${tile.bible_verse_end}`
      : `:${tile.bible_verse_start}`
    : ''
  return `${book} ${tile.bible_chapter}${v}`
}

interface Props {
  tile: Tile | null
  verseText?: string | null
  open: boolean
  onClose: () => void
  variant?: 'arrival' | 'milestone' | 'rest' | 'finish'
  scoreDelta?: number
}

export default function NarrativeCard({ tile, verseText, open, onClose, variant = 'arrival', scoreDelta }: Props) {
  return (
    <AnimatePresence>
      {open && tile && (
        <motion.div
          className="nc-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`nc-card nc-${variant}`}
            initial={{ y: 80, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 230, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {tile.phase && (
              <div className="nc-phase">{tile.phase}</div>
            )}
            <div className="nc-headline">
              <span className="nc-icon">{tile.icon ?? '·'}</span>
              <h3 className="nc-title">{tile.title}</h3>
            </div>
            {formatRef(tile) && (
              <div className="nc-ref">{formatRef(tile)}</div>
            )}
            {tile.narrative && (
              <p className="nc-narrative">{tile.narrative}</p>
            )}
            {verseText && (
              <blockquote className="nc-verse">
                "{verseText}"
              </blockquote>
            )}
            {scoreDelta != null && scoreDelta > 0 && (
              <div className="nc-score">+{scoreDelta}pt</div>
            )}
            <button type="button" className="nc-continue" onClick={onClose}>
              계속하기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
