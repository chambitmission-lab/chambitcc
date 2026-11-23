import { lazy, Suspense, useState } from 'react'
import type { Parable } from '../data/parables'
import ParableVisual from './ParableVisual'
import { hasParableImage } from './parableImages'
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
      {parables.map((p) => {
        const img = hasParableImage(p.id)
        const done = read.has(p.id)
        return (
          <button
            key={p.id}
            type="button"
            className={`prc pb-tone--${p.topic}${img ? ' prc--img' : ''}`}
            onPointerEnter={warmSheet}
            onPointerDown={warmSheet}
            onClick={(e) => {
              e.stopPropagation()
              setOpen(p)
            }}
          >
            {/* 그림이 있으면 왼쪽에 그림 엽서 한 장(16:9 통째로, 자르지 않음).
                40px 정사각 썸네일은 무슨 그림인지 안 읽혔고, 카드 폭 띠는 PC에서 위아래가 잘려 어색했다 */}
            {img && (
              <span className="prc__pic has-img">
                <ParableVisual p={p} />
              </span>
            )}
            <span className="prc__row">
              {!img && (
                <span className="prc__art">
                  <ParableVisual p={p} />
                </span>
              )}
              <span className="prc__body">
                <span className="prc__k">예수님의 비유{done ? ' · 읽음' : ''}</span>
                <span className="prc__t">
                  {p.title} <span className="prc__g">{img ? p.gist : `— ${p.gist}`}</span>
                </span>
              </span>
              {done ? (
                <span className="prc__stamp" aria-label="읽음">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                </span>
              ) : (
                <span className="material-icons-round prc__go" aria-hidden>chevron_right</span>
              )}
            </span>
          </button>
        )
      })}
      {open && (
        <Suspense fallback={null}>
          <ParableSheet parable={open} onClose={() => setOpen(null)} onOpen={setOpen} />
        </Suspense>
      )}
    </>
  )
}

export default ParableReaderCard
