// 조직 단위 추가·수정 폼.

import { useState } from 'react'
import { type OrgUnitType } from '../../../types/organization'

const TYPE_OPTIONS: { value: OrgUnitType; label: string; desc: string }[] = [
  { value: 'governance', label: '의결기구', desc: '공동의회 · 당회 · 제직회' },
  { value: 'committee', label: '위원회', desc: '조직도 최상단 묶음' },
  { value: 'bureau', label: '국', desc: '위원회 아래 묶음 헤더' },
  { value: 'department', label: '부서', desc: '실제 활동 단위' },
]

interface FormState {
  name: string
  unit_type: OrgUnitType
  parent_id: number | null
  is_active: boolean
  note: string
}

const UnitComposer = ({
  mode,
  initial,
  parentLabel,
  parentOptions,
  onSave,
  onCancel,
  isPending,
}: {
  mode: 'create' | 'edit'
  initial: FormState
  parentLabel: string
  /** 수정 모드에서만 노출되는 상위 조직 이동 후보 */
  parentOptions: { id: number | null; name: string; depth: number }[]
  onSave: (form: FormState) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState<FormState>(initial)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-pop-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-ink-strong text-[15px]">
              {mode === 'create' ? '조직 추가' : '조직 수정'}
            </h3>
            <p className="text-[11.5px] text-gray-400 dark:text-white/40 mt-0.5 truncate">
              {parentLabel}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* 이름 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              조직 이름
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="예: 예배 위원회 / 유치부"
              maxLength={100}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 구분 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              구분
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, unit_type: opt.value }))}
                  className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                    form.unit_type === opt.value
                      ? 'border-brand bg-[var(--brand-soft)] shadow-[0_0_10px_var(--brand-glow)]'
                      : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="block text-[13px] font-bold text-ink-strong">{opt.label}</span>
                  <span className="block text-[11px] text-gray-400 dark:text-white/40 mt-0.5 leading-snug">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 상위 조직 이동 — 수정할 때만 */}
          {mode === 'edit' && (
            <div>
              <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
                상위 조직
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {parentOptions.map(opt => (
                  <button
                    key={opt.id ?? 'root'}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, parent_id: opt.id }))}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                      form.parent_id === opt.id
                        ? 'border-brand bg-[var(--brand-soft-strong)] text-brand'
                        : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    {opt.depth > 0 && <span className="opacity-40 mr-1">└</span>}
                    {opt.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1.5 leading-snug">
                자기 자신이나 자기 하위 조직으로는 옮길 수 없습니다.
              </p>
            </div>
          )}

          {/* 한 줄 설명 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              한 줄 설명 (선택)
            </label>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="예: 주일 2부 예배 담당"
              maxLength={255}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 공개 여부 */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              className={`w-10 h-6 rounded-full transition-colors ${
                form.is_active ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'
              }`}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${
                  form.is_active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-white/70">
              공개 {form.is_active ? '' : '안 함 (조직도에서 숨김)'}
            </span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex gap-2 flex-shrink-0">
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
      </div>
    </div>
  )
}

// ── 한 줄 행 ──────────────────────────────────────────────────────────

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { UnitComposer }
export type { FormState }
