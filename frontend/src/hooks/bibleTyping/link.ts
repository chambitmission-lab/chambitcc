import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getLinkBoard, getLinkSummary, getLinkTeams, submitLinkRun, type LinkScope } from '../../api/bibleTyping'
import { bibleTypingKeys } from './keys'
import { TYPING_HOME_STALE, loggedIn } from './shared'

// ── 말씀 잇기 ─────────────────────────────────────────

/** 허브 카드·시작 화면 — 내 최고점·오늘 순위·오늘 참여 인원 */
export const useLinkSummary = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.linkSummary(),
    queryFn: getLinkSummary,
    enabled: loggedIn() && enabled,
    staleTime: TYPING_HOME_STALE,
  })

/** 오늘(그날 최고 한 판)·이번 주(하루 최고의 합) 순위 */
export const useLinkBoard = (scope: LinkScope, enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.linkBoard(scope),
    queryFn: () => getLinkBoard(scope),
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 20,
  })

/** 이번 주 부서 대항 — 1인당 평균 */
export const useLinkTeams = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.linkTeams(),
    queryFn: getLinkTeams,
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 30,
  })

export const useSubmitLink = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitLinkRun,
    onSuccess: () => void qc.invalidateQueries({ queryKey: bibleTypingKeys.link() }),
  })
}

