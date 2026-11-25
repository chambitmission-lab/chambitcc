// 설치 제안 문구 — 참비(양)가 방금 일어난 일에 이어서 건네는 한마디.
// 말풍선은 굵은 한 줄(title)+작은 한 줄(sub), 시트 부제(sheet)는 "그래서 설치하면 뭐가 좋은지" 한 문장.
// 문구는 전부 '홈 화면' 기준으로 쓰고, PC 에서는 place() 가 '바탕화면'으로 바꿔 읽는다.
import type { InstallReason } from '../../../utils/installNudge'

/** 폰·태블릿이 아닌 기기 — 설치하면 홈 화면이 아니라 바탕화면·독에 놓인다 */
const isDesktopDevice = (): boolean => !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/** '홈 화면'을 기기에 맞는 말로 바꾼다 */
export const place = (text: string): string =>
  isDesktopDevice() ? text.replaceAll('홈 화면', '바탕화면') : text

export const NUDGE_COPY: Record<InstallReason, { title: string; sub: string; sheet: string }> = {
  alarm: {
    title: '알람은 제가 챙길게요',
    sub: '홈 화면에 두시면 제때 알려 드리기 좋아요.',
    sheet: '맞춰 두신 말씀 알람, 홈 화면 앱에서 가장 잘 도착해요.',
  },
  prayer: {
    title: '기도 잘 올라갔어요',
    sub: '홈 화면에 두시면 함께 기도한 소식을 바로 전해 드려요.',
    sheet: '누군가 함께 기도했을 때 알림으로 바로 전해 드려요.',
  },
  reading: {
    title: '말씀 읽고 계셨군요',
    sub: '홈 화면에 두시면 내일은 한 번에 펼쳐요.',
    sheet: '주소를 찾지 않아도 읽던 자리로 한 번에 돌아와요.',
  },
  bulletin: {
    title: '다음 주 주보도 제가 들고 갈게요',
    sub: '홈 화면에 자리 하나만 주세요.',
    sheet: '새 주보와 챙길 일을 알림으로 받아 보세요.',
  },
  general: {
    title: '저 홈 화면에 데려가 주실래요?',
    sub: '자리 많이 안 차지해요. 알림도 제가 챙길게요.',
    sheet: '홈 화면에서 바로 열고, 알림도 받아 보세요.',
  },
}
