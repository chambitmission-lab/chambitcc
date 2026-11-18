// 앱 공통 확인/안내 모달의 화면 — 아이콘 없이 큰 질문 한 문장(생김새는 confirmDialog.css).
// 호출은 utils/confirmDialog 의 confirmDialog() / alertDialog() 로 하고,
// 이 호스트는 App에 한 번만 마운트된다.
import { useCallback, useEffect, useState } from 'react'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { createPortal } from 'react-dom'
import { getStoredLanguage } from '../../locales'
import {
  bufferedRequests,
  promptValid,
  setDialogEmitter,
  type DialogRequest,
} from '../../utils/confirmDialog'
import './confirmDialog.css'

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
  // promptDialog 입력란 — 대화상자가 바뀌면 비운다(렌더 중 상태 조정)
  const [text, setText] = useState('')
  const [textFor, setTextFor] = useState(current?.id)
  if (textFor !== current?.id) {
    setTextFor(current?.id)
    setText('')
  }
  const canConfirm = promptValid(current?.input, text)

  const close = useCallback((result: boolean) => {
    setQueue((q) => {
      const [head, ...rest] = q
      if (result) head?.onText?.(text)
      head?.resolve(result)
      return rest
    })
  }, [text])

  // 열려 있는 동안 배경 스크롤 잠금
  useBodyScrollLock(!!current)

  // ESC = 취소 / Enter = 확인(입력 조건을 채웠을 때만) — Enter 까지 다루므로 useEscapeKey 대신 직접 듣는다
  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      else if (e.key === 'Enter' && !e.isComposing && canConfirm) close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, close, canConfirm])

  if (!current) return null

  const labels = LABELS[getStoredLanguage() === 'en' ? 'en' : 'ko']
  const tone = current.tone ?? (current.alertOnly ? 'brand' : 'danger')

  // 큰 글씨 한 문장 고르기 — 본문이 짧은 한 줄이면 그 문장이 주인공이고 제목은 작은 머리말로 물러난다.
  // 본문이 여러 줄·긴 안내면 제목이 큰 글씨, 본문은 아래 설명으로 내려간다.
  const shortMessage = !current.message.includes('\n') && current.message.length <= 44
  const headline = shortMessage ? current.message : (current.title ?? labels.title)
  const eyebrow = shortMessage ? current.title : undefined
  const body = shortMessage ? undefined : current.message

  return createPortal(
    <div
      className={`cdl-overlay z-[1100] ${current.input ? 'has-input' : ''}`}
      onClick={() => close(false)}
      role="presentation"
    >
      <div role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="cdl-panel">
        <div className="cdl-grab" aria-hidden />
        {eyebrow && <p className="cdl-eyebrow">{eyebrow}</p>}
        <h3 className="cdl-title">{renderLines(headline)}</h3>
        {current.highlight && <p className={`cdl-highlight is-${tone}`}>{renderLines(current.highlight)}</p>}
        {body && <p className="cdl-sub">{renderLines(body)}</p>}
        {current.description && <p className="cdl-sub">{renderLines(current.description)}</p>}
        {current.input ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={current.input.placeholder ?? current.input.mustMatch}
            maxLength={current.input.maxLength ?? 300}
            className="cdl-input"
          />
        ) : null}
        <div className="cdl-actions">
          {!current.alertOnly && (
            <button onClick={() => close(false)} className="cdl-btn is-keep">
              {current.cancelText ?? labels.cancel}
            </button>
          )}
          <button
            autoFocus={!current.input}
            onClick={() => close(true)}
            disabled={!canConfirm}
            className={`cdl-btn is-${tone}`}
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
