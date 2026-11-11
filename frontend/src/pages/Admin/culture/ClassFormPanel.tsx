import { useRef, useState, type ReactNode } from 'react'
import AdminComposerShell from '../components/AdminComposerShell'
import { inputClass, labelClass, type ClassForm } from './constants'
import { uploadCultureImage } from '../../../api/culture'
import { showToast } from '../../../utils/toast'
import { ACCENT_CHOICES } from '../../Culture/cultureAccents'
import type {
  CultureCurriculumRow,
  CultureDetailSection,
  CultureSectionType,
} from '../../../types/culture'

// 자유 꼭지 종류 — 글씨 크기·색을 마음대로 바꾸는 편집기 대신 꼭지를 골라 쌓는다
// (선생님마다 내용은 달라도 모바일·다크에서 모양이 깨지지 않게)
const SECTION_TYPES: Record<
  CultureSectionType,
  { label: string; icon: string; titleHint: string; bodyHint: string }
> = {
  text: { label: '글', icon: 'notes', titleHint: '제목 (예: 이런 분께 권해요)', bodyHint: '내용' },
  list: {
    label: '목록',
    icon: 'format_list_bulleted',
    titleHint: '제목 (예: 준비물)',
    bodyHint: '한 줄에 하나씩',
  },
  quote: {
    label: '강조 문구',
    icon: 'format_quote',
    titleHint: '작은 제목 (없어도 돼요)',
    bodyHint: '크게 보여 줄 한마디',
  },
  image: {
    label: '사진',
    icon: 'image',
    titleHint: '제목 (예: 지난 학기 수업 모습)',
    bodyHint: '사진 설명 (없어도 돼요)',
  },
}

const smallButton =
  'inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-white/[0.08] text-[12.5px] font-semibold text-gray-600 dark:text-white/65 hover:border-brand hover:text-brand transition-colors'

const iconButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-700 dark:hover:text-white/80 transition-colors'

const GroupTitle = ({ children, hint }: { children: ReactNode; hint?: string }) => (
  <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-2">
    <h3 className="text-[14px] font-bold text-ink-strong">{children}</h3>
    {hint && <span className="text-[12px] text-gray-400 dark:text-white/40">{hint}</span>}
  </div>
)

