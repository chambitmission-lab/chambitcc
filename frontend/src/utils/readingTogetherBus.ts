// 함께 읽기 — 화면 안 알림용 작은 이벤트 버스.
//
// SSE 핸들러(useReadingTogether.installReadingTogetherStream)는 React Query 캐시만
// 갱신한다. "○○님이 방금 묵상을 남겼어요" 같은 순간 알림은 캐시 상태가 아니라
// 사건이라, 캐시에 넣는 대신 이 버스로 흘려 VerseList 의 배너가 받아 띄운다.
import type { ReflectionStreamEvent } from '../api/bibleReflection'

type Listener = (event: ReflectionStreamEvent) => void
const listeners = new Set<Listener>()

export const readingTogetherBus = {
  emitReflection(event: ReflectionStreamEvent) {
    listeners.forEach((fn) => fn(event))
  },
  onReflection(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
