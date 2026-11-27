// 푸시 알림 관리 데스크 규칙·상수 — 실제 화면·작성 패널·dev 미리보기가 같이 쓴다
import type { PushSendLog } from '../../../api/push'

export const TITLE_MAX = 50
export const BODY_MAX = 200
// 상대 경로로 보내면 수신 측 sw.js가 자기 배포 위치(BASE_PATH) 기준으로 절대 URL을 만든다.
// (Vercel 구독자는 루트, 구 GitHub Pages 구독자는 /chambitcc/ 기준으로 각각 올바르게 해석됨)
export const DEFAULT_ICON = 'notification-icon-192.png?v=2'

// 특정 화면이 없는 인사·안내 푸시의 기본 도착지 — 앱을 열고 알림함을 펼쳐 방금 받은 내용을 다시 보게 한다.
// (푸시는 기기에서 사라지지만 알림함에는 같은 내용이 기록돼 있다)
export const NOTIFICATIONS_URL = '/home?open=notifications'

export interface PushPreset {
  key: string
  emoji: string
  title: string
  body: string
  url: string
  tag: string
  hint: string
}

export const PRESETS: PushPreset[] = [
  { key: 'bulletin', emoji: '📰', title: '새로운 공지사항', body: '새로운 공지사항이 등록되었습니다. 확인해 주세요.', url: '/news', tag: 'bulletin', hint: '공지 등록 직후' },
  { key: 'sermon', emoji: '🎙️', title: '새로운 설교', body: '새로운 설교 영상이 업로드되었습니다.', url: '/sermon', tag: 'sermon', hint: '주일 설교 업로드 후' },
  { key: 'prayer', emoji: '🙏', title: '함께 기도해요', body: '오늘의 기도 제목에 함께 동참해 주세요.', url: '/home', tag: 'prayer', hint: '기도 캠페인 시작' },
  { key: 'event', emoji: '📅', title: '교회 일정 안내', body: '곧 다가오는 교회 일정을 확인해 주세요.', url: '/calendar', tag: 'event', hint: '주간 일정 리마인드' },
]

export const URL_OPTIONS: { label: string; value: string }[] = [
  { label: '알림함', value: NOTIFICATIONS_URL },
  { label: '홈', value: '/home' },
  { label: '공지', value: '/news' },
  { label: '설교', value: '/sermon' },
  { label: '일정', value: '/calendar' },
  { label: '기도', value: '/' },
]

/** 경로 → 사람 말 ('알림함', '공지' …), 모르는 경로는 그대로 */
export const urlLabel = (url: string | null | undefined) => (url ? (URL_OPTIONS.find((o) => o.value === url)?.label ?? url) : '–')

export const AUDIENCE_MODE_LABEL: Record<PushSendLog['audience_mode'], string> = {
  all: '전체',
  active: '활성',
  admin: '관리자',
  selected: '선택',
}

/** 도달 결과 — 하나도 못 갔으면 fail, 일부 실패면 partial */
export const reachOf = (log: Pick<PushSendLog, 'sent' | 'failed'>): 'ok' | 'partial' | 'fail' =>
  log.sent === 0 ? 'fail' : log.failed > 0 ? 'partial' : 'ok'

// created_at 은 DB 로컬(KST) naive 값 — 'Z' 가 없으니 new Date 가 로컬로 그대로 읽는다
export const logParts = (iso: string) => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return {
    date: d,
    hm: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
  }
}
export const logMonthLabel = (iso: string, now = new Date()) => {
  const p = logParts(iso)
  if (!p) return ''
  return p.date.getFullYear() === now.getFullYear() ? `${p.date.getMonth() + 1}월` : `${p.date.getFullYear()}년 ${p.date.getMonth() + 1}월`
}
export const logMonthKey = (iso: string) => iso.slice(0, 7)
