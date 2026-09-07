import { createElement, lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react'

export type LazyModalComponent<P> = ComponentType<P> & {
  /** 청크를 미리 내려받는다. 여러 번 불러도 요청은 한 번. 실패는 삼킨다(탭 시 다시 시도됨). */
  preload: () => Promise<void>
}

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
 *
 * 첫 탭의 왕복 지연이 거슬리는 곳(성경 본문의 사전 칩·단어장 시트처럼 화면에 트리거가
 * 보이는 순간 곧 눌릴 수 있는 것)은 `Foo.preload()` 로 idle 시간에 미리 받아둔다.
 * 미리 받아둔 뒤엔 Suspense 를 거치지 않고 곧장 그리므로 빈 프레임조차 없다.
 *
 * 렌더 경로(Suspense+Lazy / 직접)는 인스턴스가 마운트될 때 한 번만 정한다.
 * 매 렌더마다 `resolved` 를 다시 보면, Suspense 로 열린 모달이 청크 도착 후 부모가
 * 리렌더되는 순간 다른 엘리먼트 타입으로 바뀌어 통째로 리마운트된다 — 집중 읽기가
 * 읽던 절에서 1절로 튀고, 시트에 입력하던 내용이 사라지던 원인.
 */
export function lazyModal<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  fallback: ReactNode = null,
): LazyModalComponent<P> {
  let resolved: ComponentType<P> | null = null
  let pending: Promise<{ default: ComponentType<P> }> | null = null
  const load = () => {
    if (!pending) {
      pending = loader().then(
        (m) => {
          resolved = m.default
          return m
        },
        (err) => {
          // 실패한 약속을 붙들고 있으면 이후 탭도 영영 실패 — 다음 시도에 새로 요청하게 비운다
          pending = null
          throw err
        },
      )
    }
    return pending
  }
  const Lazy = lazy(load)
  const Wrapped = ((props: P) => {
    // 마운트 시점의 경로를 고정 — 이 인스턴스가 살아 있는 동안 타입이 바뀌지 않는다
    const [direct] = useState(() => resolved)
    return direct
      ? createElement(direct, props)
      : createElement(Suspense, { fallback }, createElement(Lazy, props))
  }) as LazyModalComponent<P>
  Wrapped.preload = () => load().then(() => undefined, () => undefined)
  return Wrapped
}
