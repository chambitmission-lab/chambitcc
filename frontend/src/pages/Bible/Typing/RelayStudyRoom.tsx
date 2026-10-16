import { useState, type CSSProperties } from 'react'
import artLight from '../../../assets/typing-relay/banner-light.webp'
import artDark from '../../../assets/typing-relay/banner-dark.webp'
import type { TypingCheerKind, TypingRelayDetail, TypingRelayLive } from '../../../api/bibleTyping'
import { chapterUnit } from '../../../utils/bibleLabels'
import { CHEER_LABEL } from './relayShare'
import { Avatar as MemberAvatar } from './RelayRoom'

/**
 * 릴레이 방 = '말씀 독서실'(PC). 세션 화면이 쓰는 조각들:
 * - RoomBanner: 방 이름·장·인원·함께 채운 칸 + 초대·바통·현황 버튼
 * - RoomMembers: 지금 방에 있는 친구(쓰는 절) → 접속하지 않은 친구(채운 칸), 눌러서 응원
 * - RoomFeed: 방 소식 — 칸 채움·바통·응원·풀이 열람이 위로 쌓인다
 *
 * 모바일은 자리가 좁아 기존 RelayLine(카드 위 한 줄)·RelayBoard 를 그대로 쓴다.
 */

type Member = TypingRelayDetail['members'][number]

export interface RoomFeedItem {
  id: number
  /** 소식의 주인공 — 색 점 */
  hue: number | null
  text: string
  /** 언제 일어났는지 — 방에 들어오기 전 일(바통 한마디)은 모르므로 null */
  at: number | null
}

// 배너 삽화 — 원고지 위 연필 바통 이어달리기(docs/typing-relay-banner-bg-prompts.md)
const BANNER_ART = { '--relay-art-light': `url(${artLight})`, '--relay-art-dark': `url(${artDark})` } as CSSProperties

// 가려진 쪽 그림도 미리 디코딩 — 테마 전환 첫 순간에 빈 배너가 비치지 않게
if (typeof Image !== 'undefined') {
  for (const src of [artLight, artDark]) {
    const img = new Image()
    img.src = src
    img.decode?.().catch(() => {})
  }
}

export const RoomBanner = ({
  relay,
  canPass,
  onInvite,
  onPass,
  onOpenRelay,
}: {
  relay: TypingRelayDetail
  canPass: boolean
  onInvite: () => void
  onPass: () => void
  onOpenRelay: () => void
}) => {
  const unit = chapterUnit(relay.book_number)
  return (
    <section className={`bt-studyroom${canPass ? ' has-pass' : ''}`} style={BANNER_ART} aria-label="릴레이 방">
      <span className="bt-studyroom__ic material-icons-round" aria-hidden>
        menu_book
      </span>
      <div className="bt-studyroom__txt">
        <h2>{relay.title}</h2>
        <p>
          {relay.book_name} {relay.chapter}
          {unit} · {relay.members.length}명 참여 · 함께 채운 칸 {relay.done}/{relay.total}
          {relay.completed && ' · 완성!'}
        </p>
      </div>
      <div className="bt-studyroom__actions">
        {canPass && (
          <button type="button" className="is-strong" onClick={onPass}>
            <span className="material-icons-round" aria-hidden>
              send
            </span>
            바통 넘기기
          </button>
        )}
        <button type="button" onClick={onInvite}>
          <span className="material-icons-round" aria-hidden>
            person_add
          </span>
          초대
        </button>
        <button type="button" onClick={onOpenRelay} aria-label="릴레이 현황">
          <span className="material-icons-round" aria-hidden>
            chevron_right
          </span>
        </button>
      </div>
    </section>
  )
}

export const RoomMembers = ({
  relay,
  live,
  hueOf,
  onCheer,
}: {
  relay: TypingRelayDetail
  live: TypingRelayLive[]
  hueOf: Map<number, number>
  onCheer: (to: Member, kind: TypingCheerKind) => void
}) => {
  const [target, setTarget] = useState<number | null>(null)
  const liveAt = new Map(live.map((l) => [l.user_id, l.verse]))
  const label = (verse: number) => relay.verses.find((v) => v.verse === verse)?.label ?? String(verse)
  const others = relay.members
    .filter((m) => !m.is_me)
    .sort((a, b) => Number(liveAt.has(b.user_id)) - Number(liveAt.has(a.user_id)) || b.verses - a.verses)
  const picked = others.find((m) => m.user_id === target)
  return (
    <section className="bt-card bt-tg" aria-label="지금 방에 있는 친구">
      <header className="bt-tg__head">
        <span>지금 방에 있어요</span>
        <em className={liveAt.size ? 'is-live' : ''}>
          <i aria-hidden />
          {liveAt.size ? `${liveAt.size}명 접속` : '모두 쉬는 중'}
        </em>
      </header>
      {others.length === 0 ? (
        <p className="bt-tg__empty">아직 나 혼자예요 · 함께 쓸 친구를 불러 봐요</p>
      ) : (
        <ul className="bt-tg__list">
          {others.map((m) => {
            const at = liveAt.get(m.user_id)
            return (
              <li key={m.user_id}>
                <button
                  type="button"
                  className={`bt-tg__person${target === m.user_id ? ' is-on' : ''}${at === undefined ? ' is-away' : ''}`}
                  onClick={() => setTarget(target === m.user_id ? null : m.user_id)}
                  aria-expanded={target === m.user_id}
                  title="눌러서 응원 보내기"
                >
                  <MemberAvatar m={m} hue={hueOf.get(m.user_id) ?? 0} live={at !== undefined} size={36} />
                  <span className="bt-tg__who">
                    <b>{m.name}</b>
                    <span>
                      {at !== undefined ? `${label(at)}절 쓰는 중` : m.verses ? `${m.verses}칸 채움` : '아직 안 들어왔어요'}
                    </span>
                  </span>
                  <span className="material-icons-round bt-tg__cheer-ic" aria-hidden>
                    volunteer_activism
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {picked && (
        <div className="bt-room-cheers" role="group" aria-label={`${picked.name}님에게 응원`}>
          <span className="bt-room-cheers__to">{picked.name}님에게</span>
          {(Object.keys(CHEER_LABEL) as TypingCheerKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                onCheer(picked, k)
                setTarget(null)
              }}
            >
              {CHEER_LABEL[k]}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

const ago = (at: number, now: number) => {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 60) return '방금'
  const m = Math.round(s / 60)
  return m < 60 ? `${m}분 전` : `${Math.round(m / 60)}시간 전`
}

export const RoomFeed = ({ items, now }: { items: RoomFeedItem[]; now: number }) => (
  <section className="bt-card bt-tg bt-feed" aria-label="방 소식">
    <header className="bt-tg__head">
      <span>방 소식</span>
    </header>
    {items.length === 0 ? (
      <p className="bt-tg__empty">친구가 칸을 채우거나 응원하면 여기 쌓여요</p>
    ) : (
      <ol className="bt-feed__list" aria-live="polite">
        {items.map((it) => (
          <li key={it.id} className={it.hue !== null ? `bt-hue-${it.hue}` : ''}>
            <i aria-hidden />
            <span>{it.text}</span>
            {it.at !== null && <time>{ago(it.at, now)}</time>}
          </li>
        ))}
      </ol>
    )}
  </section>
)
