import { createElement, lazy, Suspense, type ComponentType, type ReactNode } from 'react'

/**
 * "열 때만 필요한" 모달·시트·오버레이를 별도 청크로 떼되, 렌더 지점은 그대로 두기 위한 헬퍼.
 *
 *   const FooSheet = lazyModal(() => import('./FooSheet'))
 *   ...
 *   {open && <FooSheet onClose={...} />}   // 기존 조건부 렌더 그대로
 *
 * Suspense 를 안에 품고 있어 호출부는 lazy 여부를 몰라도 된다. fallback 기본값은 null —
 * 모달은 "청크가 오면 열린다" 가 스피너보다 자연스럽다(대개 한 왕복, 재방문은 SW 캐시).
 * 페이지 탭처럼 자리가 비면 어색한 곳은 fallback 을 넘긴다.
 */
export function lazyModal<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null,
): ComponentType<P> {
  const Lazy = lazy(loader)
  const Wrapped = (props: P) => createElement(Suspense, { fallback }, createElement(Lazy, props))
  return Wrapped
}
