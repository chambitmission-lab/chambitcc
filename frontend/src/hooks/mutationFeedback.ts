/**
 * 뮤테이션 훅이 화면 피드백(토스트 등)을 직접 띄우지 않고 호출부에 위임하기 위한 계약.
 *
 * 훅의 onSuccess/onError 는 캐시 갱신만 담당하고, 마지막에 feedback 콜백을 호출한다.
 * 문구는 컴포넌트가 정한다 — 같은 뮤테이션을 어드민·바텀시트에서 다른 문구로 쓰거나
 * 조용히 실행할 수 있어야 하기 때문이다. (utils/toast 의 toastFeedback 이 흔한 조합)
 *
 * 메서드 시그니처(bivariant)로 선언해 호출부가 TData 를 좁혀서 넘겨도 훅의
 * MutationFeedback(unknown) 파라미터에 대입될 수 있게 한다.
 */
export interface MutationFeedback<TData = unknown, TVariables = unknown> {
  onSuccess?(data: TData, variables: TVariables): void
  onError?(error: Error, variables: TVariables): void
}
