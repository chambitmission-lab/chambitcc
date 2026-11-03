import { useSyncExternalStore } from 'react'
import { ensureFontFamily } from '../../utils/deferredFonts'
import { safeStorage } from '../../utils/safeStorage'

// SharePostcards 의 타입·헬퍼 — 컴포넌트 파일이 컴포넌트만 내보내야 Fast Refresh 가 산다

export type PostcardKey = 'prayer' | 'thanks' | 'verse-card'

/** 손글씨(Gaegu)를 다이얼이 열리기 전에 미리 붙인다 — 열린 뒤 받으면 서체가 툭 바뀐다 */
export const prewarmPostcardFont = (): void => {
  void ensureFontFamily('gaegu')
}

// ── "오늘 한 장 보냈다" — 나누기 버튼 소인의 잉크 ─────────────────────────
// 기도제목·감사·말씀 카드 중 하나라도 보내면 그날의 소인이 잉크로 채워진다(숫자 없이 상태만).
// 로컬 날짜 키 하나만 저장 — 백엔드·캐시와 무관하고, 날이 바뀌면 자연히 옅은 소인으로 돌아간다.
const SENT_KEY = 'share-postcard:sent-on'
const SENT_EVENT = 'share-postcard:sent'

const localDateKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const hasSentPostcardToday = (): boolean => safeStorage.get(SENT_KEY) === localDateKey()

/** 전송 성공 지점에서 호출 — 버튼은 이벤트로 바로 따라온다(소인이 꾹 찍히는 모션 포함) */
export const markPostcardSent = (): void => {
  safeStorage.set(SENT_KEY, localDateKey())
  window.dispatchEvent(new Event(SENT_EVENT))
}

/** 보내는 순간만 듣는다(같은 탭) — 소인이 꾹 찍히는 모션용. 날짜 상태는 useSentPostcardToday 로 */
export const onPostcardSent = (cb: () => void): (() => void) => {
  window.addEventListener(SENT_EVENT, cb)
  return () => window.removeEventListener(SENT_EVENT, cb)
}

const subscribe = (cb: () => void) => {
  window.addEventListener(SENT_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(SENT_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** 오늘 보낸 적이 있는가 — 같은 탭의 전송과 다른 탭의 전송 모두 반영 */
export const useSentPostcardToday = (): boolean =>
  useSyncExternalStore(subscribe, hasSentPostcardToday, () => false)
