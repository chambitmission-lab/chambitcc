// 담임목사 등록/수정 — slide-up 컴포저 모달
//
// 필드가 많아(인사말 전문 + 프로필 + 약력) 한 줄로 늘어놓으면 스크롤이 끝없다.
// '기본 · 인사말 · 프로필' 세 단계로 나눠 한 화면에 들어오게 한다.
// 한/영은 필드마다 접히는 영문 입력으로 — 영문은 선택이고 비우면 한국어로 폴백된다.
import { useRef, useState, type ReactNode } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import DatePicker from '../../../components/common/DatePicker'
import {
  useCreatePastor,
  useUpdatePastor,
  useUploadPastorPhoto,
} from '../../../hooks/usePastors'
import type { Pastor, PastorStatus, PastorTextField } from '../../../types/pastor'

interface PastorComposerProps {
  /** 넘기면 수정 모드, 없으면 등록 모드 */
  pastor?: Pastor
  onClose: () => void
  onSuccess: () => void
}

type Step = 'basic' | 'greeting' | 'profile'

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic', label: '기본' },
  { key: 'greeting', label: '인사말' },
  { key: 'profile', label: '프로필' },
]

const STATUS_OPTIONS: { value: PastorStatus; label: string; desc: string }[] = [
  { value: 'current', label: '현 담임목사', desc: '인사말 페이지의 주인공' },
  { value: 'emeritus', label: '원로목사', desc: '역대 목록 + 예우 배지' },
  { value: 'former', label: '전임 담임목사', desc: '역대 목록' },
]

/** ko/en 쌍을 한 덩어리로 다루는 폼 상태 */
type Bilingual = { ko: string; en: string }

const pair = (pastor: Pastor | undefined, field: PastorTextField): Bilingual => ({
  ko: (pastor?.[`${field}_ko` as keyof Pastor] as string | null) ?? '',
  en: (pastor?.[`${field}_en` as keyof Pastor] as string | null) ?? '',
})

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const datePickerTriggerClass =
  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-left text-ink-strong hover:border-brand focus:outline-none focus:border-brand transition-colors'

