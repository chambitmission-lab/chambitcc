import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBibleFigureDetail } from '../../../../hooks/useBibleFigure'
import { DONE, computeTrain, totalGenOf, type Route } from '../genealogyRoute'

interface GenealogyHeaderProps {
  /** 가계도·시대순 보기의 메시아 노선 — 지파·제자 보기에선 null */
  route: Route | null
  readingProgress: Record<string, number>
  isLoggedIn: boolean
  /** 시대 노선(역 9칸 안팎)을 그린다 — 가계도 보기만. 시대순은 자기 징검다리가 있어 겹친다 */
  showMetro: boolean
  /** 노선의 시대 칸을 눌렀을 때 — 본문의 그 구간 표지판으로 */
  onJumpEra?: (era: number) => void
  onSelectFigure: (slug: string) => void
  /** route 가 없을 때(지파·제자) 제목 아래 한 줄 */
  description?: ReactNode
  /** 카드 밑변에 붙는 보기 전환·필터·검색 줄 */
  toolbar: ReactNode
}

type EraStatus = 'plain' | 'done' | 'now' | 'todo'

/**
 * /bible/genealogy 상단 — 노선 카드 한 장.
 * 제목 · 한 줄 요약 · 시대 노선(지금 열차 위치) · 다음 역 + 이어 읽기 · 밑변 툴바.
 * 스크롤해 카드가 지나가면 가계도 본문의 얇은 구간 바(grl-bar)가 헤더 아래 나타나 위치를 이어 보여 준다.
 */
