import { useState } from 'react'
import AdminComposerShell from '../components/AdminComposerShell'
import { inputClass, labelClass, type ClassForm } from './constants'

const ClassFormPanel = ({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: ClassForm
  onSave: (v: ClassForm) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState(initial)
  const set = (patch: Partial<ClassForm>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <AdminComposerShell
      title={initial.title ? '강좌 수정' : '새 강좌'}
      onClose={onCancel}
      width="lg"
      density="compact"
      closeOnBackdrop={false}
      footer={
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
      }
      columns={[
        <>
          <div>
            <label className={labelClass}>강좌명 *</label>
            <input
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="예: 수채화 교실"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>강좌 소개</label>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              placeholder="강좌에 대한 간단한 소개"
              className={`${inputClass} resize-none lg:min-h-[300px]`}
            />
          </div>
        </>,
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>강사명</label>
              <input
                value={form.instructor}
                onChange={(e) => set({ instructor: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>모집 분기</label>
              <input
                value={form.quarter}
                onChange={(e) => set({ quarter: e.target.value })}
                placeholder="예: 2026년 3분기"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>요일 / 시간</label>
            <input
              value={form.schedule}
              onChange={(e) => set({ schedule: e.target.value })}
              placeholder="예: 매주 화 10:00~12:00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>수강료</label>
            <input
              value={form.fee}
              onChange={(e) => set({ fee: e.target.value })}
              placeholder="예: 12회 120,000원"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>장소</label>
              <input
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="예: 2층 교육관"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>정원 (비우면 무제한)</label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => set({ capacity: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div>
              <label className={labelClass}>노출 순서</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => set({ display_order: +e.target.value })}
                className={`${inputClass} w-24`}
              />
            </div>
            {(
              [
                { key: 'is_open', label: '모집중' },
                { key: 'is_active', label: '노출' },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer mt-5">
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${form[key] ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
                  onClick={() => set({ [key]: !form[key] } as Partial<ClassForm>)}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form[key] ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </div>
                <span className="text-sm text-gray-700 dark:text-white/70">{label}</span>
              </label>
            ))}
          </div>
        </>,
      ]}
    />
  )
}


export default ClassFormPanel
