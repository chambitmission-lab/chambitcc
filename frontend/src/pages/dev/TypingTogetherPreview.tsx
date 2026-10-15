import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { GlossaryLineBucket, TypingChapterPerson, TypingRelayDetail, TypingRelayLive } from '../../api/bibleTyping'
import { bibleTypingKeys } from '../../hooks/useBibleTyping'
import TypingPad, { type TypingMark } from '../Bible/Typing/TypingPad'
import TypingGlossary from '../Bible/Typing/TypingGlossary'
import { InviteCard, TogetherPanel, TogetherStrip } from '../Bible/Typing/TypingTogether'
import { RoomBanner, RoomFeed, RoomMembers, type RoomFeedItem } from '../Bible/Typing/RelayStudyRoom'
import { RelayBoard } from '../Bible/Typing/RelayRoom'
import { relayHueMap } from '../Bible/Typing/relayShare'
import { typingSource } from '../Bible/Typing/hangulTyping'
import { isGlossaryReady, loadGlossary, matchGlossary, type GlossaryEntry } from '../Bible/data/bibleGlossary'
import '../Bible/Typing/typing.css'
import '../Bible/Typing/together.css'

/**
 * /#/dev/typing-together — 필사 화면 개편(혼자 쓸 때 + 릴레이 방 독서실)을 백엔드·로그인 없이 본다.
 * 느헤미야 1:11 표본, ?room=1 이면 릴레이 방. 한 줄 메모는 쿼리 캐시에 표본을 심어 보여준다.
 */
const TEXT =
  '주여 구하오니 귀를 기울이사 종의 기도와 주의 이름을 경외하기를 기뻐하는 종들의 기도를 들으시고 오늘 종이 형통하여 이 사람 앞에서 은혜를 입게 하옵소서 하였나니 그 때에 내가 왕의 술 관원이 되었느니라'

const PEOPLE: TypingChapterPerson[] = [
  { key: 'k-haram', user_id: 4, name: '하람', avatar_url: null, verse: 11 },
  { key: 'k-grace', user_id: 5, name: '은혜', avatar_url: null, verse: 6 },
  { key: 'k-anon', user_id: null, name: null, avatar_url: null, verse: 3 },
]

const LINES: Record<string, GlossaryLineBucket> = {
  '술 관원': {
    count: 3,
    lines: [
      { id: 1, name: '지수', avatar_url: null, message: '이렇게 높은 자리에서도 무너진 성을 위해 울었다는 게 찔려요', mine: false, created_at: '' },
      { id: 2, name: '민준', avatar_url: null, message: '왕이 목숨을 맡긴 사람 = 하나님이 준비해 두신 자리', mine: false, created_at: '' },
      { id: 3, name: '서연', avatar_url: null, message: '4개월 기도 후에 왕 앞에 섰다는 게 포인트!', mine: false, created_at: '' },
    ],
  },
  경외: {
    count: 1,
    lines: [{ id: 4, name: '민준', avatar_url: null, message: '무서워하는 거랑 다르다는 거 처음 알았어', mine: false, created_at: '' }],
  },
}

const MEMBERS: TypingRelayDetail['members'] = [
  { user_id: 1, name: '나', avatar_url: null, verses: 1, is_me: true, is_owner: true },
  { user_id: 2, name: '지수', avatar_url: null, verses: 4, is_me: false, is_owner: false },
  { user_id: 3, name: '민준', avatar_url: null, verses: 2, is_me: false, is_owner: false },
  { user_id: 6, name: '서연', avatar_url: null, verses: 2, is_me: false, is_owner: false },
  { user_id: 7, name: '하람', avatar_url: null, verses: 1, is_me: false, is_owner: false },
]
const FILLED: Record<number, number> = { 1: 2, 2: 3, 3: 2, 4: 6, 5: 7, 6: 3, 7: 2, 10: 2 }
const RELAY: TypingRelayDetail = {
  id: 9,
  title: '청년부 금요 필사방',
  book_number: 16,
  book_name: '느헤미야',
  chapter: 1,
  invite_code: 'preview',
  is_owner: true,
  completed: false,
  done: 8,
  total: 11,
  members: MEMBERS,
  verses: Array.from({ length: 11 }, (_, i) => {
    const verse = i + 1
    const uid = FILLED[verse]
    return {
      id: 2000 + verse,
      verse,
      label: String(verse),
      by: uid ? { user_id: uid, name: MEMBERS.find((m) => m.user_id === uid)!.name } : null,
      note: verse === 10 ? { user_id: 2, name: '지수', message: '이 기도가 오늘 내 기도였어. 11절 부탁해!' } : null,
    }
  }),
  next_verse: 8,
  live: [],
  turn: null,
  baton: { from_user_id: 2, name: '지수', message: '이 기도가 오늘 내 기도였어. 11절 부탁해!', verse: 11, label: '11' },
  gloss_views: { '술 관원': [2, 6], 경외: [3] },
}
const LIVE: TypingRelayLive[] = [
  { user_id: 3, verse: 8 },
  { user_id: 6, verse: 9 },
]
const NOW = Date.now()
const FEED: RoomFeedItem[] = [
  { id: 1, hue: 3, text: '서연님이 ‘술 관원’ 풀이를 열어 봤어요', at: NOW - 20_000 },
  { id: 2, hue: 1, text: '지수님이 내게 바통을 넘겼어요', at: NOW - 4 * 60_000 },
  { id: 3, hue: 2, text: '민준님이 내게 “함께 기도해요”', at: NOW - 9 * 60_000 },
  { id: 4, hue: 1, text: '지수 · 10절 “이 기도가 오늘 내 기도였어. 11절 부탁해!”', at: null },
]

