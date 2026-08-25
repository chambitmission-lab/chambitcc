import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface AudioSettingsMenuProps {
  /** 톱니 버튼 — PC에서는 이 아래에 팝오버를 붙인다 */
  anchorRef: RefObject<HTMLElement | null>
  rate: number
  rateOptions: number[]
  onSetRate: (rate: number) => void
  autoNext: boolean
  onToggleAutoNext: () => void
  /** 잠들기 전 듣기 요약(예: "12분 · 3장까지"). 미설정이면 null */
  sleepSummary: string | null
  /** 잠들기 시트를 열 수 없으면(장 정보 없음) undefined */
  onOpenSleep?: () => void
  onClose: () => void
}

const DESKTOP_QUERY = '(min-width: 640px)'

/**
 * 오디오북 설정 메뉴 — 헤더에 나열돼 있던 배속·연속 재생·잠들기 설정을 톱니 하나에 모은다.
 *
 * - PC(≥640px): 톱니 아래에 뜨는 작은 팝오버. 바깥 클릭·ESC로 닫힘.
 * - 모바일: 장 선택 시트와 같은 문법의 바텀시트(.chapter-sheet). 뒤로가기로 닫힘.
 *
 * 항목마다 현재 값을 오른쪽에 보여줘 눌러보지 않아도 상태를 알 수 있게 한다.
 * 배속은 메뉴 안에서 바로 고르고(순환 클릭보다 빠름), 잠들기 설정은 전용 시트로 넘긴다.
 */
const AudioSettingsMenu = ({
  anchorRef,
  rate,
  rateOptions,
  onSetRate,
  autoNext,
  onToggleAutoNext,
  sleepSummary,
  onOpenSleep,
  onClose,
}: AudioSettingsMenuProps) => {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  useModalBackButton(onClose, !desktop)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // PC: 톱니 버튼의 위치를 재서 팝오버를 그 아래 오른쪽 정렬로 띄운다.
  // 플레이어 카드가 overflow-hidden이라 카드 안에 두면 잘리므로 포털+fixed.
  useLayoutEffect(() => {
    if (!desktop) return
    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect()
      if (!r) return
      setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [desktop, anchorRef])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const body = (
    <div className="audio-settings__body">
      {/* 배속 — 메뉴 안에서 바로 선택 */}
      <div className="audio-settings__row audio-settings__row--stack">
        <div className="audio-settings__label">
          <span className="material-icons-round">speed</span>
          <span>배속</span>
          <span className="audio-settings__value">{rate}×</span>
        </div>
        <div className="audio-settings__chips" role="radiogroup" aria-label="재생 배속">
          {rateOptions.map(r => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rate === r}
              className={`audio-settings__chip${rate === r ? ' is-on' : ''}`}
              onClick={() => onSetRate(r)}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      {/* 연속 재생 토글 */}
      <button
        type="button"
        role="switch"
        aria-checked={autoNext}
        className="audio-settings__row"
        onClick={onToggleAutoNext}
      >
        <div className="audio-settings__label">
          <span className="material-icons-round">skip_next</span>
          <span>연속 재생</span>
        </div>
        <span className="audio-settings__hint">{autoNext ? '다음 장 자동' : '이 장만'}</span>
        <span className={`audio-settings__switch${autoNext ? ' is-on' : ''}`} aria-hidden>
          <span className="audio-settings__knob" />
        </span>
      </button>

      {/* 잠들기 전 듣기 — 전용 시트로 */}
      {onOpenSleep && (
        <button
          type="button"
          className="audio-settings__row"
          onClick={() => { onClose(); onOpenSleep() }}
        >
          <div className="audio-settings__label">
            <span className="material-icons-round">bedtime</span>
            <span>잠들기 전 듣기</span>
          </div>
          <span className={`audio-settings__hint${sleepSummary ? ' is-active' : ''}`}>
            {sleepSummary ?? '타이머 · 범위'}
          </span>
          <span className="material-icons-round audio-settings__chev" aria-hidden>chevron_right</span>
        </button>
      )}
    </div>
  )

  if (desktop) {
    return createPortal(
      <>
        <div className="audio-settings__scrim" onClick={onClose} aria-hidden />
        <div
          className="audio-settings__popover"
          role="dialog"
          aria-label="오디오 설정"
          style={pos ? { top: pos.top, right: pos.right } : { visibility: 'hidden' }}
        >
          {body}
        </div>
      </>,
      document.body,
    )
  }

  return createPortal(
    <div className="chapter-sheet-backdrop" onClick={onClose}>
      <div
        className="chapter-sheet audio-settings__sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="오디오 설정"
      >
        <span className="chapter-sheet__grip" aria-hidden="true" />
        <div className="chapter-sheet__head">
          <div className="chapter-sheet__head-body">
            <h3 className="chapter-sheet__title">
              <span className="material-icons-round align-[-3px] mr-1 text-[18px] text-brand">
                tune
              </span>
              오디오 설정
            </h3>
            <p className="chapter-sheet__sub">한 번 정해두면 다음에도 그대로 들려드려요</p>
          </div>
          <button type="button" className="chapter-sheet__close" onClick={onClose} aria-label="닫기">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className="chapter-sheet__body">{body}</div>
      </div>
    </div>,
    document.body,
  )
}

export default AudioSettingsMenu
