import { useState } from 'react'
import { chipCls, textareaCls } from './deskStyles'

export const PasteBox = ({
  hint,
  preview,
  onApply,
  onCancel,
}: {
  hint: string
  preview: (text: string) => string
  onApply: (text: string, mode: 'append' | 'replace') => void
  onCancel: () => void
}) => {
  const [text, setText] = useState('')
  return (
    <div className="mt-3 rounded-xl border border-dashed border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] p-3 space-y-2">
      <p className="text-[12.5px] text-brand">{hint}</p>
      <textarea autoFocus className={textareaCls + ' min-h-[120px]'} value={text} onChange={e => setText(e.target.value)} />
      <div className="flex items-center gap-2">
        {text.trim() && <span className="text-[12.5px] font-semibold text-brand">{preview(text)}</span>}
        <button type="button" className="ml-auto h-8 px-3 rounded-lg text-[13px] font-semibold text-gray-600 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/10" onClick={onCancel}>
          취소
        </button>
        <button type="button" disabled={!text.trim()} className={chipCls + ' bg-white dark:bg-transparent disabled:opacity-40'} onClick={() => onApply(text, 'append')}>
          뒤에 덧붙이기
        </button>
        <button type="button" disabled={!text.trim()} className="h-8 px-3 rounded-full bg-brand text-white text-[13px] font-bold disabled:opacity-40" onClick={() => onApply(text, 'replace')}>
          전부 바꾸기
        </button>
      </div>
    </div>
  )
}
