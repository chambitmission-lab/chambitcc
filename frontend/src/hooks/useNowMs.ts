import { useMemo } from 'react'

/**
 * 마운트 시점의 시각(ms)을 한 번만 고정해 돌려준다.
 *
 * 렌더 도중 `Date.now()`를 직접 부르면 같은 렌더가 매번 다른 값을 낼 수 있어
 * (비순수) React Compiler의 메모이제이션이 깨진다 — react-hooks/purity가 막는 이유.
 * "지금이 마감 시각을 지났나" 같은 판정은 진입 시점 기준으로 충분하고,
 * 화면을 열어 둔 채 시각이 지나가면 다음 렌더/재진입 때 반영된다.
 *
 * 초 단위로 흐르는 카운트다운처럼 실시간 갱신이 필요하면 이 훅이 아니라
 * setInterval + state 를 써야 한다.
 */
export const useNowMs = () => useMemo(() => new Date().getTime(), [])
