// 섬기는 사람 등록/수정 — slide-up 컴포저 모달
//
// 교역자·선교사·장로·직원이 한 폼을 공유한다. 카테고리 pill 을 고르면 그 분류에만
// 필요한 칸(선교사의 사역지·국가)이 나타난다 — 빈 칸이 늘어놓이지 않게.
// 한/영은 필드마다 접히는 영문 입력으로. 영문은 선택이고 비우면 한국어로 폴백된다.
import { useRef, useState, type ReactNode } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import DatePicker from '../../../components/common/DatePicker'
import CountryFlag from '../../../components/common/CountryFlag'
import {
  useCreatePerson,
  useUpdatePerson,
  useUploadPersonPhoto,
} from '../../../hooks/usePeople'
import { CATEGORY_DATE_LABEL, CATEGORY_LABEL, looksLikeLeaderRole } from '../../../types/people'
import type { Person, PersonCategory, PersonTextField } from '../../../types/people'

interface PersonComposerProps {
  /** 넘기면 수정 모드, 없으면 등록 모드 */
  person?: Person
  /** 등록 모드에서 미리 골라둘 분류 (지금 보고 있는 탭) */
  defaultCategory?: PersonCategory
  onClose: () => void
  onSuccess: () => void
}

type Step = 'basic' | 'ministry' | 'contact'

const STEPS: { key: Step; label: string }[] = [
  { key: 'basic', label: '기본' },
  { key: 'ministry', label: '사역' },
  { key: 'contact', label: '연락처' },
]

const CATEGORY_DESC: Record<PersonCategory, string> = {
  pastor: '부목사 · 전도사 · 강도사 · 명예전도사',
  missionary: '파송 선교사 — 사역지와 국기가 함께 보입니다',
  elder: '시무장로 · 은퇴장로',
  staff: '사무간사 · 관리집사 등',
}

const GROUP_PRESETS: Record<PersonCategory, string[]> = {
  pastor: ['부목사', '전도사', '강도사', '교육전도사', '명예전도사'],
  missionary: ['파송선교사', '협력선교사'],
  elder: ['시무장로', '은퇴장로', '협동장로'],
  staff: ['사무간사', '관리집사', '차량봉사'],
}

const ROLE_PRESETS: Record<PersonCategory, string[]> = {
  pastor: ['목사', '전도사', '강도사'],
  missionary: ['선교사'],
  elder: ['장로'],
  staff: ['간사', '집사'],
}

/** ko/en 쌍을 한 덩어리로 다루는 폼 상태 */
type Bilingual = { ko: string; en: string }

const pair = (person: Person | undefined, field: PersonTextField): Bilingual => ({
  ko: (person?.[`${field}_ko` as keyof Person] as string | null) ?? '',
  en: (person?.[`${field}_en` as keyof Person] as string | null) ?? '',
})

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors'

const datePickerTriggerClass =
  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] text-left text-ink-strong hover:border-brand focus:outline-none focus:border-brand transition-colors'