export const GenealogyHeader = ({
  route,
  readingProgress,
  isLoggedIn,
  showMetro,
  onJumpEra,
  onSelectFigure,
  description,
  toolbar,
}: GenealogyHeaderProps) => {
  const [helpOpen, setHelpOpen] = useState(false)
  const metroRef = useRef<HTMLDivElement | null>(null)

  const slots = route?.slots ?? null
  const train = useMemo(
    () => (slots ? computeTrain(slots, readingProgress, isLoggedIn) : null),
    [slots, readingProgress, isLoggedIn],
  )
  const arrived = !!train && train.next < 0
  const nextSlot = slots && train && train.next >= 0 ? slots[train.next] : null
  const nextSlug = nextSlot?.kind === 'fig' ? nextSlot.id : null
  const { data: nextDetail } = useBibleFigureDetail(nextSlug)
  const nextVerse = nextDetail?.key_verses?.find((kv) => kv.book_number && kv.chapter)

  /** 시대별 역 수 · 읽은 역 수 · 상태 */
  const stations = useMemo(() => {
    if (!route) return []
    const nextEra = nextSlot ? nextSlot.era : -1
    return route.eras.map((era, k) => {
      const figs = route.slots.filter((s) => s.kind === 'fig' && s.era === k)
      const done = figs.filter((s) => (readingProgress[s.id] ?? 0) >= DONE).length
      let status: EraStatus = 'plain'
      if (train) {
        if (arrived || k < nextEra) status = 'done'
        else if (k === nextEra) status = 'now'
        else status = 'todo'
      }
      return { era, k, figs: figs.length, done, status }
    })
  }, [route, nextSlot, train, arrived, readingProgress])

  // 좁은 화면에선 노선이 가로로 넘친다 — 열자마자 지금 시대가 가운데 오게
  const focusKey = stations.findIndex((s) => s.status === 'now')
  useLayoutEffect(() => {
    const box = metroRef.current
    if (!box || box.scrollWidth <= box.clientWidth + 1) return
    const target = box.querySelector<HTMLElement>(arrived ? '.gh-st:last-child' : '.gh-st.is-now')
    if (!target) return
    box.scrollLeft = Math.max(0, target.offsetLeft - box.clientWidth / 2 + target.offsetWidth / 2)
  }, [focusKey, arrived, showMetro])

  const totalGen = slots ? totalGenOf(slots) : 0
  const nextEraInfo = nextSlot && route ? route.eras[nextSlot.era] : null

  return (
    <header className="gh mb-5">
      <div className="gh-top">
        <div className="min-w-0">
          <p className="gh-eyebrow">Genealogy · 구속사 라인</p>
          <h1 className="gh-title">믿음의 가계도</h1>
          <p className="gh-sum">
            {!route ? (
              description
            ) : !train ? (
              <>아담부터 예수 그리스도까지, 하나님이 친히 보존하신 메시아 약속의 계보예요.</>
            ) : arrived ? (
              <>
                {train.figCount}역을 모두 지나 <b className="is-gold">예수역에 도착</b>했어요
              </>
            ) : (
              <>
                아담역에서 예수역까지 {train.figCount}역 중 <b>{train.doneCount}역</b>을 읽었어요
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          aria-label="보는 법"
          aria-expanded={helpOpen}
          className="gh-icon-btn"
        >
          <span className="material-icons-round" style={{ fontSize: 18 }}>
            help_outline
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {helpOpen && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="gh-help"
          >
            <li>· 노선의 시대 칸을 누르면 그 구간으로 바로 내려가요.</li>
            <li>· 인물을 누르면 생애·관련 구절·가족 관계를 볼 수 있어요.</li>
            <li>· 인물과 연결된 장을 다 읽으면 그 역을 지나요. 아담역부터 이어서 다 읽은 역까지 열차가 내려와요.</li>
            <li>· 가계도 본문의 점선은 성경이 건너뛴 세대예요.</li>
          </motion.ul>
        )}
      </AnimatePresence>

      {route && showMetro && stations.length > 0 && (
        <div ref={metroRef} className="gh-metro">
          <div className="gh-metro__in" style={{ '--n': stations.length } as CSSProperties}>
            {stations.map((st, i) => {
              const isLast = i === stations.length - 1
              const arriveHere = arrived && isLast
              const prev = i > 0 ? stations[i - 1].era.color : st.era.color
              return (
                <button
                  key={st.k}
                  type="button"
                  className={`gh-st is-${st.status}${arriveHere ? ' is-arrive' : ''}`}
                  style={{ '--c': st.era.color, '--prev': prev } as CSSProperties}
                  onClick={() => onJumpEra?.(st.k)}
                  aria-label={`${st.era.label}로 이동`}
                  title={st.era.meta ? `${st.era.label} · ${st.era.meta}` : st.era.label}
                >
                  {st.status === 'now' && (
                    <span className="gh-flag" aria-hidden>
                      <span className="material-icons-round">train</span>지금 여기
                    </span>
                  )}
                  {arriveHere && (
                    <span className="gh-flag is-gold" aria-hidden>
                      <span className="material-icons-round">flag</span>도착
                    </span>
                  )}
                  <span className="gh-dot" aria-hidden>
                    {st.status === 'done' && (
                      <span className="material-icons-round">{arriveHere ? 'star' : 'check'}</span>
                    )}
                  </span>
                  <span className="gh-st__name">{st.era.short}</span>
                  <span className="gh-st__sub">
                    {st.status === 'now' ? `${st.done}/${st.figs}역` : `${st.figs}역`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {route && !isLoggedIn && (
        <div className="gh-next">
          <span className="gh-next__ic is-soft" aria-hidden>
            <span className="material-icons-round">train</span>
          </span>
          <div className="gh-next__body">
            <span className="gh-next__k">내 열차</span>
            <span className="gh-next__v">로그인하면 읽은 만큼 열차가 노선을 따라 달려가요</span>
          </div>
          <Link to="/login" className="gh-btn gh-btn--sub">
            로그인
          </Link>
        </div>
      )}

      {route && train && !arrived && nextSlot?.kind === 'fig' && (
        <div className="gh-next" style={{ '--c': nextEraInfo?.color } as CSSProperties}>
          <span className="gh-next__ic" aria-hidden>
            <span className="material-icons-round">train</span>
          </span>
          <div className="gh-next__body">
            <span className="gh-next__k">다음 역{nextEraInfo ? ` · ${nextEraInfo.label}` : ''}</span>
            <span className="gh-next__v">
              {nextSlot.figure.name_ko}역
              {nextVerse && (
                <em> · {[nextVerse.book_name_ko, `${nextVerse.chapter}장`].filter(Boolean).join(' ')}</em>
              )}
            </span>
          </div>
          <div className="gh-next__acts">
            <button type="button" className="gh-btn gh-btn--sub" onClick={() => onSelectFigure(nextSlot.id)}>
              역 보기
            </button>
            {nextVerse && (
              <Link to={`/bible/${nextVerse.book_number}/${nextVerse.chapter}`} className="gh-btn gh-btn--pri">
                이어 읽기
                <span className="material-icons-round" style={{ fontSize: 17 }}>
                  chevron_right
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {route && arrived && (
        <div className="gh-next is-arrived">
          <span className="gh-next__ic is-gold" aria-hidden>
            <span className="material-icons-round">emoji_events</span>
          </span>
          <div className="gh-next__body">
            <span className="gh-next__k">종착역</span>
            <span className="gh-next__v">아담에서 예수 그리스도까지 {totalGen}대를 모두 지나왔어요</span>
          </div>
        </div>
      )}

      <div className="gh-tb">{toolbar}</div>
    </header>
  )
}

export default GenealogyHeader