const PastorComposer = ({ pastor, onClose, onSuccess }: PastorComposerProps) => {
  const isEdit = !!pastor
  const createMutation = useCreatePastor()
  const updateMutation = useUpdatePastor()
  const uploadMutation = useUploadPastorPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('basic')
  const [error, setError] = useState<string | null>(null)

  // 사진 — 저장 시점에만 업로드한다(취소하면 R2에 고아 파일이 남지 않는다)
  const [photoUrl, setPhotoUrl] = useState(pastor?.photo_url ?? '')
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(pastor?.photo_url ?? null)

  const [name, setName] = useState<Bilingual>(pair(pastor, 'name'))
  const [role, setRole] = useState<Bilingual>(
    pastor ? pair(pastor, 'role') : { ko: '담임목사', en: 'Senior Pastor' },
  )
  const [nickname, setNickname] = useState<Bilingual>(pair(pastor, 'nickname'))
  const [status, setStatus] = useState<PastorStatus>(pastor?.status ?? 'current')
  const [termStart, setTermStart] = useState(pastor?.term_start ?? '')
  const [termEnd, setTermEnd] = useState(pastor?.term_end ?? '')
  const [isPublished, setIsPublished] = useState(pastor?.is_published ?? true)

  const [greetingTitle, setGreetingTitle] = useState<Bilingual>(pair(pastor, 'greeting_title'))
  const [greetingBody, setGreetingBody] = useState<Bilingual>(pair(pastor, 'greeting_body'))
  const [signature, setSignature] = useState<Bilingual>(pair(pastor, 'signature'))

  const [headline, setHeadline] = useState<Bilingual>(pair(pastor, 'profile_headline'))
  const [intro, setIntro] = useState<Bilingual>(pair(pastor, 'profile_intro'))
  const [education, setEducation] = useState<Bilingual>(pair(pastor, 'education'))
  const [career, setCareer] = useState<Bilingual>(pair(pastor, 'career'))
  const [awards, setAwards] = useState<Bilingual>(pair(pastor, 'awards'))

  useModalBackButton(onClose)

  const submitting =
    createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canSubmit = name.ko.trim().length > 0 && !submitting

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일을 선택해주세요', 'error')
      return
    }
    if (pendingPhoto && photoPreview) URL.revokeObjectURL(photoPreview)
    setPendingPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePhotoRemove = () => {
    if (pendingPhoto && photoPreview) URL.revokeObjectURL(photoPreview)
    setPendingPhoto(null)
    setPhotoPreview(null)
    setPhotoUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)

    try {
      let finalPhoto = photoUrl
      if (pendingPhoto) {
        finalPhoto = await uploadMutation.mutateAsync(pendingPhoto)
      }

      const payload = {
        name_ko: name.ko.trim(),
        name_en: name.en.trim(),
        role_ko: role.ko.trim() || '담임목사',
        role_en: role.en.trim(),
        nickname_ko: nickname.ko.trim(),
        nickname_en: nickname.en.trim(),
        photo_url: finalPhoto,
        greeting_title_ko: greetingTitle.ko,
        greeting_title_en: greetingTitle.en,
        greeting_body_ko: greetingBody.ko,
        greeting_body_en: greetingBody.en,
        signature_ko: signature.ko,
        signature_en: signature.en,
        profile_headline_ko: headline.ko,
        profile_headline_en: headline.en,
        profile_intro_ko: intro.ko,
        profile_intro_en: intro.en,
        education_ko: education.ko,
        education_en: education.en,
        career_ko: career.ko,
        career_en: career.en,
        awards_ko: awards.ko,
        awards_en: awards.en,
        // 빈 문자열을 DATE 컬럼에 보내면 422 — 미입력은 null 로 넘긴다
        term_start: termStart || null,
        term_end: termEnd || null,
        status,
        is_published: isPublished,
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: pastor.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('등록되었습니다', 'success')
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장에 실패했습니다'
      setError(message)
      showToast(message, 'error')
    }
  }

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

        {/* 헤더 */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div>
            <p className="text-brand text-[10.5px] font-bold tracking-[0.12em] uppercase">ADMIN</p>
            <h2 className="text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
              {isEdit ? '담임목사 수정' : '담임목사 등록'}
            </h2>
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

        {/* 단계 탭 */}
        <div className="relative z-10 flex gap-1.5 px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
          {STEPS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(s.key)}
              className={[
                'flex-1 h-9 rounded-xl text-[12.5px] font-bold transition-colors',
                step === s.key
                  ? 'bg-[var(--brand-soft-strong)] text-brand border border-[var(--brand-glow)]'
                  : 'text-gray-500 dark:text-white/45 border border-transparent hover:bg-gray-100/70 dark:hover:bg-white/[0.04]',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 py-5 space-y-5">
            {step === 'basic' && (
              <>
                {/* 사진 */}
                <FieldGroup label="사진">
                  <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                    세로 인물 사진이 가장 잘 맞습니다. 비율을 유지한 채 자동으로 줄여서 저장됩니다.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-[92px] h-[118px] shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
                      {photoPreview ? (
                        <img src={photoPreview} alt="미리보기" className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-white/35">없음</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-dashed border-[var(--brand-glow)] bg-[var(--brand-soft)] hover:bg-[var(--brand-soft-strong)] text-brand text-[12.5px] font-bold transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        사진 선택
                      </button>
                      {(photoPreview || photoUrl) && (
                        <button
                          type="button"
                          onClick={handlePhotoRemove}
                          className="w-full h-9 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/70 text-[12px] font-semibold hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
                        >
                          사진 제거
                        </button>
                      )}
                    </div>
                  </div>
                </FieldGroup>

                <BilingualField label="이름" required value={name} onChange={setName} placeholder="예) 안동철" />
                <BilingualField label="직분" value={role} onChange={setRole} placeholder="예) 담임목사" />
                <BilingualField
                  label="별칭 (한 줄)"
                  value={nickname}
                  onChange={setNickname}
                  placeholder="예) 복있는 사람"
                />

                {/* 상태 — pill grid (native select 금지) */}
                <FieldGroup label="상태" required>
                  <div className="grid grid-cols-1 gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={[
                          'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-colors',
                          status === opt.value
                            ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)]'
                            : 'bg-transparent border-gray-200 dark:border-white/[0.08] hover:bg-[var(--brand-soft)]',
                        ].join(' ')}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            status === opt.value ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block text-[13px] font-bold ${
                              status === opt.value ? 'text-brand' : 'text-ink-strong'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-white/45 mt-0.5">
                            {opt.desc}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {status === 'current' && (
                    <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2 leading-[1.5]">
                      * 현 담임목사는 한 분입니다. 저장하면 기존 현직은 전임 담임목사로 내려가고
                      종료일이 오늘로 채워집니다(기록은 그대로 남습니다).
                    </p>
                  )}
                </FieldGroup>

                {/* 재임 기간 */}
                <div className="grid grid-cols-2 gap-2.5">
                  <FieldGroup label="부임일">
                    <DatePicker
                      value={termStart}
                      onChange={setTermStart}
                      className={datePickerTriggerClass}
                      placeholder="선택"
                    />
                  </FieldGroup>
                  <FieldGroup label="이임일">
                    <DatePicker
                      value={termEnd}
                      onChange={setTermEnd}
                      className={datePickerTriggerClass}
                      placeholder="재직 중"
                      minDate={termStart || undefined}
                    />
                  </FieldGroup>
                </div>

                {/* 공개 여부 */}
                <FieldGroup label="공개">
                  <button
                    type="button"
                    onClick={() => setIsPublished((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-brand transition-colors"
                  >
                    <span className="text-left min-w-0">
                      <span className="block text-[13px] font-bold text-ink-strong">
                        {isPublished ? '인사말 페이지에 표시' : '숨김 (관리자만 확인)'}
                      </span>
                      <span className="block text-[11px] text-gray-500 dark:text-white/45 mt-0.5">
                        준비 중인 원고는 숨겨두고 나중에 공개할 수 있어요
                      </span>
                    </span>
                    <span
                      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                        isPublished ? 'bg-brand' : 'bg-gray-300 dark:bg-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          isPublished ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`}
                      />
                    </span>
                  </button>
                </FieldGroup>
              </>
            )}

            {step === 'greeting' && (
              <>
                <BilingualField
                  label="인사말 제목"
                  value={greetingTitle}
                  onChange={setGreetingTitle}
                  placeholder="예) 인생은 만남입니다"
                />
                <BilingualField
                  label="인사말 본문"
                  value={greetingBody}
                  onChange={setGreetingBody}
                  multiline
                  rows={12}
                  hint="빈 줄로 문단을 나누면 화면에도 그대로 반영됩니다."
                  placeholder="성도와 방문자에게 건네는 인사말 전문을 입력하세요."
                />
                <BilingualField
                  label="맺음말"
                  value={signature}
                  onChange={setSignature}
                  placeholder="예) 참빛교회 담임목사 안동철 올림"
                />
              </>
            )}

            {step === 'profile' && (
              <>
                <BilingualField
                  label="한 줄 소개"
                  value={headline}
                  onChange={setHeadline}
                  placeholder="예) 안동철 목사는 '복있는 사람'으로 불리는 것을 가장 좋아합니다."
                />
                <BilingualField
                  label="소개 글"
                  value={intro}
                  onChange={setIntro}
                  multiline
                  rows={7}
                  placeholder="목사님이 걸어오신 사역과 마음을 소개해주세요."
                />
                <BilingualField
                  label="학력"
                  value={education}
                  onChange={setEducation}
                  multiline
                  rows={4}
                  hint="한 줄에 하나씩 적으면 화면에서 목록으로 정리됩니다."
                />
                <BilingualField
                  label="주요 경력"
                  value={career}
                  onChange={setCareer}
                  multiline
                  rows={6}
                  hint="한 줄에 하나씩"
                />
                <BilingualField
                  label="수상 내역"
                  value={awards}
                  onChange={setAwards}
                  multiline
                  rows={5}
                  hint="한 줄에 하나씩"
                />
              </>
            )}

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
              disabled={submitting}
              className="px-4 h-11 rounded-full text-gray-700 dark:text-white/75 text-[13.5px] font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto inline-flex items-center gap-1.5 px-5 h-11 rounded-full bg-brand hover:bg-brand-dim text-white text-[13.5px] font-bold shadow-[0_8px_24px_-8px_var(--brand-glow)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {uploadMutation.isPending ? '사진 업로드 중...' : '저장 중...'}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isEdit ? '수정 저장' : '등록'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────
const FieldGroup = ({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) => (
  <div>
    <div className="flex items-center gap-1 mb-2">
      <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
        {label}
      </p>
      {required && <span className="text-brand text-[12px] font-bold">*</span>}
    </div>
    {children}
  </div>
)

/**
 * 한국어 입력이 기본, 영문은 접혀 있다.
 * 영문은 선택 사항이고 비워두면 화면에서 한국어로 폴백되므로
 * 평소 입력 흐름에서 눈에 띄지 않게 둔다.
 */
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
  // 영문이 이미 입력돼 있으면 펼친 채로 시작한다(수정 시 값이 숨겨지면 안 된다)
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
        <p className="text-[12px] font-bold text-gray-700 dark:text-white/80 tracking-[-0.01em]">
          {label}
        </p>
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
      {hint && (
        <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">{hint}</p>
      )}
    </div>
  )
}

export default PastorComposer
