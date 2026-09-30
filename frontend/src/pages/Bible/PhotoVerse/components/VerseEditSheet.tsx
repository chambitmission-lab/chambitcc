import { useState } from 'react'
import { useModalBackButton } from '../../../../hooks/useModalBackButton'

interface VerseEditSheetProps {
  text: string
  /** 다듬기 전 원문 — 이미 다듬은 적이 있을 때만 */
  originalText?: string
  language: 'ko' | 'en'
  onApply: (text: string) => void
  onReset: () => void
  onClose: () => void
}

const TEXTS = {
  ko: {
    title: '문구 다듬기',
    note: '원하는 곳에서 줄을 바꾸거나, 긴 구절에서 마음에 남는 부분만 담을 수 있어요. 말씀의 뜻이 달라지지 않게 가급적 그대로 두세요.',
    apply: '적용하기',
    reset: '원문으로 되돌리기',
    close: '닫기',
  },
  en: {
    title: 'Edit text',
    note: 'Add line breaks or keep only part of a long passage. Please keep the meaning of the Word intact.',
    apply: 'Apply',
    reset: 'Restore original',
    close: 'Close',
  },
}

/** 카드에 올릴 문구를 손보는 시트 — 줄바꿈(Enter)은 카드에서도 그대로 줄이 바뀐다 */
const VerseEditSheet = ({ text, originalText, language, onApply, onReset, onClose }: VerseEditSheetProps) => {
  const [draft, setDraft] = useState(text)
  const t = TEXTS[language]
  useModalBackButton(onClose)

  const trimmed = draft.replace(/[ \t]+\n/g, '\n').trim()

  return (
    <div className="pv-sheet-overlay" onClick={onClose}>
      <div
        className="pv-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pv-sheet__handle" aria-hidden="true" />
        <div className="pv-sheet__header">
          <h2 className="pv-sheet__title">{t.title}</h2>
          <button type="button" className="pv-sheet__close" aria-label={t.close} onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className="pv-sheet__body">
          <p className="pv-sheet__hint">{t.note}</p>
          <textarea
            className="pv-edit__textarea"
            value={draft}
            rows={7}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
          {originalText && (
            <button type="button" className="pv-edit__reset" onClick={onReset}>
              <span className="material-icons-round text-[16px]">undo</span>
              {t.reset}
            </button>
          )}
        </div>
        <div className="pv-sheet__footer">
          <button
            type="button"
            className="pv-confirm brand-gradient"
            disabled={!trimmed}
            onClick={() => onApply(trimmed)}
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerseEditSheet
