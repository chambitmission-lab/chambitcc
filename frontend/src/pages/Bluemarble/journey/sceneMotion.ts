// 장면 레이어 카드 공통 등장/퇴장 — 배경(scrim)은 JourneyView 한 곳에서 유지하고 카드만 갈아 끼운다.
// 나가는 카드와 들어오는 카드는 같은 격자 칸에 겹쳐 동시에 교차 페이드한다(quest.css .qj-scrim > .qj-scene).
// 나가는 카드는 퇴장 시작과 동시에 클릭을 통과시킨다 — DOM 에서 늦게 빠져도 새 카드 버튼을 가리지 않게.
export const sceneCardMotion = {
  initial: { opacity: 0, y: 20, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' as const },
  exit: { opacity: 0, y: -10, scale: 0.98, pointerEvents: 'none' as const },
  transition: { duration: 0.2, ease: [0.2, 0.9, 0.3, 1] as const },
}
