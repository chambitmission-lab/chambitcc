import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getMannaBoard,
  getMannaHome,
  getMannaLive,
  getMannaRival,
  getMannaSummary,
  getMannaTeams,
  submitMannaRun,
  type MannaMode,
} from '../../api/bibleTyping'
import { chooseLeagueTeam } from '../../api/bibleLeague'
import { QK_LEAGUE } from '../useBibleLeague'
import { scheduleTitleEvaluation } from '../../utils/titleUnlockBus'
import { bibleTypingKeys } from './keys'
import { TYPING_HOME_STALE, loggedIn } from './shared'

// ── 만나 내리기 ─────────────────────────────────────────

/** 허브 카드·시작 화면 — 난이도별 최고·오늘의 만나 내 순위 */
export const useMannaSummary = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaSummary(),
    queryFn: getMannaSummary,
    enabled: loggedIn() && enabled,
    staleTime: TYPING_HOME_STALE,
  })

/** 오늘의 만나 순위(난이도별) */
export const useMannaBoard = (mode: MannaMode, enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaBoard(mode),
    queryFn: () => getMannaBoard(mode),
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 20,
  })

/** 이번 주 부서 대항전 */
export const useMannaTeams = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaTeams(),
    queryFn: getMannaTeams,
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 30,
  })

/** 고스트 라이벌 — 오늘 그 난이도에서 바로 위 사람(없으면 1위)의 절별 누적 점수 */
export const useMannaRival = (mode: MannaMode, enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaRival(mode),
    queryFn: () => getMannaRival(mode),
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 20,
  })

/** 라이브 한 판 — 진행 중인 창·다음 창·오늘 끝난 창. 진행 중엔 자주 새로 받는다 */
export const useMannaLive = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaLive(),
    queryFn: getMannaLive,
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 15,
    refetchInterval: (q) => (q.state.data?.current ? 1000 * 20 : false),
  })

/** 홈 배너 — 지금(또는 2시간 안) 라이브와 지난주 광야 챔피언 */
export const useMannaHome = (enabled = true) =>
  useQuery({
    queryKey: bibleTypingKeys.mannaHome(),
    queryFn: getMannaHome,
    enabled: loggedIn() && enabled,
    staleTime: 1000 * 60 * 3,
  })

export const useSubmitManna = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: submitMannaRun,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.manna() })
      if (result.counted) scheduleTitleEvaluation()
    },
  })
}


/** 부서 고르기 — 말씀 리그의 팀을 그대로 쓴다(한 주에 한 번 바꿀 수 있다) */
export const useChooseMannaTeam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: chooseLeagueTeam,
    onSuccess: (league) => {
      qc.setQueryData(QK_LEAGUE, league)
      void qc.invalidateQueries({ queryKey: bibleTypingKeys.manna() })
    },
  })
}
