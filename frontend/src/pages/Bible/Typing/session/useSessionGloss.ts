/**
 * 지금 절의 '알아두면 좋은 말' (TypingSession.tsx 에서 분리)
 *
 * - 사전은 코드 분할이라 처음 필요할 때 받는다
 * - 펼친 풀이는 절에 묶는다 — 다른 절로 가면 저절로 접힌다
 * - 릴레이 방이면 풀이를 연 사실을 방에 알리고(한 번만), 다른 친구가 열어 본 풀이에는 그 얼굴을 단다
 */
import { useEffect, useMemo, useState } from 'react'
import type { TypingMode, TypingRelayDetail } from '../../../../api/bibleTyping'
import { useSendRelayGlossView } from '../../../../hooks/useBibleTyping'
import { isGlossaryReady, loadGlossary, matchGlossary, type GlossaryEntry } from '../../data/bibleGlossary'
import { typingSource } from '../hangulTyping'
import type { TypingMark } from '../TypingPad'
import type { GlossaryViewer } from '../TypingGlossary'
import type { SessionVerse } from './sessionModel'

interface GlossInput {
  activeVerse: SessionVerse | null
  mode: TypingMode
  bookNumber: number
  room: TypingRelayDetail | null
  myId: number | undefined
  memberName: (uid: number) => string
  hueOf: Map<number, number>
}

export const useSessionGloss = ({ activeVerse, mode, bookNumber, room, myId, memberName, hueOf }: GlossInput) => {
  const sendGlossView = useSendRelayGlossView()
  const [glossReady, setGlossReady] = useState(isGlossaryReady)
  useEffect(() => {
    if (glossReady) return
    let alive = true
    loadGlossary()
      .then(() => alive && setGlossReady(true))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [glossReady])
  const [glossState, setGlossState] = useState<{ verseId: number; term: string } | null>(null)

  // 필사 판이 그리는 원문(typingSource) 기준으로 찾는다
  const gloss = useMemo((): { entries: GlossaryEntry[]; marks: TypingMark[] } => {
    if (!glossReady || !activeVerse || mode === 'memorize') return { entries: [], marks: [] }
    const found = matchGlossary(bookNumber, typingSource(activeVerse.text))
    const entries: GlossaryEntry[] = []
    found.forEach((m) => {
      if (!entries.includes(m.entry)) entries.push(m.entry)
    })
    return { entries, marks: found.map((m) => ({ id: m.entry.name, start: m.start, end: m.end })) }
  }, [glossReady, activeVerse, mode, bookNumber])
  const glossOpen = glossState && glossState.verseId === activeVerse?.id ? glossState.term : null
  const toggleGloss = (term: string) => {
    const opening = glossOpen !== term
    setGlossState(opening && activeVerse ? { verseId: activeVerse.id, term } : null)
    if (opening && room && myId !== undefined && !(room.gloss_views?.[term] ?? []).includes(myId))
      sendGlossView.mutate({ id: room.id, term })
  }
  const viewersOf = room
    ? (term: string): GlossaryViewer[] =>
        (room.gloss_views?.[term] ?? [])
          .filter((uid) => uid !== myId)
          .map((uid) => ({ user_id: uid, name: memberName(uid), hue: hueOf.get(uid) ?? 0 }))
    : undefined

  return { gloss, glossOpen, toggleGloss, viewersOf }
}
