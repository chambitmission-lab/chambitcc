// 앱 공통 확인/안내 모달의 화면 — 기도 상세의 삭제 확인 모달과 같은 톤이다.
// 호출은 utils/confirmDialog 의 confirmDialog() / alertDialog() 로 하고,
// 이 호스트는 App에 한 번만 마운트된다.
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getStoredLanguage } from '../../locales'
import {
  bufferedRequests,
  setDialogEmitter,
  type DialogRequest,
} from '../../utils/confirmDialog'

const TONE = {
  danger: {
    icon: 'warning',
    glow: 'bg-red-400/30 dark:bg-red-500/40',
    badge:
      'bg-gradient-to-b from-red-400/60 via-red-500/40 to-red-600/25 dark:from-red-400/50 dark:via-red-500/30 dark:to-red-600/20 border-red-500/70 dark:border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.4),inset_0_1px_3px_rgba(255,255,255,0.6)] dark:shadow-[0_0_20px_rgba(239,68,68,0.3),inset_0_1px_3px_rgba(255,255,255,0.25)]',
    panel:
      'shadow-[0_30px_80px_-20px_rgba(239,68,68,0.25),0_0_0_1px_rgba(255,255,255,0.04)]',
    confirm:
      'bg-gradient-to-tr from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30 dark:shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/40',
    highlight: 'text-red-500 dark:text-red-400',
  },
  warning: {
    icon: 'error_outline',
    glow: 'bg-amber-400/30 dark:bg-amber-500/40',
    badge:
      'bg-gradient-to-b from-amber-400/60 via-amber-500/40 to-amber-600/25 dark:from-amber-400/50 dark:via-amber-500/30 dark:to-amber-600/20 border-amber-500/70 dark:border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4),inset_0_1px_3px_rgba(255,255,255,0.6)] dark:shadow-[0_0_20px_rgba(245,158,11,0.3),inset_0_1px_3px_rgba(255,255,255,0.25)]',
    panel:
      'shadow-[0_30px_80px_-20px_rgba(245,158,11,0.25),0_0_0_1px_rgba(255,255,255,0.04)]',
    confirm:
      'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/40',
    highlight: 'text-amber-600 dark:text-amber-400',
  },
  brand: {
    icon: 'help_outline',
    glow: 'bg-[var(--brand-soft-strong)]',
    badge:
      'bg-[var(--brand)] border-[var(--brand)] shadow-[0_0_20px_rgba(49,130,246,0.35),inset_0_1px_3px_rgba(255,255,255,0.35)]',
    panel:
      'shadow-[0_30px_80px_-20px_rgba(49,130,246,0.25),0_0_0_1px_rgba(255,255,255,0.04)]',
    confirm:
      'bg-[var(--brand)] text-[var(--on-brand)] shadow-lg shadow-[rgba(49,130,246,0.3)] hover:brightness-110',
    highlight: 'text-[var(--brand)]',
  },
} as const

const LABELS = {
  ko: { title: '확인', confirm: '확인', cancel: '취소' },
  en: { title: 'Confirm', confirm: 'OK', cancel: 'Cancel' },
}

/** 줄바꿈(\n)을 <br />로 렌더 — 문자열을 그대로 넣으므로 HTML로 해석되지 않는다 */
const renderLines = (text: string) =>
  text.split('\n').map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ))

export const ConfirmDialogHost = () => {
  // 호스트 마운트 전에 들어온 호출이 있으면 첫 렌더부터 들고 시작한다
  const [queue, setQueue] = useState<DialogRequest[]>(() => bufferedRequests.slice())

  useEffect(() => {
    bufferedRequests.length = 0
    setDialogEmitter((req) => setQueue((q) => [...q, req]))
    return () => setDialogEmitter(null)
  }, [])

  const current = queue[0]

  const close = useCallback((result: boolean) => {
    setQueue((q) => {
      const [head, ...rest] = q
      head?.resolve(result)
      return rest
    })
  }, [])

  // ESC = 취소 / Enter = 확인, 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      else if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [current, close])

  if (!current) return null

  const labels = LABELS[getStoredLanguage() === 'en' ? 'en' : 'ko']
  const tone = TONE[current.tone ?? (current.alertOnly ? 'brand' : 'danger')]

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4"
      onClick={() => close(false)}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`bg-background-light dark:bg-background-dark rounded-3xl p-6 max-w-sm w-full border border-border-light dark:border-border-dark animate-pop-in ${tone.panel}`}
      >
        <div className="flex items-center gap-3 mb-4">
          {/* 아이콘 — 다른 화면 아바타와 같은 펄스 글로우 패턴, 톤만 바뀐다 */}
          <div className="relative flex-shrink-0">
            <div
              className={`absolute inset-0 rounded-full blur-md animate-pulse ${tone.glow}`}
            ></div>
            <div
              className={`w-12 h-12 rounded-full border-2 flex items-center justify-center relative z-10 ${tone.badge}`}
            >
              <span className="material-icons-outlined text-white text-xl">
                {current.icon ?? tone.icon}
              </span>
            </div>
          </div>
          <h3 className="text-[18px] font-bold text-ink-strong tracking-[-0.015em] break-keep">
            {current.title ?? labels.title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.7] mb-6 break-keep">
          {current.highlight && (
            <>
              <span className={`font-semibold ${tone.highlight}`}>
                {current.highlight}
              </span>
              <br />
            </>
          )}
          {renderLines(current.message)}
          {current.description && (
            <>
              <br />
              {renderLines(current.description)}
            </>
          )}
        </p>
        <div className="flex gap-3">
          {!current.alertOnly && (
            <button
              onClick={() => close(false)}
              className="flex-1 py-3 px-4 bg-surface-light dark:bg-white/[0.05] border border-transparent dark:border-white/[0.08] text-ink-strong rounded-2xl font-semibold text-sm hover:bg-[var(--brand-soft)] dark:hover:bg-white/[0.08] transition-colors"
            >
              {current.cancelText ?? labels.cancel}
            </button>
          )}
          <button
            autoFocus
            onClick={() => close(true)}
            className={`flex-1 py-3 px-4 rounded-2xl font-semibold text-sm transition-all ${tone.confirm}`}
          >
            {current.confirmText ?? labels.confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmDialogHost
