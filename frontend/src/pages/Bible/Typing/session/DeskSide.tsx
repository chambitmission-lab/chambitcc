/**
 * PC '필사 책상'의 곁들이 조각들 (TypingSession.tsx 에서 분리)
 *
 * - StageContextButton : 무대 위아래의 앞 절·다음 절 미리보기 버튼
 * - DeskKeyHints       : 키보드 단축키 안내 줄
 * - DeskRingCard       : 장 진행 링(퍼센트)·오늘 절 수
 * - ChapterMap         : 장 지도 — 절 칩 격자. 지금 절 칩이 상자 안에 보이도록 상자만 스크롤한다
 */
import { useEffect, useRef } from 'react'
import type { TypingChapterPerson, TypingMode, TypingStats } from '../../../../api/bibleTyping'
import { hueOfKey } from '../relayShare'
import { RING_C, type SessionVerse } from './sessionModel'

interface StageContextProps {
  verse: SessionVerse
  text: string
  done: boolean
  side: 'prev' | 'next'
  /** 다음 절들은 멀수록 흐리게 — CSS 변수 --bt-fade */
  fade?: number
  onClick: () => void
}

export const StageContextButton = ({ verse, text, done, side, fade, onClick }: StageContextProps) => (
  <button
    type="button"
    className={`bt-stage__ctx bt-stage__ctx--${side}`}
    style={fade !== undefined ? { ['--bt-fade' as string]: fade } : undefined}
    onClick={onClick}
  >
    <span className="bt-verse-no">{verse.label}</span>
    <span className="bt-stage__ctx-text">{text}</span>
    {done && (
      <span className="material-icons-round bt-row__check" aria-label="필사 완료">
        check_circle
      </span>
    )}
  </button>
)

export const DeskKeyHints = ({ mode }: { mode: TypingMode }) => (
  <p className="bt-keys" aria-label="키보드 단축키">
    <span>
      <kbd>Tab</kbd> 다음 절
    </span>
    <span>
      <kbd>Shift</kbd>+<kbd>Tab</kbd> 앞 절
    </span>
    <span>
      <kbd>Esc</kbd> 처음부터
    </span>
    <span>
      <kbd>Enter</kbd> 완료·다시 쓰기
    </span>
    {mode === 'memorize' && (
      <>
        <span>
          <kbd>Alt</kbd>+<kbd>H</kbd> 초성
        </span>
        <span>
          <kbd>Alt</kbd>+<kbd>P</kbd> 잠깐 보기
        </span>
      </>
    )}
  </p>
)

interface RingCardProps {
  total: number
  doneCount: number
  stats: TypingStats | undefined
  goal: number
}

export const DeskRingCard = ({ total, doneCount, stats, goal }: RingCardProps) => {
  const pct = total ? doneCount / total : 0
  return (
    <div className="bt-card bt-ringcard">
      <div className="bt-ring" role="img" aria-label={`${total}절 중 ${doneCount}절 필사`}>
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle className="bt-ring__track" cx="50" cy="50" r="44" />
          <circle className="bt-ring__fill" cx="50" cy="50" r="44" strokeDasharray={RING_C} strokeDashoffset={RING_C * (1 - pct)} />
        </svg>
        <span className="bt-ring__label">
          <b className="brand-text-gradient">{Math.round(pct * 100)}</b>
          <small>%</small>
        </span>
      </div>
      <div className="bt-ringcard__body">
        <span className="bt-ringcard__count">
          {doneCount}/{total}절
        </span>
        <span className="bt-ringcard__sub">{doneCount === total && total > 0 ? '이 장을 다 새겼어요' : `${total - doneCount}절 남았어요`}</span>
        {stats && (
          <span className="bt-ringcard__today">
            오늘 <b>{stats.today_verses}절</b> · 목표 {goal}절
            {stats.current_streak > 0 && <> · {stats.current_streak}일째</>}
          </span>
        )}
      </div>
    </div>
  )
}

interface ChapterMapProps {
  verses: SessionVerse[]
  done: Set<number>
  /** 이번 세션에 새로 쓴 절 — 칩이 반짝인다 */
  fresh: Set<number>
  current: number | null
  mode: TypingMode
  /** 지금 이 장을 쓰는 다른 사람들 — 그 절 칩에 점을 찍는다 */
  people: TypingChapterPerson[]
  onPick: (idx: number) => void
}

export const ChapterMap = ({ verses, done, fresh, current, mode, people, onPick }: ChapterMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  // 지금 절 칩이 지도 상자 안에 보이도록 (페이지는 건드리지 않는다)
  useEffect(() => {
    if (current === null) return
    const box = mapRef.current
    const chip = box?.querySelector<HTMLElement>(`[data-map-idx="${current}"]`)
    if (!box || !chip) return
    const top = chip.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + chip.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({
        top: top - box.clientHeight / 2 + chip.offsetHeight / 2,
        behavior: 'smooth',
      })
    }
  }, [current])
  return (
    <div className="bt-card bt-map">
      <p className="bt-map__title">장 지도</p>
      <div ref={mapRef} className="bt-map__grid">
        {verses.map((v, i) => {
          const p = people.find((pp) => pp.verse === v.verse)
          return (
            <button
              key={v.id}
              type="button"
              data-map-idx={i}
              className={['bt-map__chip', done.has(v.id) ? 'is-done' : '', fresh.has(v.id) ? 'is-fresh' : '', i === current ? 'is-now' : ''].join(' ')}
              onClick={() => onPick(i)}
              title={mode === 'memorize' && !done.has(v.id) ? `${v.label}절` : `${v.label}절 · ${v.text}`}
            >
              {v.label}
              {p ? <i className={`bt-map__dot${p.name ? ` bt-hue-${hueOfKey(p.key)}` : ' is-anon'}`} aria-hidden /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