const PersonComposer = ({
  person,
  defaultCategory = 'pastor',
  onClose,
  onSuccess,
}: PersonComposerProps) => {
  const isEdit = !!person
  const createMutation = useCreatePerson()
  const updateMutation = useUpdatePerson()
  const uploadMutation = useUploadPersonPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('basic')
  const [error, setError] = useState<string | null>(null)

  // 사진 — 저장 시점에만 업로드한다(취소하면 R2에 고아 파일이 남지 않는다)
  const [photoUrl, setPhotoUrl] = useState(person?.photo_url ?? '')
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(person?.photo_url ?? null)

  const [category, setCategory] = useState<PersonCategory>(person?.category ?? defaultCategory)
  const [group, setGroup] = useState<Bilingual>(pair(person, 'group'))
  const [name, setName] = useState<Bilingual>(pair(person, 'name'))
  const [role, setRole] = useState<Bilingual>(pair(person, 'role'))
  const [isPublished, setIsPublished] = useState(person?.is_published ?? true)

  const [assignments, setAssignments] = useState<Bilingual>(pair(person, 'assignments'))
  const [bio, setBio] = useState<Bilingual>(pair(person, 'bio'))
  const [verse, setVerse] = useState<Bilingual>(pair(person, 'verse'))
  const [startedOn, setStartedOn] = useState(person?.started_on ?? '')

  const [phone, setPhone] = useState(person?.phone ?? '')
  const [email, setEmail] = useState(person?.email ?? '')
  const [field, setField] = useState<Bilingual>(pair(person, 'field'))
  const [org, setOrg] = useState<Bilingual>(pair(person, 'org'))
  const [countryCode, setCountryCode] = useState(person?.country_code ?? '')

  useModalBackButton(onClose)

  const submitting =
    createMutation.isPending || updateMutation.isPending || uploadMutation.isPending
  const canSubmit = name.ko.trim().length > 0 && !submitting

  // 담임·원로목사를 여기 적고 있으면 저장 전에 알린다 (대표 카드는 인사말 관리가 단일 출처)
  const misplacedLeader = looksLikeLeaderRole({ role_ko: role.ko, group_ko: group.ko })

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
        category,
        group_ko: group.ko.trim(),
        group_en: group.en.trim(),
        name_ko: name.ko.trim(),
        name_en: name.en.trim(),
        role_ko: role.ko.trim(),
        role_en: role.en.trim(),
        photo_url: finalPhoto,
        phone: phone.trim(),
        email: email.trim(),
        assignments_ko: assignments.ko,
        assignments_en: assignments.en,
        bio_ko: bio.ko,
        bio_en: bio.en,
        verse_ko: verse.ko.trim(),
        verse_en: verse.en.trim(),
        field_ko: field.ko.trim(),
        field_en: field.en.trim(),
        // 국가 코드는 flag-icons 가 소문자만 안다
        country_code: countryCode.trim().toLowerCase().slice(0, 2),
        org_ko: org.ko.trim(),
        org_en: org.en.trim(),
        // 빈 문자열을 DATE 컬럼에 보내면 422 — 미입력은 null 로 넘긴다
        started_on: startedOn || null,
        is_published: isPublished,
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: person.id, data: payload })
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
              {isEdit ? '인물 수정' : '인물 등록'}
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
                {/* 분류 — pill grid (native select 금지) */}
                <FieldGroup label="분류" required>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(Object.keys(CATEGORY_LABEL) as PersonCategory[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        className={[
                          'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-colors',
                          category === value
                            ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)]'
                            : 'bg-transparent border-gray-200 dark:border-white/[0.08] hover:bg-[var(--brand-soft)]',
                        ].join(' ')}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            category === value ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                        />
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block text-[13px] font-bold ${
                              category === value ? 'text-brand' : 'text-ink-strong'
                            }`}
                          >
                            {CATEGORY_LABEL[value].ko}
                          </span>
                          <span className="block text-[11px] text-gray-500 dark:text-white/45 mt-0.5">
                            {CATEGORY_DESC[value]}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2 leading-[1.5]">
                    * 담임목사·원로목사는 여기서 등록하지 않습니다 — 인사말 관리(/admin/pastors)에
                    등록된 분이 교역자 탭 맨 위에 자동으로 표시됩니다.
                  </p>
                </FieldGroup>

                {/* 사진 */}
                <FieldGroup label="사진">
                  <p className="text-[11px] text-gray-400 dark:text-white/40 mb-2">
                    세로 인물 사진이 가장 잘 맞습니다(카드는 3:4). 비율을 유지한 채 자동으로 줄여서 저장됩니다.
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

                <BilingualField label="이름" required value={name} onChange={setName} placeholder="예) 최요한" />
                <BilingualField
                  label="직분 (이름 뒤에 붙는 말)"
                  value={role}
                  onChange={setRole}
                  placeholder={`예) ${ROLE_PRESETS[category][0]}`}
                  presets={ROLE_PRESETS[category]}
                />
                <BilingualField
                  label="소속 그룹 (탭 안의 소제목)"
                  value={group}
                  onChange={setGroup}
                  placeholder={`예) ${GROUP_PRESETS[category][0]}`}
                  hint="같은 그룹끼리 묶여서 표시됩니다. 비우면 분류 이름으로 묶입니다. '명예전도사'·'은퇴장로' 같은 예우 그룹은 현직 뒤에 놓입니다."
                  presets={GROUP_PRESETS[category]}
                />

                {misplacedLeader && (
                  <div className="px-3.5 py-3 rounded-xl bg-[var(--amber-soft)] border border-[var(--amber-soft-strong)]">
                    <p className="text-[12.5px] font-bold text-ink-strong mb-1">
                      담임목사 · 원로목사는 이 화면이 아닙니다
                    </p>
                    <p className="text-[11.5px] leading-[1.6] text-gray-600 dark:text-white/60">
                      두 분은 <span className="font-semibold">인사말 관리(/admin/pastors)</span>에 등록해야
                      섬기는 사람들 맨 위 대표 카드로 올라갑니다(원로목사는 상태를 &lsquo;원로목사&rsquo;로).
                      여기 저장하면 교역자 목록의 일반 카드로만 보이고, 두 곳에 있으면 두 번 보입니다.
                    </p>
                  </div>
                )}

                {/* 공개 여부 */}
                <FieldGroup label="공개">
                  <button
                    type="button"
                    onClick={() => setIsPublished((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:border-brand transition-colors"
                  >
                    <span className="text-left min-w-0">
                      <span className="block text-[13px] font-bold text-ink-strong">
                        {isPublished ? '섬기는 사람들 페이지에 표시' : '숨김 (관리자만 확인)'}
                      </span>
                      <span className="block text-[11px] text-gray-500 dark:text-white/45 mt-0.5">
                        사진을 아직 못 받았다면 숨겨두고 나중에 공개할 수 있어요
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

            {step === 'ministry' && (
              <>
                <BilingualField
                  label="담당 사역"
                  value={assignments}
                  onChange={setAssignments}
                  multiline
                  rows={6}
                  hint="한 줄에 하나씩 — 화면에서 칩으로 그려집니다. 예) 2교구 / 2청년부 / 참빛선교회"
                  placeholder={'2교구\n2청년부\n참빛선교회'}
                />
                <BilingualField
                  label="소개"
                  value={bio}
                  onChange={setBio}
                  multiline
                  rows={6}
                  placeholder="어떤 마음으로 섬기고 계신지 한 문단으로 소개해주세요."
                />
                <BilingualField
                  label="삶의 말씀"
                  value={verse}
                  onChange={setVerse}
                  placeholder="예) 내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라 (빌 4:13)"
                />
                <FieldGroup label={`${CATEGORY_DATE_LABEL[category].ko}일`}>
                  <DatePicker
                    value={startedOn}
                    onChange={setStartedOn}
                    className={datePickerTriggerClass}
                    placeholder="선택"
                  />
                </FieldGroup>
              </>
            )}

            {step === 'contact' && (
              <>
                <FieldGroup label="전화번호">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="예) 032-323-1004"
                    className={inputCls}
                  />
                  <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">
                    카드 상세에서 바로 걸 수 있는 번호로 보입니다(공개).
                  </p>
                </FieldGroup>

                <FieldGroup label="이메일">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="예) name@chambit.org"
                    className={inputCls}
                  />
                </FieldGroup>

                {category === 'missionary' ? (
                  <>
                    <BilingualField
                      label="사역지"
                      value={field}
                      onChange={setField}
                      placeholder="예) 캄보디아 프놈펜"
                    />
                    <FieldGroup label="국가 코드">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          placeholder="kh"
                          maxLength={2}
                          className={`${inputCls} uppercase tracking-[0.2em] w-24`}
                        />
                        <span className="inline-flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/50">
                          {countryCode.trim().length === 2 ? (
                            <CountryFlag code={countryCode} className="text-[20px]" />
                          ) : null}
                          국기 미리보기
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">
                        두 글자 국가 코드 — 캄보디아 kh, 일본 jp, 베트남 vn, 미국 us, 태국 th,
                        필리핀 ph, 몽골 mn, 중국 cn. 모르면 비워두세요(국기 없이 표시됩니다).
                      </p>
                    </FieldGroup>
                    <BilingualField
                      label="파송기관 / 소속"
                      value={org}
                      onChange={setOrg}
                      placeholder="예) GMS"
                    />
                  </>
                ) : (
                  <BilingualField
                    label="소속 (선택)"
                    value={org}
                    onChange={setOrg}
                    placeholder="예) 참빛선교회"
                  />
                )}
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
 * 한국어 입력이 기본, 영문은 접혀 있다(선택 입력이고 비면 한국어로 폴백된다).
 * presets 를 주면 자주 쓰는 값을 한 번에 넣는 칩이 아래 붙는다 — 직분·그룹처럼
 * 같은 문자열을 수십 번 타이핑하는 칸의 오타를 줄인다.
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
  presets,
}: {
  label: string
  required?: boolean
  value: Bilingual
  onChange: (next: Bilingual) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  hint?: string
  presets?: string[]
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
      {presets && presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange({ ...value, ko: preset })}
              className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                value.ko === preset
                  ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
                  : 'bg-transparent border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:bg-[var(--brand-soft)]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
      {hint && (
        <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1 leading-[1.5]">{hint}</p>
      )}
    </div>
  )
}

export default PersonComposer
