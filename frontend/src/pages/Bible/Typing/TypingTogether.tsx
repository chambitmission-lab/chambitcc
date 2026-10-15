import { useState } from 'react'
import type { TypingChapterPerson, TypingCheerKind } from '../../../api/bibleTyping'
import { CHEER_LABEL, hueOfKey } from './relayShare'

/**
 * 혼자 쓰는 필사 화면의 '함께' 조각 (릴레이 방이 아닐 때)
 * - TogetherPanel: PC 오른쪽 — 지금 이 장을 쓰는 사람(응원) + 소식 한 줄 + 내 이름 숨기기
 * - TogetherStrip: 모바일 카드 위 한 줄 — 얼굴 몇 개 + 소식, 얼굴을 누르면 응원
 * - InviteCard: 친구랑 같이 쓰기 → 이 장으로 릴레이 방을 만든다
 *
 * 익명으로 쓰는 사람은 이름 대신 '익명 성도', 얼굴 대신 회색 원 — 응원은 key 로 받을 수 있다.
 */

// 같은 장 사람에게 보내는 응원은 두 가지만(릴레이 방의 세 가지 중 '아멘'은 절을 다 쓴 친구에게 어울려 뺐다)
const CHEER_KINDS: TypingCheerKind[] = ['pray', 'cheer']

const displayName = (p: TypingChapterPerson) => p.name ?? '익명 성도'

export const PersonAvatar = ({ p, size = 34 }: { p: TypingChapterPerson; size?: number }) => (
  <span
    className={`bt-room-av ${p.name ? `bt-hue-${hueOfKey(p.key)}` : 'bt-tg-av--anon'}`}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
  >
    {p.avatar_url ? (
      <img src={p.avatar_url} alt="" loading="lazy" />
    ) : p.name ? (
      p.name.slice(0, 1)
    ) : (
      <span className="material-icons-round" style={{ fontSize: Math.round(size * 0.55) }}>
        person
      </span>
    )}
    <i className="bt-room-av__dot" aria-hidden />
  </span>
)

const CheerRow = ({
  to,
  onCheer,
  onDone,
}: {
  to: TypingChapterPerson
  onCheer: (to: TypingChapterPerson, kind: TypingCheerKind) => void
  onDone: () => void
}) => (
  <div className="bt-room-cheers" role="group" aria-label={`${displayName(to)}님에게 응원`}>
    <span className="bt-room-cheers__to">{displayName(to)}님에게</span>
    {CHEER_KINDS.map((k) => (
      <button
        key={k}
        type="button"
        onClick={() => {
          onCheer(to, k)
          onDone()
        }}
      >
        {CHEER_LABEL[k]}
      </button>
    ))}
  </div>
)

interface TogetherProps {
  people: TypingChapterPerson[]
  todayWriters: number
  ticker: string | null
  unit: string
  onCheer: (to: TypingChapterPerson, kind: TypingCheerKind) => void
}

export const TogetherPanel = ({
  people,
  todayWriters,
  ticker,
  unit,
  onCheer,
  anon,
  onAnon,
}: TogetherProps & { anon: boolean; onAnon: (v: boolean) => void }) => {
  const [target, setTarget] = useState<string | null>(null)
  const picked = people.find((p) => p.key === target)
  return (
    <section className="bt-card bt-tg" aria-label={`지금 이 ${unit}을 쓰는 사람`}>
      <header className="bt-tg__head">
        <span>지금 이 {unit}을 쓰는 사람</span>
        <em className={people.length ? 'is-live' : ''}>
          <i aria-hidden />
          {people.length ? `${people.length}명` : '나 혼자'}
        </em>
      </header>
      {people.length === 0 ? (
        <p className="bt-tg__empty">
          {todayWriters > 0 ? `오늘 교회에서 ${todayWriters}명이 이 ${unit}을 썼어요` : `오늘 이 ${unit}을 처음 쓰고 있어요`}
        </p>
      ) : (
        <ul className="bt-tg__list">
          {people.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                className={`bt-tg__person${target === p.key ? ' is-on' : ''}`}
                onClick={() => setTarget(target === p.key ? null : p.key)}
                aria-expanded={target === p.key}
                title="눌러서 응원 보내기"
              >
                <PersonAvatar p={p} />
                <span className="bt-tg__who">
                  <b>{displayName(p)}</b>
                  <span>{p.verse}절 쓰는 중</span>
                </span>
                <span className="material-icons-round bt-tg__cheer-ic" aria-hidden>
                  volunteer_activism
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {picked && <CheerRow to={picked} onCheer={onCheer} onDone={() => setTarget(null)} />}
      {(ticker || (people.length > 0 && todayWriters > 0)) && (
        <p className="bt-tg__ticker" aria-live="polite">
          {ticker ?? `오늘 교회에서 ${todayWriters}명이 이 ${unit}을 썼어요`}
        </p>
      )}
      <label className="bt-tg__anon">
        <input type="checkbox" checked={anon} onChange={(e) => onAnon(e.target.checked)} />
        <span>내 이름 숨기고 쓰기</span>
      </label>
    </section>
  )
}

export const TogetherStrip = ({ people, todayWriters, ticker, unit, onCheer }: TogetherProps) => {
  const [target, setTarget] = useState<string | null>(null)
  const picked = people.find((p) => p.key === target)
  const text =
    ticker ??
    (people.length
      ? `${people.length}명이 지금 이 ${unit}을 함께 쓰고 있어요`
      : todayWriters > 0
        ? `오늘 교회에서 ${todayWriters}명이 이 ${unit}을 썼어요`
        : null)
  if (!text) return null
  return (
    <div className="bt-room-line bt-tg-strip">
      <div className="bt-room-line__row">
        <span className={`bt-room-line__pulse${people.length ? ' is-on' : ''}`} aria-hidden />
        <span className="bt-room-line__text" aria-live="polite">
          {text}
        </span>
        <span className="bt-room-line__faces">
          {people.slice(0, 4).map((p) => (
            <button
              key={p.key}
              type="button"
              className={`bt-room-line__face${target === p.key ? ' is-on' : ''}`}
              onClick={() => setTarget(target === p.key ? null : p.key)}
              aria-label={`${displayName(p)}님에게 응원 보내기`}
            >
              <PersonAvatar p={p} size={26} />
            </button>
          ))}
        </span>
      </div>
      {picked && <CheerRow to={picked} onCheer={onCheer} onDone={() => setTarget(null)} />}
    </div>
  )
}

export const InviteCard = ({ unit, busy, onCreate }: { unit: string; busy: boolean; onCreate: () => void }) => (
  <div className="bt-tg-invite">
    <span className="bt-tg-invite__ic material-icons-round" aria-hidden>
      groups
    </span>
    <div className="bt-tg-invite__txt">
      <b>친구랑 같이 쓰기</b>
      <span>이 {unit}을 나눠 쓰고 바통을 넘겨요</span>
    </div>
    <button type="button" onClick={onCreate} disabled={busy}>
      {busy ? '만드는 중…' : '방 만들기'}
    </button>
  </div>
)
