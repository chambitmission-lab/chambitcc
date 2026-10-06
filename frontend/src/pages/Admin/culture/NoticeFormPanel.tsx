import { useState } from 'react'
import AdminComposerShell from '../components/AdminComposerShell'
import { inputClass, labelClass, type NoticeForm } from './constants'

const NoticeFormPanel = ({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: NoticeForm
  onSave: (v: NoticeForm) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState(initial)
  const footer = (
    <div className="shrink-0 px-5 lg:px-7 py-4 border-t border-border-light dark:border-border-dark flex gap-2">
          <button
            onClick={() => onSave(form)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
          >
            취소
          </button>
    </div>
  )

  return (
    <AdminComposerShell
      title={initial.title ? '공지 수정' : '새 공지'}
      onClose={onCancel}
      width="md"
      density="compact"
      closeOnBackdrop={false}
      footer={footer}
    >
          <div>
            <label className={labelClass}>제목 *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>내용 *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className={`${inputClass} resize-none lg:min-h-[400px]`}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-white/70">공개</span>
          </label>
    </AdminComposerShell>
  )
}

export default NoticeFormPanel
