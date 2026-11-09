import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteGlossaryLine, getGlossaryLines, saveGlossaryLine } from '../../api/bibleTyping'
import { notificationStream } from '../../utils/notificationStream'
import { bibleTypingKeys } from './keys'
import { loggedIn, parseJson } from './shared'

// ── 알아두면 좋은 말 — 성도들이 남긴 한 줄 ────────────────────

export const useGlossaryLines = (terms: string[]) => {
  const qc = useQueryClient()
  const key = [...terms].sort().join(',')
  // 누가 이 말들에 한 줄을 남기거나 지우면(SSE `typing_glossary_line`) 바로 다시 받는다 — 표제어 기준이라
  // 다른 장에서 남긴 한 줄도 해당된다. 내 저장은 mutation 이 이미 무효화하므로 한 번 더 받을 뿐 해는 없다
  useEffect(() => {
    if (!loggedIn() || !key) return
    const watching = new Set(key.split(','))
    return notificationStream.on('typing_glossary_line', (raw) => {
      const ev = parseJson<{ term: string }>(raw)
      if (ev && watching.has(ev.term)) void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLines(key) })
    })
  }, [key, qc])
  return useQuery({
    queryKey: bibleTypingKeys.glossaryLines(key),
    queryFn: () => getGlossaryLines(terms),
    enabled: loggedIn() && terms.length > 0,
    staleTime: 1000 * 60,
    // 옛 백엔드(엔드포인트 없음)면 조용히 빈 채로 — 풀이 자체는 사전 데이터라 그대로 보인다
    retry: false,
  })
}

export const useSaveGlossaryLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveGlossaryLine,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLinesAll() }),
  })
}

export const useDeleteGlossaryLine = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGlossaryLine,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.glossaryLinesAll() }),
  })
}