/** 사진 한 장 올리기 — 올린 뒤 주소만 폼에 담는다(저장은 강좌 저장 때) */
const ImageField = ({
  url,
  onChange,
  tall,
  withThumb,
}: {
  url: string
  /** thumbUrl — withThumb 로 올렸을 때 목록 카드용 작은 사본 */
  onChange: (url: string, thumbUrl?: string | null) => void
  tall?: boolean
  /** 대표 사진 — 카드용 작은 사본도 함께 만든다 */
  withThumb?: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const pick = async (file?: File) => {
    if (!file) return
    try {
      setUploading(true)
      const uploaded = await uploadCultureImage(file, withThumb)
      onChange(uploaded.url, uploaded.thumbUrl)
    } catch (error) {
      showToast(error instanceof Error ? error.message : '사진 업로드에 실패했습니다', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.08]">
          <img src={url} alt="" className={`block w-full object-cover ${tall ? 'h-40' : 'h-32'}`} />
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="h-8 px-3 rounded-lg bg-black/60 text-white text-[12px] font-semibold backdrop-blur-sm"
            >
              {uploading ? '올리는 중...' : '바꾸기'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="h-8 px-3 rounded-lg bg-black/60 text-white text-[12px] font-semibold backdrop-blur-sm"
            >
              빼기
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] text-gray-400 dark:text-white/40 hover:border-brand hover:text-brand transition-colors ${tall ? 'h-28' : 'h-20'}`}
        >
          <span className="material-icons-outlined text-[24px]">add_photo_alternate</span>
          <span className="text-[12.5px] font-semibold">
            {uploading ? '올리는 중...' : '사진 올리기 (JPG · PNG · WebP)'}
          </span>
        </button>
      )}
    </div>
  )
}

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

  // 수업 계획표
  const [weeks, setWeeks] = useState(String(initial.curriculum.length || 12))
  const setRow = (index: number, patch: Partial<CultureCurriculumRow>) =>
    setForm((f) => ({
      ...f,
      curriculum: f.curriculum.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  /** 주 수에 맞춰 늘리거나 줄인다 — 이미 적은 내용은 그대로 둔다 */
  const applyWeeks = () => {
    const n = Math.min(60, Math.max(0, Math.floor(Number(weeks)) || 0))
    setForm((f) => ({
      ...f,
      curriculum: Array.from({ length: n }, (_, i) => f.curriculum[i] ?? { title: '', note: '' }),
    }))
  }

  // 자유 꼭지
  const setSection = (index: number, patch: Partial<CultureDetailSection>) =>
    setForm((f) => ({
      ...f,
      sections: f.sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    }))
  const moveSection = (index: number, step: -1 | 1) =>
    setForm((f) => {
      const to = index + step
      if (to < 0 || to >= f.sections.length) return f
      const sections = [...f.sections]
      ;[sections[index], sections[to]] = [sections[to], sections[index]]
      return { ...f, sections }
    })

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
          <GroupTitle>기본 정보</GroupTitle>
          <div>
            <label className={labelClass}>강좌명 *</label>
            <input
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="예: 취미로 배우는 성악교실"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>대표 사진 (강좌 상세 맨 위 · 강좌 카드)</label>
            <ImageField
              url={form.cover_image_url}
              onChange={(url, thumbUrl) => set({ cover_image_url: url, cover_thumb_url: (url && thumbUrl) || '' })}
              tall
              withThumb
            />
          </div>
          <div>
            <label className={labelClass}>대표 색 (제목 판 · 표 머리)</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => set({ accent: '' })}
                className={`h-8 px-3 rounded-full border text-[12px] font-semibold transition-colors ${
                  form.accent
                    ? 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50'
                    : 'border-brand text-brand bg-[var(--brand-soft)]'
                }`}
              >
                자동
              </button>
              {ACCENT_CHOICES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`대표 색 ${color}`}
                  onClick={() => set({ accent: color })}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    form.accent === color
                      ? 'ring-2 ring-offset-2 ring-gray-700 dark:ring-white dark:ring-offset-[#1c1c1e] scale-105'
                      : ''
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>대상</label>
              <input
                value={form.target}
                onChange={(e) => set({ target: e.target.value })}
                placeholder="예: 성인"
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>기간</label>
              <input
                value={form.duration}
                onChange={(e) => set({ duration: e.target.value })}
                placeholder="예: 12주"
                maxLength={50}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>요일 / 시간 (반이 여럿이면 줄을 바꿔 적어 주세요)</label>
            <textarea
              value={form.schedule}
              onChange={(e) => set({ schedule: e.target.value })}
              rows={2}
              maxLength={200}
              placeholder={'예: 월요일 오전 10시 30분~11시 30분\n수요일 오후 6시~7시'}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className={labelClass}>수강료</label>
            <input
              value={form.fee}
              onChange={(e) => set({ fee: e.target.value })}
              placeholder="예: 12회 180,000원"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>장소</label>
              <input
                value={form.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="예: 2층 성가대실"
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
        <>
          <GroupTitle hint="비워 둔 칸은 화면에 나오지 않아요">강좌 상세</GroupTitle>
          <div>
            <label className={labelClass}>강좌 소개</label>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={6}
              placeholder={
                '예: "내 마음을 담아, 아름답게 노래합니다."\n노래를 잘하지 않아도 괜찮아요. 숨 쉬는 법부터 친절하게 배워갑니다.'
              }
              className={`${inputClass} resize-y`}
            />
          </div>
          <div>
            <label className={labelClass}>강사 소개 (경력을 한 줄에 하나씩)</label>
            <textarea
              value={form.instructor_bio}
              onChange={(e) => set({ instructor_bio: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder={'예: 다수의 학교 합창반 수업\n교회 중고등부 성가대 지휘'}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* 수업 계획표 */}
          <div>
            <div className="flex items-end justify-between gap-2 mb-1.5">
              <label className={`${labelClass} !mb-0`}>
                수업 계획표{form.curriculum.length > 0 ? ` (${form.curriculum.length}주)` : ''}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={weeks}
                  onChange={(e) => setWeeks(e.target.value)}
                  aria-label="주 수"
                  className={`${inputClass} !w-16 !px-2 !py-1.5 text-center`}
                />
                <button type="button" onClick={applyWeeks} className={smallButton}>
                  주로 맞추기
                </button>
              </div>
            </div>
            {form.curriculum.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.1] px-4 py-5 text-center text-[13px] text-gray-400 dark:text-white/40">
                주 수를 넣고 ‘주로 맞추기’를 누르면 칸이 만들어져요
              </p>
            ) : (
              <div className="space-y-1.5">
                {form.curriculum.map((row, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-7 shrink-0 text-center text-[13px] font-bold tabular-nums text-gray-500 dark:text-white/50">
                      {i + 1}
                    </span>
                    <input
                      value={row.title}
                      onChange={(e) => setRow(i, { title: e.target.value })}
                      placeholder="수업 계획"
                      maxLength={200}
                      className={`${inputClass} !py-2 min-w-0 flex-[2]`}
                    />
                    <input
                      value={row.note}
                      onChange={(e) => setRow(i, { note: e.target.value })}
                      placeholder="비고"
                      maxLength={200}
                      className={`${inputClass} !py-2 min-w-0 flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => i > 0 && setRow(i, { ...form.curriculum[i - 1] })}
                      disabled={i === 0}
                      title="윗줄과 같게"
                      aria-label={`${i + 1}주를 윗줄과 같게`}
                      className={`${iconButton} disabled:opacity-25`}
                    >
                      <span className="material-icons-outlined text-[18px]">content_copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ curriculum: form.curriculum.filter((_, j) => j !== i) })}
                      aria-label={`${i + 1}주 지우기`}
                      className={iconButton}
                    >
                      <span className="material-icons-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
                {form.curriculum.length < 60 && (
                  <button
                    type="button"
                    onClick={() => set({ curriculum: [...form.curriculum, { title: '', note: '' }] })}
                    className={`${smallButton} w-full justify-center`}
                  >
                    + 한 주 추가
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 자유 꼭지 */}
          <div>
            <label className={labelClass}>더 알리고 싶은 내용 (자유 꼭지)</label>
            <div className="space-y-3">
              {form.sections.map((section, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] p-3 space-y-2"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[12.5px] font-bold text-brand">
                      <span className="material-icons-outlined text-[16px]">
                        {SECTION_TYPES[section.type].icon}
                      </span>
                      {SECTION_TYPES[section.type].label}
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      aria-label="위로"
                      className={`${iconButton} disabled:opacity-25`}
                    >
                      <span className="material-icons-outlined text-[18px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === form.sections.length - 1}
                      aria-label="아래로"
                      className={`${iconButton} disabled:opacity-25`}
                    >
                      <span className="material-icons-outlined text-[18px]">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => set({ sections: form.sections.filter((_, j) => j !== i) })}
                      aria-label="꼭지 지우기"
                      className={iconButton}
                    >
                      <span className="material-icons-outlined text-[18px]">delete_outline</span>
                    </button>
                  </div>
                  <input
                    value={section.title}
                    onChange={(e) => setSection(i, { title: e.target.value })}
                    placeholder={SECTION_TYPES[section.type].titleHint}
                    maxLength={100}
                    className={`${inputClass} !py-2`}
                  />
                  {section.type === 'image' && (
                    <ImageField
                      url={section.image_url ?? ''}
                      onChange={(url) => setSection(i, { image_url: url })}
                    />
                  )}
                  <textarea
                    value={section.body}
                    onChange={(e) => setSection(i, { body: e.target.value })}
                    rows={section.type === 'image' ? 1 : 3}
                    maxLength={4000}
                    placeholder={SECTION_TYPES[section.type].bodyHint}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              ))}
              {form.sections.length < 20 && (
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(SECTION_TYPES) as CultureSectionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        set({
                          sections: [...form.sections, { type, title: '', body: '', image_url: null }],
                        })
                      }
                      className={smallButton}
                    >
                      <span className="material-icons-outlined text-[16px]">{SECTION_TYPES[type].icon}</span>
                      {SECTION_TYPES[type].label} 추가
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
      ]}
    />
  )
}

export default ClassFormPanel
