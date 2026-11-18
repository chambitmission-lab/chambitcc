// 등불 지도 청크 로더 — Mission.tsx 의 lazy() 와 라우트 로더(utils/routePreload)가 같은 함수를 쓴다.
// 지도 청크(세계 지도 데이터 + d3-geo)는 화면 청크가 그려진 뒤에야 요청이 나가 지도 칸만 한 박자 늦게 떴다.
// 라우트 로더가 명단·화면 청크와 나란히 먼저 받아 두면 화면이 뜰 때 이미 와 있다.
export const loadLampMap = () => import('./departures/LampMap')

/** 미리 받아 두기 — 실패해도 화면의 lazy() 가 다시 받는다 */
export const warmLampMap = (): void => {
  void loadLampMap().catch(() => undefined)
}
