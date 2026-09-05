// 기도 목록/상세 훅(usePrayersInfinite·usePrayerDetail)에 넘기는 표준 토스트 피드백.
// 훅은 캐시만 다루고, 어떤 문구를 어떤 톤으로 띄울지는 화면(UI 계층)이 정한다.
import type { PrayerFeedback } from '../../hooks/usePrayersQuery'
import { showToast, toastFeedback } from '../../utils/toast'

export const prayerToastFeedback: PrayerFeedback = {
  toggle: {
    onSuccess: (message) => showToast(message, 'success'),
    onError: (message) => showToast(message, 'error'),
  },
  create: toastFeedback({
    success: '기도 요청이 등록되었습니다.',
    error: '기도 요청 등록에 실패했습니다.',
  }),
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
