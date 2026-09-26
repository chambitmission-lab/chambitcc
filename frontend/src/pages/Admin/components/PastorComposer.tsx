// 담임목사 등록/수정 — slide-up 컴포저 모달
//
// 필드가 많아(인사말 전문 + 프로필 + 약력) 한 줄로 늘어놓으면 스크롤이 끝없다.
// '기본 · 인사말 · 프로필' 세 단계로 나눠 한 화면에 들어오게 한다.
// 한/영은 필드마다 접히는 영문 입력으로 — 영문은 선택이고 비우면 한국어로 폴백된다.
import { useRef, useState } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { FieldGroup, dateTriggerClass } from '../../../components/common/ComposerFields'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter } from './AdminFormBits'
import BilingualField, { type Bilingual } from './BilingualField'
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

const pair = (pastor: Pastor | undefined, field: PastorTextField): Bilingual => ({
  ko: (pastor?.[`${field}_ko` as keyof Pastor] as string | null) ?? '',
  en: (pastor?.[`${field}_en` as keyof Pastor] as string | null) ?? '',
})

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

  const errorBox = error && (
    <div className="px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 text-red-600 dark:text-red-300 text-[12.5px] font-medium">
      {error}
    </div>
  )

  const stepTabs = (
    <div className="flex gap-1.5 px-5 lg:px-7 py-3">
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
  )

  // PC에선 기본 정보를 좌/우 2단(열별 스크롤)으로, 나머지 단계는 전폭으로 펼친다
  return (
    <AdminComposerShell
      title={isEdit ? '담임목사 수정' : '담임목사 등록'}
      onClose={onClose}
      as="form"
      onSubmit={handleSubmit}
      subheader={stepTabs}
      footer={
        <ComposerFooter
          onClose={onClose}
          canSubmit={canSubmit}
          submitting={submitting}
          submitLabel={isEdit ? '수정 저장' : '등록'}
          submittingLabel={uploadMutation.isPending ? '사진 업로드 중...' : '저장 중...'}
          cancelDisabled
        />
      }
      columns={step === 'basic' ? [
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
        </>,
        <>
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
                      className={dateTriggerClass}
                      placeholder="선택"
                    />
                  </FieldGroup>
                  <FieldGroup label="이임일">
                    <DatePicker
                      value={termEnd}
                      onChange={setTermEnd}
                      className={dateTriggerClass}
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
          {errorBox}
        </>,
      ] : undefined}
    >
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
                  lgMinH="lg:min-h-[380px]"
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
                  lgMinH="lg:min-h-[220px]"
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

      {errorBox}
    </AdminComposerShell>
  )
}

export default PastorComposer
