// 읽기 플랜 등록/수정 Composer 모달 (admin) — slide-up sheet, 다크모드 합의 토큰
// 메타 편집 + 일정 자동생성(책 범위 균등 분배). 큐레이션 일정은 seed 로 관리.
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCreatePlan, useUpdatePlan } from '../../../hooks/useBiblePlan'
import { generateSchedule } from '../../../api/biblePlan'
import type { PlanDayInput, PlanSummary } from '../../../types/biblePlan'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'

interface Props {
  editingPlan: PlanSummary | null
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = ['습관', '복음서', '개관', '통독', '주제']
const LEVELS = ['입문', '초급', '중급', '고급']
const ACCENTS: { key: string; from: string; to: string }[] = [
  { key: 'purple', from: '#a855f7', to: '#ec4899' },
  { key: 'pink', from: '#ec4899', to: '#f43f5e' },
  { key: 'fuchsia', from: '#d946ef', to: '#a855f7' },
  { key: 'rose', from: '#f43f5e', to: '#ec4899' },
]

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const BOOK_PRESETS: { label: string; books: number[]; days: number }[] = [
  { label: '성경 전체', books: range(1, 66), days: 365 },
  { label: '구약', books: range(1, 39), days: 240 },
  { label: '신약', books: range(40, 66), days: 90 },
  { label: '복음서', books: [40, 41, 42, 43], days: 40 },
  { label: '모세오경', books: [1, 2, 3, 4, 5], days: 40 },
  { label: '시편', books: [19], days: 30 },
]

interface FormState {
  slug: string
  title: string
  subtitle: string
  description: string
  category: string
  level: string
  emoji: string
  accent: string
  is_published: boolean
  sort_order: number
}

const DEFAULT_FORM: FormState = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  category: '습관',
  level: '입문',
  emoji: '📖',
  accent: 'purple',
  is_published: true,
  sort_order: 0,
}

const slugify = (title: string) => {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
  return base || `plan-${Date.now()}`
}

