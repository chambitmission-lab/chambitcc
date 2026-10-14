import { useMemo, useState } from 'react'
import type { TypingRelayDetail, TypingRelayLive } from '../../api/bibleTyping'
import TypingPad from '../Bible/Typing/TypingPad'
import RelayCard from '../Bible/Typing/home/RelayCard'
import { BatonSheet, RelayBoard, RelayHandoff, RelayLine, RelayPrevNote } from '../Bible/Typing/RelayRoom'
import { CHEER_LABEL, relayHueMap } from '../Bible/Typing/relayShare'
import '../Bible/Typing/typing.css'

/**
 * /#/dev/typing-relay — 따라쓰기 화면의 릴레이 방(칸 판·소식 띠·앞 칸 한마디·응원·바통 시트).
 * 백엔드·로그인 없이 표본 방(시편 24편, 4명)으로 배치를 본다. 실시간 신호는 버튼으로 흉내 낸다.
 */
const MEMBERS: TypingRelayDetail['members'] = [
  { user_id: 1, name: '나', avatar_url: null, verses: 0, is_me: true, is_owner: false },
  { user_id: 2, name: '지민', avatar_url: null, verses: 2, is_me: false, is_owner: true },
  { user_id: 3, name: '현우', avatar_url: null, verses: 1, is_me: false, is_owner: false },
  { user_id: 4, name: '수빈', avatar_url: null, verses: 1, is_me: false, is_owner: false },
]
const FILLED: Record<number, number> = { 1: 2, 2: 2, 5: 3, 6: 4 }

const makeRelay = (mine: boolean, passed: boolean): TypingRelayDetail => ({
  id: 1,
  title: '청년부 새벽 릴레이',
  book_number: 19,
  book_name: '시편',
  chapter: 24,
  invite_code: 'preview',
  is_owner: false,
  completed: false,
  done: 4 + (mine ? 1 : 0),
  total: 10,
  members: MEMBERS.map((m) => (m.is_me && mine ? { ...m, verses: 1 } : m)),
  verses: Array.from({ length: 10 }, (_, i) => {
    const verse = i + 1
    const uid = verse === 3 && mine ? 1 : FILLED[verse]
    return {
      id: 1000 + verse,
      verse,
      label: String(verse),
      by: uid ? { user_id: uid, name: MEMBERS.find((m) => m.user_id === uid)!.name } : null,
      note: verse === 2 ? { user_id: 2, name: '지민', message: '흔들리는 요즘인데, 터는 하나님이 세우신다는 말씀이 위로가 됐어요' } : null,
    }
  }),
  next_verse: 3,
  live: [],
  // 바통을 넘긴 뒤엔 4절이 현우 차례, 그 전엔 지민이 내게 넘긴 3절이 내 차례
  turn: passed
    ? { user_id: 3, name: '현우', from_user_id: 1, from_name: '나', message: '힘내요!', verse: 4, label: '4' }
    : { user_id: 1, name: '나', from_user_id: 2, from_name: '지민', message: '다음 절 부탁해요', verse: 3, label: '3' },
  baton: passed ? null : { from_user_id: 2, name: '지민', message: '다음 절 부탁해요', verse: 3, label: '3' },
})

// 허브 릴레이 카드 — 쌓였을 때 접힘(진행 중 3개 + 더 보기, 완성은 한 줄)
const HUB_RELAYS = [
  ['느헤미야 1장 릴레이', 0, 11, 1, 0, false],
  ['시편 84장 릴레이', 0, 12, 1, 0, false],
  ['로마서 8장 릴레이', 7, 39, 3, 2, false],
  ['마태복음 5장 릴레이', 0, 48, 1, 0, false],
  ['청년부 새벽 릴레이', 4, 10, 4, 1, false],
  ['고린도전서 13장 릴레이', 13, 13, 3, 6, true],
  ['시편 23장 릴레이', 6, 6, 2, 4, true],
].map(([title, done, total, members, mine, completed], i) => ({
  id: i + 1,
  title: title as string,
  book_number: 1,
  book_name: '',
  chapter: 1,
  done: done as number,
  total: total as number,
  members: members as number,
  my_verses: mine as number,
  completed: completed as boolean,
}))

