// 섬기는 사람 등록/수정 — slide-up 컴포저 모달
//
// 교역자·선교사·장로·직원이 한 폼을 공유한다. 카테고리 pill 을 고르면 그 분류에만
// 필요한 칸(선교사의 사역지·국가)이 나타난다 — 빈 칸이 늘어놓이지 않게.
// 한/영은 필드마다 접히는 영문 입력으로. 영문은 선택이고 비우면 한국어로 폴백된다.
import { useRef, useState } from 'react'
import { showToast } from '../../../utils/toast'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { FieldGroup, dateTriggerClass } from '../../../components/common/ComposerFields'
import AdminComposerShell from './AdminComposerShell'
import { ComposerFooter, inputCls } from './AdminFormBits'
import BilingualField, { type Bilingual } from './BilingualField'
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

const pair = (person: Person | undefined, field: PersonTextField): Bilingual => ({
  ko: (person?.[`${field}_ko` as keyof Person] as string | null) ?? '',
  en: (person?.[`${field}_en` as keyof Person] as string | null) ?? '',
})

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
      title={isEdit ? '인물 수정' : '인물 등록'}
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
        </>,
        <>
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
                  <div className="px-3.5 py-3 rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-glow)]">
                    <p className="text-[12.5px] font-bold text-ink-strong mb-1">
                      담임목사 · 원로목사는 인사말 관리와 짝이 됩니다
                    </p>
                    <p className="text-[11.5px] leading-[1.6] text-gray-600 dark:text-white/60">
                      이름 · 직분 · 인사말은{' '}
                      <span className="font-semibold">인사말 관리(/admin/pastors)</span>가 단일 출처입니다.
                      여기에 같은 이름으로 등록해 두면 섬기는 사람들 맨 위 대표 카드가{' '}
                      <span className="font-semibold">이 기록의 사진</span>을 먼저 쓰고(비우면 인사말 사진),
                      카드를 누르면 담당 사역 · 연락처 시트가 열립니다. 두 곳에 있어도 한 번만 보입니다.
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
          {errorBox}
        </>,
      ] : undefined}
    >
            {step === 'ministry' && (
              <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:items-start">
                <BilingualField
                  label="담당 사역"
                  value={assignments}
                  onChange={setAssignments}
                  multiline
                  rows={6}
                  lgMinH="lg:min-h-[200px]"
                  hint="한 줄에 하나씩 — 화면에서 칩으로 그려집니다. 예) 2교구 / 2청년부 / 참빛선교회"
                  placeholder={'2교구\n2청년부\n참빛선교회'}
                />
                <BilingualField
                  label="소개"
                  value={bio}
                  onChange={setBio}
                  multiline
                  rows={6}
                  lgMinH="lg:min-h-[200px]"
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
                    className={dateTriggerClass}
                    placeholder="선택"
                  />
                </FieldGroup>
              </div>
            )}

            {step === 'contact' && (
              <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5 lg:items-start">
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
              </div>
            )}

      {errorBox}
    </AdminComposerShell>
  )
}

export default PersonComposer
