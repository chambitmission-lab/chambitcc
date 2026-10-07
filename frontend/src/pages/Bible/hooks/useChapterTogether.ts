// 함께 읽기 — 읽는 줄 감지 → 하트비트 → 장 현황(presence) → "나 말고 몇 명" 계산.
// 읽는 줄(화면 40% 지점)이 3초 이상 머문 절만 서버에 알린다. 공유를 끄면 하트비트가
// 멈추고 이탈을 보낸다. 현황은 장 진입 때 한 번 받고 이후엔 SSE 가 캐시를 갱신한다.
//
// 본문이 그려지기 전(스피너)부터 현황 요청이 나가야 상단 캡션이 본문과 함께 채워지므로
// 이 훅은 VerseList 의 로딩 분기 앞에서 부르고, 그리는 일은 ChapterTogether 가 맡는다.
import { useSyncExternalStore } from 'react'
import { useChapterPresence, useReadingPresenceHeartbeat } from '../../../hooks/useReadingTogether'
import { isPresenceSharingEnabled, subscribePresenceSharing } from '../data/presenceSharing'
import { useReadingLine } from './useReadingLine'

interface UseChapterTogetherOptions {
  bookNumber: number
  chapter: number
  /** 장 전체 절 수 (읽는 줄 감지 범위). 본문이 없으면 undefined */
  chapterTotalVerses: number | undefined
  loggedIn: boolean
  /** 본문이 실제로 그려져 있는지 — 그 전엔 읽는 줄도 하트비트도 없다 */
  bodyRendered: boolean
}

export interface ChapterTogetherState {
  /** 장 현황 응답이 아직 안 왔는지 */
  loading: boolean
  /** 지금 이 장을 읽는 중인 사람 수 (나 포함, 서버 값) */
  total: number | undefined
  readersToday: number | null | undefined
  meReadToday: boolean | null | undefined
  /** 내가 카운트에 포함돼 있는지 (공유 켬 + 하트비트 중) */
  meCounted: boolean
  /** 공유는 켰지만 읽는 절 확정 전 — 남을 셀 근거가 없어 '함께'를 말하지 않는다 */
  mePending: boolean
  /** 장 단위 "나 말고 몇 명" */
  chapterOthers: number
}

export const useChapterTogether = ({
  bookNumber,
  chapter,
  chapterTotalVerses,
  loggedIn,
  bodyRendered,
}: UseChapterTogetherOptions): ChapterTogetherState => {
  const presenceSharing = useSyncExternalStore(subscribePresenceSharing, isPresenceSharingEnabled)
  const presenceActive = loggedIn && presenceSharing && bodyRendered
  const readingVerse = useReadingLine(bookNumber, chapter, chapterTotalVerses, presenceActive)
  useReadingPresenceHeartbeat({ bookNumber, chapter, verse: readingVerse, enabled: presenceActive })
  // 하트비트를 안 보내는 뷰어(비로그인·공유 끔)는 SSE 도 못 받으므로 폴링으로 따라간다
  const { data: presence } = useChapterPresence(bookNumber, chapter, true, presenceActive)

  // "이 카운트에 내가 들어있는지"는 서버만 정확히 안다 — 내려주면 그대로 쓰고,
  // 아직 안 내려주는 백엔드에서만 하트비트 등록 여부로 짐작한다.
  const meKnown = presence?.me_included !== undefined
  const meCounted = presence?.me_included ?? (presenceActive && readingVerse !== null)
  // 짐작 중이면서 아직 하트비트가 안 나간 찰나
  const mePending = !meKnown && presenceActive && readingVerse === null
  // 서버 카운트엔 내가 포함돼 있어 하나 뺀다. 절 단위 인원은 쓰지 않는다
  // (절은 순식간에 지나가 위치 표시가 소음이 된다).
  const chapterOthers = mePending ? 0 : Math.max(0, (presence?.total ?? 0) - (meCounted ? 1 : 0))

  return {
    loading: presence === undefined,
    total: presence?.total,
    readersToday: presence?.readers_today,
    meReadToday: presence?.me_read_today,
    meCounted,
    mePending,
    chapterOthers,
  }
}
