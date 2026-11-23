import { lazy, Suspense, useState } from 'react'
import type { Parable } from '../data/parables'
import ParableArt from './ParableArt'
import { useParableRead } from './parableProgress'
import './parables-tone.css'
import './ParableReaderCard.css'

const ParableSheet = lazy(() => import('./ParableSheet'))
const warmSheet = () => void import('./ParableSheet')

/**
 * 읽기 화면 비유 카드 — 복음서 본문에서 비유 핵심 절 바로 위에 끼운다.
 * 누르면 도감과 같은 비유 시트가 올라온다. 읽은 비유엔 점선 도장.
 */
const ParableReaderCard = ({ parables }: { parables: readonly Parable[] }) => {
  const read = useParableRead()
  const [open, setOpen] = useState<Parable | null>(null)
  return (
    <>
      {parables.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`prc pb-tone--${p.topic}`}
          onPointerEnter={warmSheet}
          onPointerDown={warmSheet}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(p)
          }}
        >
          <span className="prc__art">
            <ParableArt kind={p.art} />
          </span>
          <span className="prc__body">
            <span className="prc__k">예수님의 비유{read.has(p.id) ? ' · 읽음' : ''}</span>
            <span className="prc__t">
              {p.title} <span className="prc__g">— {p.gist}</span>
            </span>
          </span>
          {read.has(p.id) ? (
            <span className="prc__stamp" aria-label="읽음">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12l5 5 9-10" />
              </svg>
            </span>
          ) : (
            <span className="material-icons-round prc__go" aria-hidden>chevron_right</span>
          )}
        </button>
      ))}
      {open && (
        <Suspense fallback={null}>
          <ParableSheet parable={open} onClose={() => setOpen(null)} onOpen={setOpen} />
        </Suspense>
      )}
    </>
  )
}

export default ParableReaderCard
