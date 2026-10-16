// 도착한 칸의 이야기 — 양피지 카드(장면 이름·본문 위치·이야기·구절). NarrativeCard 를 대신한다.
import { AnimatePresence, motion } from 'framer-motion'
import type { Tile } from '../../../types/bluemarble'
import { canonicalBookName } from '../../Sermon/utils/sermonMeta'
import BmIcon from '../components/BluemarbleIcons'

const refOf = (t: Tile) => {
  if (!t.bible_book || !t.bible_chapter) return ''
  const v = t.bible_verse_start
    ? t.bible_verse_end && t.bible_verse_end !== t.bible_verse_start
      ? `:${t.bible_verse_start}-${t.bible_verse_end}`
      : `:${t.bible_verse_start}`
    : ''
  return `${canonicalBookName(t.bible_book)} ${t.bible_chapter}${v}`
}

const KICKER = {
  arrival: '새 발자취',
  milestone: '이정표',
  rest: '쉼터',
  finish: '한 바퀴 완주',
} as const

interface Props {
  tile: Tile | null
  verseText?: string | null
  open: boolean
  onClose: () => void
  variant?: keyof typeof KICKER
  scoreDelta?: number
}

export default function StoryCard({ tile, verseText, open, onClose, variant = 'arrival', scoreDelta }: Props) {
  return (
    <AnimatePresence>
      {open && tile && (
        <motion.div className="qj-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className={`qj-scene qj-story is-${variant}`}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={tile.title}
          >
            <div className="qj-scene-head">
              <span className="qj-scene-place">
                {KICKER[variant]}
                {tile.phase ? ` · ${tile.phase}` : ''}
              </span>
              <h3>{tile.title}</h3>
              {refOf(tile) && <p className="qj-story-ref">{refOf(tile)}</p>}
            </div>
            {tile.narrative && <p className="qj-story-text">{tile.narrative}</p>}
            {verseText && (
              <div className="qj-reveal">
                <figure>
                  <blockquote>{verseText}</blockquote>
                </figure>
              </div>
            )}
            {scoreDelta != null && scoreDelta > 0 && <div className="qj-story-score">+{scoreDelta.toLocaleString()}점</div>}
            <button type="button" className="qj-go" onClick={onClose}>
              계속 걷기 <BmIcon name="footprints" size={17} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
