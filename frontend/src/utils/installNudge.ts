// 설치 제안(PWA) — "언제, 왜 지금 설치하면 좋은지"를 화면이 한 줄로 알려 주는 창구.
// 화면은 방금 일어난 일(reason)만 말하고, 띄울지·언제 띄울지·얼마나 쉬어 갈지는
// InstallNudgeHost 가 정한다. 그래서 호출부는 설치 가능 여부를 몰라도 된다.
import { canGuideIOSInstall, isPWAInstallable, isStandalonePWA } from './pwa'
import { safeSessionStorage } from './safeStorage'

/** 설치를 권하는 맥락 — 문구는 components/common/installNudge/copy.ts */
export type InstallReason = 'alarm' | 'prayer' | 'reading' | 'bulletin' | 'general'

export interface InstallNudgeDetail {
  reason: InstallReason
  /** 말풍선을 건너뛰고 안내 시트를 바로 연다 — 사용자가 방금 알림을 켜려다 막힌 경우처럼 답이 급할 때만 */
  sheet?: boolean
}

export const INSTALL_NUDGE_EVENT = 'chambit:install-nudge'

/** 지금 이 브라우저에서 설치를 권할 수 있는가 (설치 프롬프트가 준비됐거나, iOS 손 안내가 가능) */
export const canOfferInstall = (): boolean =>
  !isStandalonePWA() && (isPWAInstallable() || canGuideIOSInstall())

/** 설치 제안 요청. 권할 수 없는 환경이면 아무 일도 없다 — 바로 시트를 열었는지는 반환값으로 안다 */
export const requestInstallNudge = (reason: InstallReason, opts?: { sheet?: boolean }): boolean => {
  if (!canOfferInstall()) return false
  window.dispatchEvent(
    new CustomEvent<InstallNudgeDetail>(INSTALL_NUDGE_EVENT, { detail: { reason, sheet: opts?.sheet } }),
  )
  return true
}

/* 말씀 읽기 — 절 하나마다 권하면 방해라, 한 방문에서 몇 절 읽어 "읽는 중"이 분명해졌을 때 한 번만 */
const READ_COUNT_KEY = 'chambit:install-read-count'
const READ_THRESHOLD = 5

export const noteVerseReadForInstall = (): void => {
  const n = (Number(safeSessionStorage.get(READ_COUNT_KEY)) || 0) + 1
  safeSessionStorage.set(READ_COUNT_KEY, String(n))
  if (n === READ_THRESHOLD) requestInstallNudge('reading')
}
