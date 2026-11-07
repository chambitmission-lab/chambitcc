// 기도 목록/상세 훅(usePrayersInfinite·usePrayerDetail)에 넘기는 표준 토스트 피드백.
// 훅은 캐시만 다루고, 어떤 문구를 어떤 톤으로 띄울지는 화면(UI 계층)이 정한다.
import type { PrayerFeedback } from '../../hooks/usePrayersQuery'
import { showToast, toastFeedback } from '../../utils/toast'

export const prayerToastFeedback: PrayerFeedback = {
  toggle: {
    onSuccess: (message) => showToast(message, 'success'),
    onError: (message) => showToast(message, 'error'),
  },
  // create 는 비운다 — 작성 시트가 성공(나눴어요/조용히 남겼어요)·실패(인라인 에러)를 직접
  // 보여 주므로 여기서 또 띄우면 토스트가 두 번 깜빡인다
  answer: toastFeedback({
    success: (_data, variables) =>
      variables.isUpdate ? '응답 간증이 수정되었습니다.' : '✨ 응답이 등록되었습니다',
    error: '응답 등록에 실패했습니다.',
  }),
  cancelAnswer: toastFeedback({
    success: '응답 등록이 취소되었습니다.',
    error: '응답 취소에 실패했습니다.',
  }),
}