const TEXT = '여호와의 산에 오를 자가 누구며 그의 거룩한 곳에 설 자가 누구인가'

const TypingRelayRoomPreview = () => {
  const [mine, setMine] = useState(false)
  const [passed, setPassed] = useState(false)
  const [solo, setSolo] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [cheers, setCheers] = useState<{ id: number; text: string; hue: number }[]>([])
  const relay = useMemo(() => {
    const r = makeRelay(mine || passed, passed)
    return solo ? { ...r, members: r.members.filter((m) => m.is_me), baton: null } : r
  }, [mine, passed, solo])
  const hueOf = useMemo(() => relayHueMap(relay.members), [relay])
  const live: TypingRelayLive[] = solo ? [] : [{ user_id: 4, verse: 7 }]
  const ticker = solo
    ? '아직 나 혼자예요 · 함께 쓸 친구를 불러 봐요'
    : passed
      ? '현우님이 4절을 이어 쓸 차례예요'
      : '지민님이 내게 바통을 넘겼어요 · “다음 절 부탁해요”'

  const cheer = () => {
    const id = Date.now()
    setCheers((p) => [...p, { id, text: `현우 · ${CHEER_LABEL.pray}`, hue: hueOf.get(3) ?? 0 }])
    setTimeout(() => setCheers((p) => p.filter((c) => c.id !== id)), 2200)
  }

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <main className="bt-shell bt-shell--session">
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            ['응원 받기', cheer],
            ['바통 시트', () => setSheet(true)],
            [mine ? '내 칸 비우기' : '3절 채움', () => setMine(!mine)],
            [solo ? '친구 있음' : '혼자인 방', () => setSolo(!solo)],
            [passed ? '바통 전' : '바통 넘긴 뒤', () => setPassed(!passed)],
          ].map(([label, fn]) => (
            <button
              key={label as string}
              type="button"
              className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white"
              onClick={fn as () => void}
            >
              {label as string}
            </button>
          ))}
        </div>

        <RelayBoard relay={relay} live={live} hueOf={hueOf} currentVerse={3} onPick={() => undefined} />

        <div className="bt-card bt-active bt-active--room">
          <RelayLine
            relay={relay}
            live={live}
            hueOf={hueOf}
            ticker={ticker}
            canPass={mine}
            onCheer={() => undefined}
            onPass={() => setSheet(true)}
          />
          {passed ? (
            <RelayHandoff
              toName="현우"
              hue={hueOf.get(3) ?? 0}
              label="4"
              onCheer={cheer}
              onOpenRelay={() => undefined}
              onHome={() => undefined}
              onContinue={() => setPassed(false)}
            />
          ) : (
            <>
              <RelayPrevNote relay={relay} verse={3} hueOf={hueOf} />
              <div className="bt-card__label">
                <span className="bt-verse-no bt-room-turn">내 차례 · 3절</span>
              </div>
            </>
          )}
          {cheers.length > 0 && (
            <div className="bt-room-floats">
              {cheers.map((c) => (
                <span key={c.id} className={`bt-room-float bt-hue-${c.hue}`}>
                  {c.text}
                </span>
              ))}
            </div>
          )}
          {!passed && (
          <TypingPad
            key={attempt}
            text={TEXT}
            mode="copy"
            ignorePunct
            autoFocus={false}
            onFinish={() => {
              setMine(true)
              setSheet(true)
              setAttempt((n) => n + 1)
            }}
          />
          )}
        </div>
        <div className="mt-6">
          <RelayCard relays={HUB_RELAYS} />
        </div>
      </main>
      {sheet && (
        <BatonSheet
          relay={relay}
          verseLabel="3"
          liveIds={new Set(live.map((l) => l.user_id))}
          hueOf={hueOf}
          hasNext
          sending={false}
          onPass={(to) => {
            setSheet(false)
            if (to) setPassed(true)
          }}
          onClose={() => setSheet(false)}
        />
      )}
    </div>
  )
}

export default TypingRelayRoomPreview