const BiblePlanComposer = ({ editingPlan, onClose, onSuccess }: Props) => {
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [presetIdx, setPresetIdx] = useState<number | null>(null)
  const [totalDays, setTotalDays] = useState(30)
  const [generatedDays, setGeneratedDays] = useState<PlanDayInput[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  useEffect(() => {
    if (editingPlan) {
      setForm({
        slug: editingPlan.slug,
        title: editingPlan.title,
        subtitle: editingPlan.subtitle ?? '',
        description: editingPlan.description ?? '',
        category: editingPlan.category ?? '습관',
        level: editingPlan.level ?? '입문',
        emoji: editingPlan.emoji ?? '📖',
        accent: editingPlan.accent ?? 'purple',
        is_published: editingPlan.is_published,
        sort_order: editingPlan.sort_order ?? 0,
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setPresetIdx(null)
    setGeneratedDays(null)
    setError(null)
  }, [editingPlan])

  const submitting = createPlan.isPending || updatePlan.isPending
  const canSubmit = form.title.trim().length > 0 && !submitting

  const handleGenerate = async () => {
    if (presetIdx === null) {
      showToast('먼저 본문 범위를 선택하세요', 'error')
      return
    }
    setGenerating(true)
    try {
      const books = BOOK_PRESETS[presetIdx].books
      const resp = await generateSchedule(books, totalDays)
      setGeneratedDays(resp.days)
      showToast(`${resp.days.length}일 일정을 만들었어요`, 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '생성 실패', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    const payload = {
      slug: form.slug.trim() || slugify(form.title),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      category: form.category || null,
      level: form.level || null,
      emoji: form.emoji.trim() || null,
      accent: form.accent || null,
      is_published: form.is_published,
      sort_order: form.sort_order,
      ...(generatedDays ? { days: generatedDays } : {}),
    }
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ planId: editingPlan.id, payload })
        showToast('플랜이 수정되었습니다', 'success')
      } else {
        await createPlan.mutateAsync(payload)
        showToast('플랜이 등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    }
  }

  const scheduleStatus = useMemo(() => {
    if (generatedDays) return `${generatedDays.length}일 일정 생성됨 (저장 시 적용)`
    if (editingPlan) return `현재 ${editingPlan.total_days}일 (그대로 유지)`
    return '아직 일정이 없습니다'
  }, [generatedDays, editingPlan])

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_rgba(168,85,247,0.18)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/15 to-pink-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-purple-600/80 dark:text-purple-300/80 text-[10.5px] font-bold tracking-[0.12em] uppercase">
              ADMIN
            </p>
            <h2 className="text-gray-900 dark:text-white text-[17px] font-bold tracking-[-0.015em]">
              {editingPlan ? '읽기 플랜 수정' : '새 읽기 플랜'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-purple-500 dark:hover:text-purple-300 transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {/* 제목 */}
            <FieldGroup label="제목" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예) 요한복음 깊이 읽기"
                maxLength={120}
                className={inputCls}
              />
            </FieldGroup>

            {/* slug + 정렬 */}
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="slug (URL용 영문)">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="비우면 자동 생성"
                  maxLength={80}
                  className={inputCls}
                />
              </FieldGroup>
              <FieldGroup label="정렬 순서">
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  className={inputCls}
                />
              </FieldGroup>
            </div>

            {/* 부제 */}
            <FieldGroup label="부제">
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="예) 30일, 복음서 한 권 완독"
                maxLength={200}
                className={inputCls}
              />
            </FieldGroup>

            {/* 설명 */}
            <FieldGroup label="설명">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="플랜 소개를 적어주세요"
                className={`${inputCls} resize-none leading-[1.6]`}
              />
            </FieldGroup>

            {/* 카테고리 */}
            <FieldGroup label="카테고리">
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map((c) => (
                  <Pill key={c} active={form.category === c} onClick={() => setForm({ ...form, category: c })}>
                    {c}
                  </Pill>
                ))}
              </div>
            </FieldGroup>

            {/* 난이도 */}
            <FieldGroup label="난이도">
              <div className="flex gap-1.5 flex-wrap">
                {LEVELS.map((l) => (
                  <Pill key={l} active={form.level === l} onClick={() => setForm({ ...form, level: l })}>
                    {l}
                  </Pill>
                ))}
              </div>
            </FieldGroup>

            {/* 이모지 + accent */}
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="이모지">
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  maxLength={4}
                  className={`${inputCls} text-center text-[18px]`}
                />
              </FieldGroup>
              <FieldGroup label="색상">
                <div className="flex gap-2 items-center h-[42px]">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setForm({ ...form, accent: a.key })}
                      aria-label={a.key}
                      className={`w-8 h-8 rounded-full transition-all ${
                        form.accent === a.key ? 'ring-2 ring-offset-2 ring-purple-400 dark:ring-offset-[#1c1c26]' : ''
                      }`}
                      style={{ backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                    />
                  ))}
                </div>
              </FieldGroup>
            </div>

            {/* 일정 자동 생성 */}
            <div className="rounded-2xl border border-purple-200/50 dark:border-purple-400/20 bg-purple-50/50 dark:bg-purple-500/[0.05] p-4">
              <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 mb-2">
                일정 자동 생성 <span className="font-normal text-gray-400 dark:text-white/40">(균등 분배)</span>
              </p>
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {BOOK_PRESETS.map((p, i) => (
                  <Pill
                    key={p.label}
                    active={presetIdx === i}
                    onClick={() => {
                      setPresetIdx(i)
                      setTotalDays(p.days)
                    }}
                  >
                    {p.label}
                  </Pill>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-gray-500 dark:text-white/55">총 일수</label>
                <input
                  type="number"
                  min={1}
                  max={400}
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || presetIdx === null}
                  className="ml-auto px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[12.5px] font-bold disabled:opacity-40"
                >
                  {generating ? '생성 중…' : '일정 만들기'}
                </button>
              </div>
              <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-2">{scheduleStatus}</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1">
                절 단위 큐레이션 플랜은 seed_bible_plans.py 로 관리합니다.
              </p>
            </div>

            {/* 공개 */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08]">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-gray-900 dark:text-white">공개하기</p>
                <p className="text-[11.5px] text-gray-500 dark:text-white/50 mt-0.5">
                  끄면 임시 저장 (성도들에게 보이지 않음)
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_published}
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
                className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                  form.is_published ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300 dark:bg-white/[0.1]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    form.is_published ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
                {error}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="sticky bottom-0 bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm border-t border-black/[0.04] dark:border-white/[0.06] px-5 py-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_rgba(168,85,247,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(168,85,247,0.7)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? '저장 중...' : editingPlan ? '수정 저장' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-purple-400 dark:focus:border-purple-400/60 transition-colors'

const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
      {required && <span className="text-pink-500 text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center px-3.5 h-9 rounded-full text-[12.5px] font-bold transition-all',
      active
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_4px_14px_-4px_rgba(168,85,247,0.55)]'
        : 'bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
    ].join(' ')}
  >
    {children}
  </button>
)

export default BiblePlanComposer
