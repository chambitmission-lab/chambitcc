/** 시스템 '동작 줄이기' 설정 — 켜져 있으면 숫자 카운트업·전환 연출을 즉시 끝낸다. matchMedia 가 없는 환경은 false */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
