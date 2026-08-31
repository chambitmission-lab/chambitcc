// 교육과 훈련 등록/수정 — slide-up 컴포저 모달 (카테고리 · 프로그램 두 모드)
//
// 레거시가 이미지 한 장에 박아 두던 시간·담당·장소를 필드로 받는다.
// 한/영은 필드마다 접히는 영문 입력 — 영문은 선택이고 비우면 한국어로 폴백된다.
import { useRef, useState, type ReactNode } from 'react'
import { EduGlyph } from '../../Education/EduIcons'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import {
  useCreateCategory,
  useCreateProgram,
  useUpdateCategory,
  useUpdateProgram,
  useUploadEducationImage,
} from '../../../hooks/useEducation'
import type {
  CategoryTextField,
  EducationCategory,
  EducationProgram,
  ProgramTextField,
} from '../../../types/education'

type Bilingual = { ko: string; en: string }

const pair = (row: Record<string, unknown> | undefined, field: string): Bilingual => ({
  ko: (row?.[`${field}_ko`] as string | null | undefined) ?? '',
  en: (row?.[`${field}_en`] as string | null | undefined) ?? '',
})

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

/** 카테고리 이름 → 키 초안 ("참빛 훈련 과정" → 사용자가 영문 슬러그로 다듬음) */
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export type ComposerTarget =
  | { kind: 'category'; category?: EducationCategory }
  | { kind: 'program'; categoryId: number; program?: EducationProgram }

interface Props {
  target: ComposerTarget
  categories: EducationCategory[]
  onClose: () => void
  onSuccess: () => void
}

