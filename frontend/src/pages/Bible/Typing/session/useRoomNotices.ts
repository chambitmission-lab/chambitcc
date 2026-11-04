/**
 * 세션 화면의 잠깐 보이는 소식들 (TypingSession.tsx 에서 분리)
 *
 * - flash  : 릴레이 소식 띠에 잠깐 띄우는 한 줄(칸 채움·바통·응원 보냄) — FLASH_MS 뒤 사라진다
 * - cheers : 내게 온 응원이 카드 위로 떠오르는 말풍선 — 최근 4개까지, 2.2초 뒤 사라진다
 * - feed   : 방 소식(PC 독서실) — 이 화면에 있는 동안 일어난 일 + 처음 들어왔을 때 깔아 두는 바통 한마디
 * - clock  : 방 소식의 "n분 전" — PC 독서실에서만, 탭이 보일 때만 흐른다
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { TypingRelayDetail } from '../../../../api/bibleTyping'
import { useTickingNow } from '../../../../hooks/useTickingNow'
import type { RoomFeedItem } from '../RelayStudyRoom'
import { FEED_MAX, FLASH_MS, type CheerFloat } from './sessionModel'

export const useRoomNotices = (room: TypingRelayDetail | null, hueOf: Map<number, number>, isDesk: boolean) => {
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showFlash = useCallback((text: string) => {
    if (flashTimer.current) clearTimeout(flashTimer.current)
    setFlash(text)
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS)
  }, [])
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  const [cheers, setCheers] = useState<CheerFloat[]>([])
  const cheerSeq = useRef(0)
  const floatCheer = useCallback((text: string, hue: number) => {
    const id = ++cheerSeq.current
    setCheers((prev) => [...prev.slice(-3), { id, text, hue }])
    setTimeout(() => setCheers((prev) => prev.filter((c) => c.id !== id)), 2200)
  }, [])

  const [feed, setFeed] = useState<RoomFeedItem[]>([])
  const feedSeq = useRef(0)
  const pushFeed = useCallback((text: string, hue: number | null) => {
    const id = ++feedSeq.current
    setFeed((prev) => [{ id, text, hue, at: Date.now() }, ...prev].slice(0, FEED_MAX))
  }, [])

  // 방에 처음 들어왔을 때 — 바통 한마디를 방 소식의 바닥으로 깔아 둔다(언제였는지는 모른다)
  const feedSeeded = useRef(0)
  useEffect(() => {
    if (!room || feedSeeded.current === room.id) return
    feedSeeded.current = room.id
    const notes = room.verses
      .filter((v) => v.note)
      .slice(-3)
      .reverse()
      .map((v) => ({
        id: ++feedSeq.current,
        hue: hueOf.get(v.note!.user_id) ?? null,
        text: `${v.note!.name} · ${v.label}절 “${v.note!.message}”`,
        at: null,
      }))
    setFeed((prev) => [...prev, ...notes].slice(0, FEED_MAX))
  }, [room, hueOf])

  const clock = useTickingNow(30_000, isDesk && !!room)

  return { flash, showFlash, cheers, floatCheer, feed, pushFeed, clock }
}
