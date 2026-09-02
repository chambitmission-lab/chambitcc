import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  claimFirstMention,
  isGlossaryEnabled,
  isGlossaryReady,
  loadGlossary,
  matchGlossary,
  subscribeGlossaryEnabled,
  type GlossaryMatch,
  type GlossaryType,
} from '../data/bibleGlossary'

/** 절 하나에 달 사전 칩 최대 개수 — 본문이 장식으로 덮이지 않게 */
const MAX_CHIPS_PER_VERSE = 3

/** 상한 초과 시 남길 우선순위 (작을수록 먼저) */
const TYPE_PRIORITY: Record<GlossaryType, number> = {
  loanword: 0,
  person: 1,
  place: 1,
  title: 1,
  term: 1,
  archaic: 2,
}

/**
 * 인물·지명 사전 칩 세그먼트.
 * - 사전 데이터는 코드 분할이라 처음 한 번만 내려받는다 (그 전엔 빈 배열 → 칩 없음).
 * - 같은 표제어는 장에서 처음 나온 절에만 칩을 단다 (다윗 서사에서 절마다 밑줄이 생기지 않게).
 */
export const useGlossaryChips = (
  bookNumber: number | undefined,
  chapter: number | undefined,
  verseNumber: number,
  text: string | undefined
): GlossaryMatch[] => {
  const [ready, setReady] = useState(isGlossaryReady)
  // 읽기 설정(Aa)의 토글 — 끄면 열린 본문에서도 즉시 사라진다
  const enabled = useSyncExternalStore(subscribeGlossaryEnabled, isGlossaryEnabled)

  useEffect(() => {
    if (ready || !enabled) return
    let alive = true
    loadGlossary().then(() => {
      if (alive) setReady(true)
    })
    return () => {
      alive = false
    }
  }, [ready, enabled])

  return useMemo(() => {
    if (!enabled || !ready || !bookNumber || !chapter || !text) return []
    const seenInVerse = new Set<string>()
    const candidates = matchGlossary(bookNumber, text).filter((m) => {
      // 같은 절에 같은 이름이 여러 번 나오면 첫 번째에만 칩을 단다
      if (seenInVerse.has(m.entry.name)) return false
      seenInVerse.add(m.entry.name)
      return true
    })
    // 절당 상한을 넘으면 가치 순으로 고른다 — 원어("에벤에셀") > 인물·지명·용어 > 어려운 말("이르되").
    // 상한에 밀린 표제어는 이 절이 소유권을 잡지 않아야 다음 절에서 칩이 달린다.
    const ordered =
      candidates.length > MAX_CHIPS_PER_VERSE
        ? [...candidates].sort((a, b) => TYPE_PRIORITY[a.entry.type] - TYPE_PRIORITY[b.entry.type])
        : candidates
    const chosen: GlossaryMatch[] = []
    for (const m of ordered) {
      if (chosen.length >= MAX_CHIPS_PER_VERSE) break
      if (claimFirstMention(bookNumber, chapter, m.entry.name, verseNumber)) chosen.push(m)
    }
    return chosen.sort((a, b) => a.start - b.start)
  }, [enabled, ready, bookNumber, chapter, verseNumber, text])
}
