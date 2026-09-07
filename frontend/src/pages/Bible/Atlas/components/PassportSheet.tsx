import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'
import { JOURNEYS, uniquePlaceIds } from '../data/journeys'
import { PLACES } from '../data/places'

interface PassportSheetProps {
  visitedIds: Set<string>
  /** 도장을 누르면 그 여정으로 이동 */
  onOpenJourney: (journeyId: string) => void
  onClose: () => void
}

/**
 * 여권 — 모은 도장을 한 장에 모아 본다.
 *
 * 지도여행은 한 번에 다 걷는 화면이 아니라 여러 번 돌아오게 만드는 화면이라,
 * "내가 지금까지 어디를 다녀왔나"를 보여 주는 자리가 필요하다. 칭호 도감
 * (/garden)과 같은 문법 — 빈 칸이 보여야 다음에 갈 곳이 생긴다.
 */
const PassportSheet = ({ visitedIds, onOpenJourney, onClose }: PassportSheetProps) => {
  useModalBackButton(onClose)

  const rows = JOURNEYS.map((journey) => {
    const placeIds = uniquePlaceIds(journey)
    const done = placeIds.filter((id) => visitedIds.has(id)).length
    return { journey, placeIds, done, complete: done === placeIds.length }
  })

  const totalPlaces = new Set(JOURNEYS.flatMap(uniquePlaceIds)).size
  const totalVisited = new Set(
    [...visitedIds].filter((id) => !!PLACES[id])
  ).size
  const completedJourneys = rows.filter((r) => r.complete).length

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 sheet-backdrop sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md sheet-rise max-h-[88vh] bg-background-light dark:bg-card-dark rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3 px-5 pt-5 pb-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/15 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <div className="min-w-0 flex-1">
            <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">지도여행 여권</p>
            <h3 className="text-ink-strong text-[19px] font-bold tracking-[-0.015em]">
              {totalVisited}곳을 다녀왔어요
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 shrink-0"
            aria-label="닫기"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
          <div className="atl-pass__summary">
            <div>
              <dt>방문한 곳</dt>
              <dd>
                {totalVisited} <span>/ {totalPlaces}</span>
              </dd>
            </div>
            <div>
              <dt>완주한 여정</dt>
              <dd>
                {completedJourneys} <span>/ {JOURNEYS.length}</span>
              </dd>
            </div>
          </div>

          <ul className="atl-pass__list">
            {rows.map(({ journey, placeIds, done, complete }) => (
              <li key={journey.id}>
                <button
                  type="button"
                  className={`atl-pass__row${complete ? ' atl-pass__row--done' : ''}`}
                  onClick={() => onOpenJourney(journey.id)}
                  style={complete ? { borderColor: journey.color } : undefined}
                >
                  <span className="atl-pass__head">
                    <span className="atl-pass__dot" style={{ background: journey.color }} />
                    <span className="atl-pass__title">{journey.title}</span>
                    {/* 완주하면 카운트(8/8) 대신 도장을 찍는다 — 둘 다 같은 말이라
                        나란히 두면 자리를 다투기만 한다 */}
                    {complete ? (
                      <span
                        className="atl-pass__seal"
                        style={{ color: journey.color, borderColor: journey.color }}
                      >
                        완주
                      </span>
                    ) : (
                      <span className="atl-pass__count">
                        {done}/{placeIds.length}
                      </span>
                    )}
                  </span>

                  <span className="atl-pass__stamps">
                    {placeIds.map((id) => {
                      const visited = visitedIds.has(id)
                      const place = PLACES[id]
                      return (
                        <span
                          key={id}
                          className={`atl-pass__stamp${visited ? ' atl-pass__stamp--on' : ''}`}
                          style={visited ? { borderColor: journey.color, color: journey.color } : undefined}
                          title={place?.name}
                        >
                          {visited ? (
                            <span className="material-icons-round">check</span>
                          ) : (
                            place?.name.slice(0, 1)
                          )}
                        </span>
                      )
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="atl-pass__hint">
            지도에서 핀을 열면 그 장소의 도장이 찍힙니다.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PassportSheet
