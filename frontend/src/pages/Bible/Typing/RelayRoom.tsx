import { useState } from 'react'
import type { TypingCheerKind, TypingRelayDetail, TypingRelayLive } from '../../../api/bibleTyping'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { chapterUnit } from '../../../utils/bibleLabels'
import { CHEER_LABEL } from './relayShare'
import RelayInviteSheet from './RelayInviteSheet'
import './relayRoom.css'

/**
 * 따라쓰기 화면 = 릴레이 방(B안). 세션 화면이 쓰는 조각들:
 * - RelayBoard: 함께 채운 칸 판 — 누가 채웠는지(색), 지금 누가 어느 절을 쓰는 중인지(점선 링)
 * - RelayLine: 지금 쓰는 카드 위 한 줄 — 접속한 친구 얼굴(눌러서 응원) + 실시간 소식
 * - RelayPrevNote: 앞 칸을 쓴 친구가 남긴 한마디
 * - BatonSheet: 내 칸을 다 쓴 순간 — 다음 사람을 지목하고 한마디를 남긴다
 */

type Member = TypingRelayDetail['members'][number]

/** 멤버 얼굴(색 링 + 접속 점) — RelayStudyRoom 도 같은 조각을 쓴다 */
export const Avatar = ({ m, hue, live, size = 28 }: { m: Member; hue: number; live?: boolean; size?: number }) => (
  <span className={`bt-room-av bt-hue-${hue}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
    {m.avatar_url ? <img src={m.avatar_url} alt="" loading="lazy" /> : m.name.slice(0, 1)}
    {live && <i className="bt-room-av__dot" aria-hidden />}
  </span>
)

export const RelayBoard = ({
  relay,
  live,
  hueOf,
  currentVerse,
  onPick,
}: {
  relay: TypingRelayDetail
  live: TypingRelayLive[]
  hueOf: Map<number, number>
  currentVerse: number | null
  onPick: (verse: number) => void
}) => {
  const mine = relay.members.find((m) => m.is_me)?.verses ?? 0
  const typingAt = new Map(live.map((l) => [l.verse, l.user_id]))
  const turn = relay.turn
  return (
    <section className="bt-card bt-room-board" aria-label="함께 채운 칸">
      <div className="bt-room-board__top">
        <span>
          함께 채운 칸 <b>{relay.done}</b>/{relay.total}
        </span>
        <span>
          내 칸 <b>{mine}</b>
        </span>
      </div>
      <div className="bt-room-board__bar" aria-hidden>
        <span style={{ width: `${relay.total ? (relay.done / relay.total) * 100 : 0}%` }} />
      </div>
      <div className="bt-room-cells" role="list">
        {relay.verses.map((v) => {
          const filledHue = v.by ? hueOf.get(v.by.user_id) ?? 0 : null
          const typer = typingAt.get(v.verse)
          const cls = [
            'bt-room-cell',
            filledHue !== null ? `is-filled bt-hue-${filledHue}` : '',
            typer !== undefined && filledHue === null ? `is-typing bt-hue-${hueOf.get(typer) ?? 0}` : '',
            // 바통이 가리키는 칸 — 받은 사람 색 테두리(쓰는 중이면 점선 링이 우선)
            typer === undefined && filledHue === null && turn?.verse === v.verse
              ? `is-turn bt-hue-${hueOf.get(turn.user_id) ?? 0}`
              : '',
            v.verse === currentVerse ? 'is-now' : '',
          ].join(' ')
          const who = v.by ? v.by.name : typer !== undefined ? relay.members.find((m) => m.user_id === typer)?.name : null
          return (
            <button
              key={v.id}
              type="button"
              role="listitem"
              className={cls}
              onClick={() => onPick(v.verse)}
              title={
                v.by
                  ? `${v.label}절 · ${v.by.name}`
                  : who
                    ? `${v.label}절 · ${who}님이 쓰는 중`
                    : turn?.verse === v.verse
                      ? `${v.label}절 · ${turn.name}님 차례`
                      : `${v.label}절 · 빈칸`
              }
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export const RelayLine = ({
  relay,
  live,
  hueOf,
  ticker,
  canPass,
  onCheer,
  onPass,
}: {
  relay: TypingRelayDetail
  live: TypingRelayLive[]
  hueOf: Map<number, number>
  ticker: string
  canPass: boolean
  onCheer: (to: Member, kind: TypingCheerKind) => void
  onPass: () => void
}) => {
  const [target, setTarget] = useState<number | null>(null)
  const liveIds = new Set(live.map((l) => l.user_id))
  // 접속한 친구 먼저, 그다음 들어온 순서
  const others = relay.members
    .filter((m) => !m.is_me)
    .sort((a, b) => Number(liveIds.has(b.user_id)) - Number(liveIds.has(a.user_id)))
  const picked = others.find((m) => m.user_id === target)
  return (
    <div className="bt-room-line">
      <div className="bt-room-line__row">
        <span className={`bt-room-line__pulse${liveIds.size ? ' is-on' : ''}`} aria-hidden />
        <span className="bt-room-line__text" aria-live="polite">
          {ticker}
        </span>
        <span className="bt-room-line__faces">
          {others.slice(0, 4).map((m) => (
            <button
              key={m.user_id}
              type="button"
              className={`bt-room-line__face${target === m.user_id ? ' is-on' : ''}`}
              onClick={() => setTarget(target === m.user_id ? null : m.user_id)}
              aria-label={`${m.name}님에게 응원 보내기`}
            >
              <Avatar m={m} hue={hueOf.get(m.user_id) ?? 0} live={liveIds.has(m.user_id)} size={26} />
            </button>
          ))}
        </span>
        {canPass && (
          <button type="button" className="bt-room-line__pass" onClick={onPass}>
            바통
          </button>
        )}
      </div>
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
    </div>
  )
}

/** 바통을 넘긴 뒤 — 그 칸은 받은 사람 차례. 기다리며 응원하거나, 원하면 내가 이어 쓴다 */
export const RelayHandoff = ({
  toName,
  hue,
  label,
  onCheer,
  onOpenRelay,
  onHome,
  onContinue,
}: {
  toName: string
  hue: number
  /** 받은 사람이 이어 쓸 칸(없으면 null) */
  label: string | null
  onCheer: () => void
  onOpenRelay: () => void
  onHome: () => void
  /** 기다리지 않고 내가 이어 쓰기 — 이어 쓸 칸이 없으면 null */
  onContinue: (() => void) | null
}) => (
  <div className={`bt-room-handoff bt-hue-${hue}`} role="status">
    <span className="bt-baton__torch bt-room-handoff__torch" aria-hidden />
    <p className="bt-room-handoff__title">{toName}님에게 바통을 넘겼어요</p>
    <p className="bt-room-handoff__sub">
      {label ? `${label}절은 이제 ${toName}님 차례예요. 이어 쓰면 여기서 바로 알려 드릴게요.` : `${toName}님이 이어 쓰면 알려 드릴게요.`}
    </p>
    <div className="bt-room-handoff__actions">
      <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={onCheer}>
        {toName}님에게 “{CHEER_LABEL.pray}” 보내기
      </button>
      <div className="bt-room-handoff__row">
        <button type="button" className="bt-btn bt-btn--block" onClick={onOpenRelay}>
          릴레이 현황
        </button>
        <button type="button" className="bt-btn bt-btn--block" onClick={onHome}>
          필사 홈으로
        </button>
      </div>
      {onContinue && (
        <button type="button" className="bt-room-handoff__more" onClick={onContinue}>
          기다리지 않고 내가 이어 쓰기
        </button>
      )}
    </div>
  </div>
)

export const RelayPrevNote = ({
  relay,
  verse,
  hueOf,
}: {
  relay: TypingRelayDetail
  verse: number
  hueOf: Map<number, number>
}) => {
  const idx = relay.verses.findIndex((v) => v.verse === verse)
  const prev = idx > 0 ? relay.verses[idx - 1] : null
  const me = relay.members.find((m) => m.is_me)?.user_id
  if (!prev?.by || prev.by.user_id === me) return null
  const note = prev.note && prev.note.user_id === prev.by.user_id ? prev.note.message : null
  return (
    <div className={`bt-room-prev bt-hue-${hueOf.get(prev.by.user_id) ?? 0}`}>
      <span className="bt-room-prev__who">
        {prev.by.name}님이 {prev.label}절을 쓰고 바통을 넘겼어요
      </span>
      {note && <span className="bt-room-prev__note">“{note}”</span>}
    </div>
  )
}

// 바통과 함께 보낼 수 있는 짧은 말 — 눌러서 넣고 고칠 수 있다
const PRESETS = ['함께 기도해요', '힘내요!', '다음 절 부탁해요', '아멘']

export const BatonSheet = ({
  relay,
  verseLabel,
  liveIds,
  hueOf,
  hasNext,
  sending,
  onPass,
  onClose,
}: {
  relay: TypingRelayDetail
  verseLabel: string
  liveIds: Set<number>
  hueOf: Map<number, number>
  /** 이어 쓸 절이 남았는지 — 없으면 '이어 쓰기' 대신 마무리 */
  hasNext: boolean
  sending: boolean
  onPass: (toUserId: number | null, message: string | null) => void
  onClose: () => void
}) => {
  useModalBackButton(onClose)
  const others = relay.members
    .filter((m) => !m.is_me)
    .sort((a, b) => Number(liveIds.has(b.user_id)) - Number(liveIds.has(a.user_id)))
  const [to, setTo] = useState<number | null>(others[0]?.user_id ?? null)
  const [message, setMessage] = useState('')
  const [inviting, setInviting] = useState(false)
  const toMember = others.find((m) => m.user_id === to)
  const text = message.trim()
  const unit = chapterUnit(relay.book_number)

  return (
    <>
      <div className="bt-summary bt-baton" role="dialog" aria-modal="true" aria-labelledby="bt-baton-title" onClick={onClose}>
        <div className="bt-summary__card bt-baton__card" onClick={(e) => e.stopPropagation()}>
          <span className="bt-baton__torch" aria-hidden />
          <h2 id="bt-baton-title" className="bt-summary__title">
            {verseLabel}절을 이어 썼어요!
          </h2>
          <p className="bt-baton__sub">
            {others.length
              ? '다음 바통은 누구에게 넘길까요? 알림과 함께 내 한마디가 전해져요.'
              : `${relay.book_name} ${relay.chapter}${unit}, 함께 쓸 친구를 불러 볼까요?`}
          </p>

          <div className="bt-baton__friends" role="radiogroup" aria-label="바통 받을 사람">
            {others.map((m) => (
              <button
                key={m.user_id}
                type="button"
                role="radio"
                aria-checked={to === m.user_id}
                className={`bt-baton__friend${to === m.user_id ? ' is-on' : ''}`}
                onClick={() => setTo(to === m.user_id ? null : m.user_id)}
              >
                <Avatar m={m} hue={hueOf.get(m.user_id) ?? 0} live={liveIds.has(m.user_id)} size={46} />
                <span>{m.name}</span>
              </button>
            ))}
            <button type="button" className="bt-baton__friend bt-baton__friend--invite" onClick={() => setInviting(true)}>
              <span className="bt-room-av bt-room-av--add" style={{ width: 46, height: 46 }}>
                <span className="material-icons-round">person_add</span>
              </span>
              <span>초대하기</span>
            </button>
          </div>

          {others.length > 0 && (
            <>
              <div className="bt-baton__presets">
                {PRESETS.map((p) => (
                  <button key={p} type="button" className={text === p ? 'is-on' : ''} onClick={() => setMessage(text === p ? '' : p)}>
                    {p}
                  </button>
                ))}
              </div>
              <input
                className="bt-baton__input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={60}
                placeholder="한마디 남기기 (선택)"
                aria-label="바통과 함께 남길 한마디"
              />
            </>
          )}

          <div className="bt-summary__actions">
            {others.length > 0 ? (
              <button
                type="button"
                className="bt-btn bt-btn--primary bt-btn--block"
                disabled={sending || (!toMember && !text)}
                onClick={() => onPass(toMember?.user_id ?? null, text || null)}
              >
                {sending ? '보내는 중…' : toMember ? `${toMember.name}님에게 바통 넘기기` : text ? '한마디만 남기기' : '받을 사람을 골라 주세요'}
              </button>
            ) : (
              <button type="button" className="bt-btn bt-btn--primary bt-btn--block" onClick={() => setInviting(true)}>
                함께 쓸 친구 초대하기
              </button>
            )}
            <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onClose}>
              {hasNext ? '내가 다음 절도 이어 쓰기' : '닫기'}
            </button>
          </div>
        </div>
      </div>
      {inviting && <RelayInviteSheet relay={relay} onClose={() => setInviting(false)} />}
    </>
  )
}
