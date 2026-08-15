// 칭호 해금 이벤트 버스
// 읽기 mutation 등 여러 곳에서 "칭호를 평가해줘"를 호출하면, 짧게 디바운스한 뒤
// 백엔드 /titles/evaluate 를 한 번만 때리고, 새로 획득한 칭호를 구독자(해금 팝업)에게 흘려보낸다.
// React 트리와 분리해 어디서든(훅/이벤트 핸들러) 트리거할 수 있게 모듈 싱글톤으로 둔다.
import { evaluateTitles, type TitleStatus } from '../api/titles'

type Listener = (titles: TitleStatus[]) => void

const listeners = new Set<Listener>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let inFlight = false

export const subscribeTitleUnlocks = (listener: Listener): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const emit = (titles: TitleStatus[]) => {
  if (titles.length === 0) return
  listeners.forEach((l) => l(titles))
}

const runEvaluation = async () => {
  if (inFlight) return
  // 로그인 상태에서만
  if (!localStorage.getItem('access_token')) return
  inFlight = true
  try {
    const result = await evaluateTitles()
    emit(result.newly_earned || [])
  } catch {
    // 조용히 무시 — 칭호 평가 실패가 읽기 흐름을 방해하면 안 됨
  } finally {
    inFlight = false
  }
}

/** 읽기 후 등에서 호출. 연속 호출은 디바운스되어 한 번만 평가한다. */
export const scheduleTitleEvaluation = (delay = 3500) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void runEvaluation()
  }, delay)
}

/** 이미 확보한 해금 목록을 팝업으로 흘려보낸다 — GET /titles 응답의 newly_earned 등.
 * (칭호 페이지 진입 시 별도 /evaluate 호출 없이 목록 조회 한 번으로 팝업까지 처리) */
export const emitTitleUnlocks = (titles: TitleStatus[]) => {
  emit(titles)
}