const TypingTogetherPreview = () => {
  const qc = useQueryClient()
  const room = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('room') === '1'
  const [ready, setReady] = useState(isGlossaryReady)
  const [open, setOpen] = useState<string | null>(null)
  const [anon, setAnon] = useState(false)
  useEffect(() => {
    if (!ready) void loadGlossary().then(() => setReady(true))
  }, [ready])

  const gloss = useMemo(() => {
    if (!ready) return { entries: [] as GlossaryEntry[], marks: [] as TypingMark[] }
    const found = matchGlossary(16, typingSource(TEXT))
    const entries: GlossaryEntry[] = []
    found.forEach((m) => !entries.includes(m.entry) && entries.push(m.entry))
    return { entries, marks: found.map((m) => ({ id: m.entry.name, start: m.start, end: m.end })) }
  }, [ready])
  // 로그인 없이도 한 줄 표본이 보이게 쿼리 캐시에 심는다(키는 useGlossaryLines 와 같은 정렬)
  useEffect(() => {
    if (!gloss.entries.length) return
    const key = gloss.entries.map((e) => e.name).sort().join(',')
    qc.setQueryData(bibleTypingKeys.glossaryLines(key), LINES)
  }, [gloss, qc])

  const hueOf = useMemo(() => relayHueMap(RELAY.members), [])
  const viewersOf = room
    ? (term: string) =>
        (RELAY.gloss_views?.[term] ?? []).map((uid) => ({
          user_id: uid,
          name: MEMBERS.find((m) => m.user_id === uid)!.name,
          hue: hueOf.get(uid) ?? 0,
        }))
    : undefined

  return (
    <div className="bt-page bg-[var(--app-canvas)] dark:bg-background-dark page-stage">
      <main className="bt-shell bt-shell--session bt-shell--desk" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div className="mb-3 flex gap-2">
          <a className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white" href="#/dev/typing-together">
            혼자 쓸 때
          </a>
          <a className="rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-bold text-white" href="#/dev/typing-together?room=1">
            릴레이 방
          </a>
        </div>
        {room && <RoomBanner relay={RELAY} canPass onInvite={() => undefined} onPass={() => undefined} onOpenRelay={() => undefined} />}
        <div className="bt-desk">
          <section className="bt-stage">
            <div className={`bt-card bt-active${room ? ' bt-active--room' : ''}`}>
              <div className="lg:hidden">
                <TogetherStrip people={PEOPLE} todayWriters={9} ticker={null} unit="장" onCheer={() => undefined} />
              </div>
              <div className="bt-card__label">
                <span className="bt-verse-no">{room ? '내 차례 · 11절' : '11절'}</span>
              </div>
              <TypingPad
                text={TEXT}
                mode="copy"
                ignorePunct
                onFinish={() => undefined}
                marks={gloss.marks}
                activeMark={open}
                onMarkClick={(id) => setOpen(open === id ? null : id)}
              />
              <TypingGlossary
                entries={gloss.entries}
                active={open}
                onToggle={(t) => setOpen(open === t ? null : t)}
                where={{ book_number: 16, chapter: 1, verse_id: 1 }}
                loggedIn
                viewersOf={viewersOf}
              />
            </div>
          </section>
          <aside className="bt-desk__side">
            {room ? (
              <>
                <RoomMembers relay={RELAY} live={LIVE} hueOf={hueOf} onCheer={() => undefined} />
                <RelayBoard relay={RELAY} live={LIVE} hueOf={hueOf} currentVerse={11} onPick={() => undefined} />
                <RoomFeed items={FEED} now={NOW} />
              </>
            ) : (
              <>
                <TogetherPanel
                  people={PEOPLE}
                  todayWriters={9}
                  ticker="방금 은혜님이 6절을 다 썼어요"
                  unit="장"
                  onCheer={() => undefined}
                  anon={anon}
                  onAnon={setAnon}
                />
                <InviteCard unit="장" busy={false} onCreate={() => undefined} />
              </>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

export default TypingTogetherPreview