const EducationComposer = ({ target, categories, onClose, onSuccess }: Props) => {
  useModalBackButton(onClose)
  const isCategory = target.kind === 'category'
  const editing = isCategory ? target.category : target.program
  const title = isCategory
    ? editing ? '카테고리 수정' : '카테고리 추가'
    : editing ? '프로그램 수정' : '프로그램 추가'

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_8px_28px_var(--brand-glow)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hidden dark:block absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/[0.05] to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {target.kind === 'category' ? (
          <CategoryForm category={target.category} onClose={onClose} onSuccess={onSuccess} />
        ) : (
          <ProgramForm
            categoryId={target.categoryId}
            program={target.program}
            categories={categories}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  )
}

// ── Category form ─────────────────────────────────────
const CategoryForm = ({
  category,
  onClose,
  onSuccess,
}: {
  category?: EducationCategory
  onClose: () => void
  onSuccess: () => void
}) => {
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const row = category as unknown as Record<string, unknown> | undefined
  const field = (f: CategoryTextField) => pair(row, f)

  const [name, setName] = useState<Bilingual>(field('name'))
  const [key, setKey] = useState(category?.key ?? '')
  const [keyTouched, setKeyTouched] = useState(!!category)
  const [emoji, setEmoji] = useState(category?.emoji ?? '')
  const [tagline, setTagline] = useState<Bilingual>(field('tagline'))
  const [description, setDescription] = useState<Bilingual>(field('description'))
  const [verseText, setVerseText] = useState<Bilingual>(field('verse_text'))
  const [verseRef, setVerseRef] = useState<Bilingual>(field('verse_ref'))
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  const submitting = createMutation.isPending || updateMutation.isPending
  const keyValid = /^[a-z0-9-]+$/.test(key)
  const canSubmit = name.ko.trim().length > 0 && keyValid && !submitting

  const handleNameEn = (next: Bilingual) => {
    setName(next)
    if (!keyTouched) setKey(slugify(next.en))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    const payload = {
      key,
      name_ko: name.ko.trim(),
      name_en: name.en.trim(),
      emoji: emoji.trim(),
      tagline_ko: tagline.ko,
      tagline_en: tagline.en,
      description_ko: description.ko,
      description_en: description.en,
      verse_text_ko: verseText.ko,
      verse_text_en: verseText.en,
      verse_ref_ko: verseRef.ko,
      verse_ref_en: verseRef.en,
      is_active: isActive,
    }
    try {
      if (category) {
        await updateMutation.mutateAsync({ id: category.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('추가되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
      <div className="px-5 py-5 space-y-5 flex-1">
        <BilingualField label="이름" required value={name} onChange={handleNameEn} placeholder="예: 주일학교" />

        <div className="grid grid-cols-[1fr_88px] gap-3">
          <FieldGroup label="키 (딥링크)" required>
            <input
              type="text"
              value={key}
              onChange={(e) => {
                setKeyTouched(true)
                setKey(e.target.value.toLowerCase())
              }}
              placeholder="sunday-school"
              className={`${inputCls} font-mono ${key && !keyValid ? 'border-red-400' : ''}`}
            />
            <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
              소문자·숫자·하이픈. /education?cat=<span className="font-mono">{key || '…'}</span>
            </p>
          </FieldGroup>
          <FieldGroup label="이모지">
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🌱"
              maxLength={4}
              className={`${inputCls} text-center text-[20px]`}
            />
          </FieldGroup>
        </div>

        <BilingualField label="한 줄 소개" value={tagline} onChange={setTagline} placeholder="다음 세대를 말씀으로 세웁니다" />
        <BilingualField label="소개 글" value={description} onChange={setDescription} multiline rows={4} placeholder="이 부서/과정이 무엇을 하는지" />
        <BilingualField label="말씀 구절" value={verseText} onChange={setVerseText} multiline rows={2} placeholder="섹션 끝에 놓일 성구 본문 (개역개정)" />
        <BilingualField label="말씀 출처" value={verseRef} onChange={setVerseRef} placeholder="잠언 22:6" />

        <Toggle checked={isActive} onChange={setIsActive} label="공개" desc="끄면 목록에서 사라집니다 (데이터는 보존)" />

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
      <Footer onClose={onClose} canSubmit={canSubmit} submitting={submitting} label={category ? '저장' : '추가'} />
    </form>
  )
}

// ── Program form ──────────────────────────────────────
const ProgramForm = ({
  categoryId,
  program,
  categories,
  onClose,
  onSuccess,
}: {
  categoryId: number
  program?: EducationProgram
  categories: EducationCategory[]
  onClose: () => void
  onSuccess: () => void
}) => {
  const createMutation = useCreateProgram()
  const updateMutation = useUpdateProgram()
  const uploadMutation = useUploadEducationImage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const row = program as unknown as Record<string, unknown> | undefined
  const field = (f: ProgramTextField) => pair(row, f)

  const [category, setCategory] = useState(program?.category_id ?? categoryId)
  const [name, setName] = useState<Bilingual>(field('name'))
  const [target, setTarget] = useState<Bilingual>(field('target'))
  const [time, setTime] = useState<Bilingual>(field('meeting_time'))
  const [leader, setLeader] = useState<Bilingual>(field('leader'))
  const [location, setLocation] = useState<Bilingual>(field('location'))
  const [description, setDescription] = useState<Bilingual>(field('description'))
  const [notice, setNotice] = useState<Bilingual>(field('notice'))
  const [linkUrl, setLinkUrl] = useState(program?.link_url ?? '')
  const [linkLabel, setLinkLabel] = useState<Bilingual>(field('link_label'))
  const [isActive, setIsActive] = useState(program?.is_active ?? true)
  const [error, setError] = useState<string | null>(null)

  // 사진 — 저장 시점에만 업로드 (취소 시 R2 고아 파일 방지)
  const [imageUrl, setImageUrl] = useState(program?.image_url ?? '')
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(program?.image_url ?? null)

  const submitting = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canSubmit = name.ko.trim().length > 0 && !submitting

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일을 선택해주세요', 'error')
      return
    }
    if (pendingImage && preview) URL.revokeObjectURL(preview)
    setPendingImage(file)
    setPreview(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImageRemove = () => {
    if (pendingImage && preview) URL.revokeObjectURL(preview)
    setPendingImage(null)
    setPreview(null)
    setImageUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    try {
      let finalImage = imageUrl
      if (pendingImage) finalImage = await uploadMutation.mutateAsync(pendingImage)
      const payload = {
        category_id: category,
        name_ko: name.ko.trim(),
        name_en: name.en.trim(),
        target_ko: target.ko,
        target_en: target.en,
        meeting_time_ko: time.ko,
        meeting_time_en: time.en,
        leader_ko: leader.ko,
        leader_en: leader.en,
        location_ko: location.ko,
        location_en: location.en,
        description_ko: description.ko,
        description_en: description.en,
        notice_ko: notice.ko,
        notice_en: notice.en,
        image_url: finalImage,
        link_url: linkUrl.trim(),
        link_label_ko: linkLabel.ko,
        link_label_en: linkLabel.en,
        is_active: isActive,
      }
      if (program) {
        await updateMutation.mutateAsync({ id: program.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('추가되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(message)
      showToast(message, 'error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0">
      <div className="px-5 py-5 space-y-5 flex-1">
        {/* 카테고리 — pill grid (native select 금지) */}
        <FieldGroup label="카테고리" required>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={[
                  'h-9 px-3 rounded-full text-[12.5px] font-semibold border transition-colors inline-flex items-center gap-1.5',
                  category === c.id
                    ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
                    : 'border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-[var(--brand-soft)]',
                ].join(' ')}
              >
                {c.emoji && <EduGlyph emoji={c.emoji} size={13} className="shrink-0" />}
                {c.name_ko}
              </button>
            ))}
          </div>
        </FieldGroup>

        <BilingualField label="이름" required value={name} onChange={setName} placeholder="예: 영유아부" />
        <BilingualField label="대상" value={target} onChange={setTarget} placeholder="예: 미취학 3~5세" />

        <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-50/60 dark:bg-white/[0.02] p-4 space-y-4">
          <p className="text-[11px] font-bold tracking-[0.08em] text-gray-500 dark:text-white/45">모임 안내</p>
          <BilingualField label="시간" value={time} onChange={setTime} placeholder="주일 오후 2:40" />
          <BilingualField label="담당" value={leader} onChange={setLeader} placeholder="안수현 목사" />
          <BilingualField label="장소" value={location} onChange={setLocation} placeholder="2층 소예배실" />
          <p className="text-[11px] text-gray-400 dark:text-white/40 leading-[1.5]">
            모르는 항목은 비워두세요 — 화면에서 그 줄이 숨겨집니다. 추측해서 적지 않습니다.
          </p>
        </div>

        <BilingualField label="소개" value={description} onChange={setDescription} multiline rows={4} placeholder="이 부서/과정 소개" />
        <BilingualField label="강조 안내" value={notice} onChange={setNotice} placeholder="청년부는 4부예배(오후 1시 30분)를 드린 후 모입니다." hint="카드 아래 강조 박스로 표시됩니다" />

        <FieldGroup label="외부 링크">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://www.qtland.com/quiet/quiet.php?cate=A"
            className={inputCls}
          />
          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">
            우리가 만들 수 없는 콘텐츠(출판물·외부 신청 페이지)는 링크로 엽니다. 카드에 버튼으로 표시됩니다.
          </p>
        </FieldGroup>
        {linkUrl.trim() && (
          <BilingualField label="링크 버튼 문구" value={linkLabel} onChange={setLinkLabel} placeholder="복있는 사람 바로가기 (비우면 '바로가기')" />
        )}

        <FieldGroup label="대표 사진">
          <div className="flex items-center gap-3">
            <div className="w-[120px] aspect-[16/10] shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-white/35">없음</span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-10 rounded-xl border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold transition-colors"
              >
                사진 선택
              </button>
              {preview && (
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="w-full h-9 rounded-xl text-[12px] font-semibold text-gray-500 dark:text-white/50 hover:text-red-500 transition-colors"
                >
                  사진 제거
                </button>
              )}
            </div>
          </div>
        </FieldGroup>

        <Toggle checked={isActive} onChange={setIsActive} label="공개" desc="끄면 목록에서 사라집니다 (데이터는 보존)" />

        {error && <p className="text-[12.5px] text-red-500">{error}</p>}
      </div>
      <Footer onClose={onClose} canSubmit={canSubmit} submitting={submitting} label={program ? '저장' : '추가'} />
    </form>
  )
}

// ── Helpers ───────────────────────────────────────────
const Footer = ({
  onClose,
  canSubmit,
  submitting,
  label,
}: {
  onClose: () => void
  canSubmit: boolean
  submitting: boolean
  label: string
}) => (
  <div className="sticky bottom-0 px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06] bg-background-light/95 dark:bg-[#1c1c26]/95 backdrop-blur-sm flex gap-2">
    <button
      type="button"
      onClick={onClose}
      className="flex-1 h-11 rounded-xl text-[13.5px] font-semibold text-gray-600 dark:text-white/65 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
    >
      취소
    </button>
    <button
      type="submit"
      disabled={!canSubmit}
      className="flex-[2] h-11 rounded-xl text-[13.5px] font-bold text-white bg-brand hover:bg-brand-dim disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors"
    >
      {submitting ? '저장 중…' : label}
    </button>
  </div>
)

const Toggle = ({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  desc: string
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] text-left"
    aria-pressed={checked}
  >
    <div>
      <p className="text-[13px] font-bold text-ink-strong">{label}</p>
      <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{desc}</p>
    </div>
    <span
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-gradient-to-r from-brand to-[var(--brand-light,#4593fc)]' : 'bg-gray-300 dark:bg-white/15'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </span>
  </button>
)

const FieldGroup = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

const BilingualField = ({
  label,
  required,
  value,
  onChange,
  multiline,
  rows = 4,
  placeholder,
  hint,
}: {
  label: string
  required?: boolean
  value: Bilingual
  onChange: (next: Bilingual) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  hint?: string
}) => {
  const [showEn, setShowEn] = useState(value.en.trim().length > 0)
  const render = (lang: 'ko' | 'en') =>
    multiline ? (
      <textarea
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        rows={rows}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={`${inputCls} resize-none leading-[1.7]`}
      />
    ) : (
      <input
        type="text"
        value={value[lang]}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
        placeholder={lang === 'ko' ? placeholder : 'English (optional)'}
        className={inputCls}
      />
    )
  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">{label}</p>
        {required && <span className="text-brand text-[12px] font-bold">*</span>}
        <button
          type="button"
          onClick={() => setShowEn((prev) => !prev)}
          className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
            showEn
              ? 'bg-[var(--brand-soft-strong)] text-brand'
              : 'text-gray-400 dark:text-white/35 hover:text-brand hover:bg-[var(--brand-soft)]'
          }`}
        >
          EN
        </button>
      </div>
      {render('ko')}
      {showEn && <div className="mt-1.5">{render('en')}</div>}
      {hint && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">{hint}</p>}
    </div>
  )
}

export default EducationComposer
