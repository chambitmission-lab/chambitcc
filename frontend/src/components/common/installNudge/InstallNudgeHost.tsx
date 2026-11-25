// 설치 제안 호스트 — 참비 말풍선 + 안내 시트.
//
// 예전 배너(PWAInstallButton)는 설치 가능 신호가 오면 어느 화면에서든 곧장 떴다. 지금은
//  1) 화면이 "방금 이런 일이 있었다"고 알리면(requestInstallNudge) 그 맥락의 한마디로 권하고,
//  2) 그런 계기가 없던 사람에게는 두 번째 방문 날부터 조용히 한 번 묻는다.
// 말풍선은 한 방문에 한 번, 닫으면 7일(두 번째부터 30일) 쉰다.
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  INSTALL_NUDGE_EVENT,
  canOfferInstall,
  requestInstallNudge,
  type InstallNudgeDetail,
  type InstallReason,
} from '../../../utils/installNudge'
import { canGuideIOSInstall, isPWAInstallable, showPWAInstallPrompt } from '../../../utils/pwa'
import { safeSessionStorage, safeStorage } from '../../../utils/safeStorage'
import { showToast } from '../../../utils/toast'
import avatarJoy from '../../chatbot/img/joy.webp'
import { NUDGE_COPY, place } from './copy'
import { InstallSheet } from './InstallSheet'
import './installNudge.css'

const DAY = 24 * 60 * 60 * 1000
/** 닫은 시각 — 예전 배너와 같은 키라 이미 닫아 둔 사람은 그대로 쉰다 */
const SNOOZE_KEY = 'pwa-install-snoozed-at'
const DISMISS_COUNT_KEY = 'pwa-install-dismiss-count'
/** 이번 방문에 이미 말풍선을 보여 줬는가 */
const SHOWN_KEY = 'chambit:install-nudge-shown'
/** 방문한 날 수 — 계기 없는 일반 제안은 두 번째 날부터 */
const VISIT_KEY = 'pwa-install-visit-days'

const isSnoozed = () => {
  const at = Number(safeStorage.get(SNOOZE_KEY))
  if (!at) return false
  const days = Number(safeStorage.get(DISMISS_COUNT_KEY)) >= 2 ? 30 : 7
  return Date.now() - at < days * DAY
}

/** 오늘 방문을 세고, 지금까지 방문한 날 수를 돌려준다 */
const countVisitDay = (): number => {
  const today = new Date().toDateString()
  const saved = safeStorage.getJson(VISIT_KEY)
  const prev =
    saved && typeof saved === 'object'
      ? (saved as { last?: unknown; n?: unknown })
      : {}
  const n = typeof prev.n === 'number' ? prev.n : 0
  if (prev.last === today) return n
  safeStorage.setJson(VISIT_KEY, { last: today, n: n + 1 })
  return n + 1
}

/** 다른 모달·시트가 떠 있는 동안에는 끼어들지 않는다 */
const modalOpen = () => document.querySelector('[aria-modal="true"]') !== null

const SHOW_DELAY_MS = 1400 // 방금 한 행동의 토스트·닫힘 애니메이션이 지나간 뒤
const RETRY_MS = 1200
const MAX_RETRIES = 40
const AUTO_HIDE_MS = 14000 // 그냥 두면 물러난다 — 닫은 것으로 세지 않는다
const GENERAL_AFTER_MS = 40000
const EXIT_MS = 220

