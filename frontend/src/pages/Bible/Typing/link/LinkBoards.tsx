import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LinkBoard, LinkBoardEntry, LinkScope } from '../../../../api/bibleTyping'
import { useLinkBoard, useLinkTeams } from '../../../../hooks/useBibleTyping'
import { formatNumberKo as fmt } from '../../../../utils/formatNumber'
import { linkSfx } from './linkSound'

type Tab = LinkScope | 'dept'

const Avatar = ({ e }: { e: LinkBoardEntry }) =>
  e.avatar_url ? (
    <img className="vl-av" src={e.avatar_url} alt="" loading="lazy" />
  ) : (
    <span className="vl-av" aria-hidden>
      {e.is_me ? '나' : e.name.trim().charAt(0) || '?'}
    </span>
  )

const Row = ({ e, rank, arcade, rowRef, badge, passed }: {
  e: LinkBoardEntry
  rank: number
  arcade: boolean
  rowRef?: (el: HTMLLIElement | null) => void
  badge?: string | null
  passed?: boolean
}) => (
  <li ref={rowRef} className={`${e.is_me ? 'is-me' : ''}${passed ? ' is-passed' : ''}`}>
    <span className="vl-rno">{rank}</span>
    <Avatar e={e} />
    <span className="vl-rnm">
      <b>{e.is_me ? (arcade ? 'YOU' : '나') : e.name}</b>
    </span>
    <span className="vl-rpt">{fmt(e.score)}</span>
    {badge && <span className="vl-climb">{badge}</span>}
  </li>
)

/**
 * 오늘 순위 — 내 줄이 이 판 전 자리에서 시작해 한 칸씩 치고 올라간다(FLIP).
 * board 는 저장 직후 새로 받은 오늘 순위, prevRank 는 저장 전 내 순위(처음이면 맨 아래에서).
 */
const ClimbList = ({ board, prevRank, arcade, onDone }: { board: LinkBoard; prevRank: number | null; arcade: boolean; onDone: (passed: string[]) => void }) => {
  const me = board.entries.find((e) => e.is_me)
  const others = board.entries.filter((e) => !e.is_me)
  const target = me ? board.entries.indexOf(me) : 0
  const start = me ? Math.min(others.length, prevRank ? prevRank - 1 : others.length) : 0
  const [pos, setPos] = useState(Math.max(start, target))
  const [passedId, setPassedId] = useState<number | null>(null)
  const [badge, setBadge] = useState<string | null>(null)
  const rows = useRef(new Map<number, HTMLLIElement>())
  const rects = useRef(new Map<number, number>())
  const passedNames = useRef<string[]>([])

  useEffect(() => {
    if (!me) return
    if (pos <= target) {
      const n = passedNames.current.length
      if (n) setBadge(arcade ? `▲${n}` : `▲ ${n}칸`)
      onDone(passedNames.current)
      return
    }
    const t = window.setTimeout(() => {
      rows.current.forEach((el, id) => rects.current.set(id, el.getBoundingClientRect().top))
      const passed = others[pos - 1]
      passedNames.current.push(passed.name)
      setPassedId(passed.user_id)
      setPos(pos - 1)
      linkSfx.vroom()
    }, pos === start ? 1300 : 560)
    return () => clearTimeout(t)
    // onDone·others 는 이 순위표 동안 바뀌지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  useLayoutEffect(() => {
    rows.current.forEach((el, id) => {
      const old = rects.current.get(id)
      if (old == null) return
      const dy = old - el.getBoundingClientRect().top
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' })
    })
    rects.current.clear()
  }, [pos])

  const list = me ? [...others.slice(0, pos), me, ...others.slice(pos)] : others
  return (
    <ul className="vl-rlist">
      {list.map((e, i) => (
        <Row
          key={e.user_id}
          e={e}
          // 올라가는 동안은 자리 번호, 다 오르면 서버가 준 순위(동점 처리)
          rank={pos <= target ? e.rank : i + 1}
          arcade={arcade}
          passed={e.user_id === passedId}
          badge={e.is_me ? badge : null}
          rowRef={(el) => {
            if (el) rows.current.set(e.user_id, el)
            else rows.current.delete(e.user_id)
          }}
        />
      ))}
    </ul>
  )
}

const PlainList = ({ scope, arcade }: { scope: LinkScope; arcade: boolean }) => {
  const { data, isLoading } = useLinkBoard(scope)
  if (isLoading) return <p className="vl-empty">불러오는 중…</p>
  if (!data || data.entries.length === 0) return <p className="vl-empty">{scope === 'today' ? '오늘 첫 기록의 주인공이 되어 보세요' : '이번 주 첫 기록을 기다려요'}</p>
  return (
    <ul className="vl-rlist">
      {data.entries.map((e) => (
        <Row key={e.user_id} e={e} rank={e.rank} arcade={arcade} />
      ))}
    </ul>
  )
}

const DeptLanes = () => {
  const { data, isLoading } = useLinkTeams()
  const [on, setOn] = useState(false)
  useEffect(() => {
    const r = requestAnimationFrame(() => setOn(true))
    return () => cancelAnimationFrame(r)
  }, [data])
  if (isLoading) return <p className="vl-empty">불러오는 중…</p>
  const teams = data?.teams ?? []
  const max = Math.max(1, ...teams.map((t) => t.score))
  if (!teams.some((t) => t.score > 0)) return <p className="vl-empty">이번 주 부서 점수를 기다려요 · 말씀 리그에서 부서를 고르면 함께 쌓여요</p>
  return (
    <div className="vl-lanes">
      {teams.map((t) => {
        const mine = t.key === data?.me.team_key
        const w = on ? (t.score / max) * 100 : 0
        return (
          <div key={t.key} className={`vl-lane${mine ? ' is-mine' : ''}`}>
            <div className="vl-lane__top">
              <span>
                {t.name}
                {mine ? ' · 우리' : ''}
              </span>
              <span>{fmt(t.score)}</span>
            </div>
            <div className="vl-lane__rail">
              <i style={{ width: `${w}%` }} />
              <em style={{ left: `min(${w}%, calc(100% - 10px))` }}>{mine ? '🏃' : '🚶'}</em>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'dept', label: '부서 대항' },
]

/** 결과·시작 화면 순위판 — climb 가 있으면 오늘 탭에서 치고 올라가기부터 */
const LinkBoards = ({ arcade, climb, onPassed }: {
  arcade: boolean
  climb?: { board: LinkBoard; prevRank: number | null } | null
  onPassed?: (names: string[]) => void
}) => {
  const [tab, setTab] = useState<Tab>('today')
  const { data: today } = useLinkBoard('today')
  const title = tab === 'dept' ? '부서 대항 · 이번 주' : tab === 'week' ? '이번 주 순위' : '오늘 순위'
  const sub = tab === 'dept' ? '1인당 평균' : tab === 'today' && (climb?.board ?? today) ? `${(climb?.board ?? today)!.players}명 참여` : ''
  return (
    <section className="vl-board">
      <h3>
        <span>{title}</span>
        <small>{sub}</small>
      </h3>
      <div className="vl-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? 'is-on' : ''}
            onClick={() => {
              linkSfx.click(arcade)
              setTab(t.key)
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'today' && climb ? (
        <ClimbList board={climb.board} prevRank={climb.prevRank} arcade={arcade} onDone={(n) => onPassed?.(n)} />
      ) : tab === 'dept' ? (
        <DeptLanes />
      ) : (
        <PlainList scope={tab} arcade={arcade} />
      )}
    </section>
  )
}

export default LinkBoards