const InstallNudgeHost = () => {
  const [reason, setReason] = useState<InstallReason | null>(null) // 말풍선
  const [entered, setEntered] = useState(false)
  const [sheet, setSheet] = useState<InstallReason | null>(null)
  // PC 에서 참비 버튼이 보이면 아바타를 따로 두지 않고 그 버튼에서 말풍선이 나온다
  const [fromFab, setFromFab] = useState(false)
  const [devIOS, setDevIOS] = useState(false) // 개발 확인용 — iOS 안내 시트 강제
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  const hideBubble = useCallback(() => {
    setEntered(false)
    later(() => setReason(null), EXIT_MS)
  }, [later])

  // 요청 받기 — 맥락 제안은 잠깐 뜸을 들였다가, 열린 모달이 걷힌 뒤에 꺼낸다
  useEffect(() => {
    const tryShow = (r: InstallReason, left: number) => {
      if (!canOfferInstall() || safeSessionStorage.get(SHOWN_KEY)) return
      if (modalOpen()) {
        if (left > 0) later(() => tryShow(r, left - 1), RETRY_MS)
        return
      }
      safeSessionStorage.set(SHOWN_KEY, '1')
      setReason(r)
    }

    const onRequest = (e: Event) => {
      const { reason: r, sheet: direct } = (e as CustomEvent<InstallNudgeDetail>).detail
      if (direct) {
        // 사용자가 방금 막힌 일의 답이라 쉬는 기간과 무관하게 바로 연다
        setSheet(r)
        return
      }
      if (isSnoozed() || safeSessionStorage.get(SHOWN_KEY)) return
      later(() => tryShow(r, MAX_RETRIES), SHOW_DELAY_MS)
    }

    const onInstalled = () => {
      setReason(null)
      setSheet(null)
      showToast(place('홈 화면에 자리 잡았어요. 고마워요!'), 'success')
    }

    window.addEventListener(INSTALL_NUDGE_EVENT, onRequest)
    window.addEventListener('pwa-installed', onInstalled)

    // 계기가 없던 사람 — 두 번째 방문 날부터, 앱을 잠깐 쓴 뒤에 한 번
    if (countVisitDay() >= 2) later(() => requestInstallNudge('general'), GENERAL_AFTER_MS)

    if (import.meta.env.DEV) {

      // 개발 확인용: __installNudge('alarm') · __installSheet('prayer', true /* iOS 안내 */)
      const w = window as unknown as Record<string, unknown>
      w.__installNudge = (r: InstallReason = 'general') => {
        safeSessionStorage.set(SHOWN_KEY, '1')
        setReason(r)
      }
      w.__installSheet = (r: InstallReason = 'general', ios = false) => {
        setDevIOS(ios)
        setSheet(r)
      }
    }

    const pending = timers.current
    return () => {
      window.removeEventListener(INSTALL_NUDGE_EVENT, onRequest)
      window.removeEventListener('pwa-installed', onInstalled)
      pending.forEach(clearTimeout)
    }
  }, [later])

  // 말풍선 등장 · 자동 퇴장 · 모바일에선 참비 FAB 를 말풍선 위로 비켜 세운다(--chat-fab-lift)
  useEffect(() => {
    if (!reason) return
    const root = document.documentElement
    const mobile = window.matchMedia('(max-width: 1023.98px)').matches
    const fab = mobile ? null : document.querySelector('.cb-fab-wrap')
    fab?.classList.add('inn-fab-wiggle')

    // 한 프레임 뒤에 켠다 — 그 사이 말풍선은 투명이라 배치(아바타 유무)가 바뀌는 것이 보이지 않는다
    const raf = requestAnimationFrame(() => {
      setFromFab(fab !== null)
      setEntered(true)
    })
    const hide = setTimeout(hideBubble, AUTO_HIDE_MS)

    const prevLift = root.style.getPropertyValue('--chat-fab-lift')
    if (mobile) root.style.setProperty('--chat-fab-lift', '5.5rem')

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hide)
      fab?.classList.remove('inn-fab-wiggle')
      if (mobile && root.style.getPropertyValue('--chat-fab-lift') === '5.5rem') {
        if (prevLift) root.style.setProperty('--chat-fab-lift', prevLift)
        else root.style.removeProperty('--chat-fab-lift')
      }
    }
  }, [reason, hideBubble])

  const snooze = () => {
    safeStorage.set(SNOOZE_KEY, String(Date.now()))
    safeStorage.set(DISMISS_COUNT_KEY, String((Number(safeStorage.get(DISMISS_COUNT_KEY)) || 0) + 1))
  }

  const handleDismiss = () => {
    snooze()
    hideBubble()
  }

  const handleOpenSheet = () => {
    if (!reason) return
    setSheet(reason)
    hideBubble()
  }

  const handleSheetClose = () => {
    // 시트까지 보고 닫았으면 한동안 다시 묻지 않는다 (설치했다면 standalone 이라 어차피 안 뜬다)
    snooze()
    setSheet(null)
  }

  return (
    <>
      {reason && (
        /* 모바일: 하단 독(z-100) 바로 위에서 참비가 빼꼼 올라와 말을 건다.
           PC: 우하단 참비 버튼 옆 — 버튼이 보이면 아바타 없이 그 버튼에서 말풍선이 나온다 */
        <div
          className={`inn-root fixed z-[90] left-0 right-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] px-4 lg:left-auto lg:right-[5.5rem] lg:bottom-6 lg:px-0 lg:w-[360px] pointer-events-none transition-opacity duration-200 ease-out motion-reduce:transition-none ${
            entered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div role="status" className="max-w-md mx-auto pointer-events-auto flex items-end gap-2.5">
            {!fromFab && <img src={avatarJoy} alt="참비" className="inn-avatar shrink-0" />}
            <div className={`inn-bubble flex-1 min-w-0 px-4 pt-3.5 pb-3 ${fromFab ? 'is-from-fab' : ''}`}>
              {/* 실제 설치될 앱 아이콘이 말풍선 모서리에 걸터앉는다 — 무엇이 놓이는지 그대로 보여 준다 */}
              <img src="/pwa-192x192.png" alt="" aria-hidden className="inn-perch" />
              <p className="pr-14 text-[14.5px] font-semibold text-ink-strong leading-snug">
                {place(NUDGE_COPY[reason].title)}
              </p>
              <p className="mt-1 text-[12.5px] text-ink-muted leading-snug">{place(NUDGE_COPY[reason].sub)}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <button
                  onClick={handleOpenSheet}
                  className="h-9 px-3.5 rounded-xl bg-brand text-brand-on text-[13px] font-semibold active:scale-95 transition-transform duration-150"
                >
                  {place('홈 화면에 두기')}
                </button>
                <button
                  onClick={handleDismiss}
                  className="h-9 px-3 rounded-xl text-[13px] font-medium text-ink-muted hover:text-ink-strong hover:bg-[var(--surface-inset)] active:scale-95 transition-[color,background-color,transform] duration-150"
                >
                  다음에요
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sheet && (
        <InstallSheet
          reason={sheet}
          ios={devIOS || (!isPWAInstallable() && canGuideIOSInstall())}
          onInstall={showPWAInstallPrompt}
          onClose={handleSheetClose}
        />
      )}
    </>
  )
}

export default InstallNudgeHost
