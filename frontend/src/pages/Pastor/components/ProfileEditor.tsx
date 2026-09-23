// 성도 명부 편집 — 교역자 공동 편집. 성도 본인에게는 보이지 않는 목양 정보.
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import { saveMemberProfile, type MemberProfile } from '../../../api/pastor'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls, pickerCls, todayIso } from './pastorUtils'
import DatePicker from '../../../components/common/DatePicker'
import { CHURCH_TITLES } from '../../../utils/churchTitles'

// 자주 쓰는 직분은 pill 로(관리자 회원관리와 같은 목록 + 청년·학생), 그 밖은 직접 입력
const COMMON_TITLES = [...CHURCH_TITLES, '청년', '학생']

// PC(lg)에서 한 단계 큰 입력칸 — 노안 교역자용
const fieldCls = `${inputCls} lg:px-4 lg:py-3.5 lg:text-[17px]`

interface Props {
  memberId: number
  memberName: string
  profile: MemberProfile | null
  districtSuggestions: string[]
  onClose: () => void
}

const ProfileEditor = ({ memberId, memberName, profile, districtSuggestions, onClose }: Props) => {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    church_title: profile?.church_title ?? '',
    district: profile?.district ?? '',
    birthday: profile?.birthday ?? '',
    birthday_lunar: profile?.birthday_lunar ?? false,
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    family_note: profile?.family_note ?? '',
    registered_at: profile?.registered_at ?? '',
    pastoral_note: profile?.pastoral_note ?? '',
  })
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const mutation = useMutation({
    mutationFn: () =>
      saveMemberProfile(memberId, {
        ...form,
        // 날짜는 빈 문자열이면 지우기(null)
        birthday: form.birthday || null,
        registered_at: form.registered_at || null,
      }),
    onSuccess: () => {
      showToast('명부를 저장했습니다', 'success')
      void qc.invalidateQueries({ queryKey: ['pastor-member', memberId] })
      void qc.invalidateQueries({ queryKey: ['pastor-roster'] })
      void qc.invalidateQueries({ queryKey: ['pastor-home'] })
      void qc.invalidateQueries({ queryKey: ['pastor-suggestions'] })
      void qc.invalidateQueries({ queryKey: ['pastor-briefing', memberId] })
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const districts = districtSuggestions.filter(d => d !== form.district).slice(0, 12)

  return (
    <PastorModal
      title={`${memberName} · 명부`}
      onClose={onClose}
      wide
      footer={
        <>
          <GhostButton onClick={onClose}>취소</GhostButton>
          <PrimaryButton disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? '저장 중...' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[12px] lg:text-[14px] text-gray-600 dark:text-white/60 leading-relaxed">
        교역자 모두가 함께 보고 고치는 정보입니다. 성도님 본인에게는 직분만 보이고 나머지는 보이지 않습니다.
      </p>

      {/* PC(lg+): 왼쪽 기본 정보(고르고 짧게 적는 칸) / 오른쪽 가족 관계·함께 기억할 것(길게 쓰는 칸) 2단.
          쓰는 칸 둘이 남는 높이를 나눠 가진다. 모바일은 기존 순서대로 한 줄로 흐른다 */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:min-h-[calc(100%-2.5rem)]">
      <div className="space-y-4 lg:space-y-6 lg:min-w-0">
      <div>
        <FieldLabel hint="본인 프로필에도 보입니다">직분</FieldLabel>
        <div className="flex flex-wrap gap-1.5 lg:gap-2 mb-2 lg:mb-2.5">
          {COMMON_TITLES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('church_title', form.church_title === t ? '' : t)}
              aria-pressed={form.church_title === t}
              className={`px-3 py-1.5 lg:px-4 lg:py-2.5 rounded-full border text-[12.5px] lg:text-[15px] font-semibold transition-colors ${
                form.church_title === t
                  ? 'bg-brand border-brand text-white'
                  : 'border-gray-200 dark:border-white/[0.1] text-gray-600 dark:text-white/70 hover:border-brand'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className={fieldCls}
          value={form.church_title}
          maxLength={30}
          placeholder="직접 입력 (예: 시무권사)"
          onChange={e => set('church_title', e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>구역 · 목장</FieldLabel>
        <input
          className={fieldCls}
          value={form.district}
          maxLength={50}
          placeholder="예: 3구역, 청년 2목장"
          onChange={e => set('district', e.target.value)}
        />
        {districts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 lg:gap-2 mt-2 lg:mt-2.5">
            {districts.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => set('district', d)}
                className="px-2.5 py-1 lg:px-3.5 lg:py-2 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] lg:text-[14.5px] font-semibold text-gray-600 dark:text-white/65 hover:text-brand"
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 날짜는 앱 공용 달력 — 'YYYY년 M월 D일 (요일)'로 읽히고(브라우저 기본은 mm/dd/yyyy),
          PC에선 칸이 큰 달력이 열린다. 생일은 연도 격자부터 열려 먼 해도 몇 번에 고른다 */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <div className="min-w-0">
          <FieldLabel>생일</FieldLabel>
          <DatePicker
            large
            birthMode
            value={form.birthday}
            onChange={v => set('birthday', v)}
            placeholder="생일 고르기"
            className={pickerCls}
          />
          <button
            type="button"
            onClick={() => set('birthday_lunar', !form.birthday_lunar)}
            aria-pressed={form.birthday_lunar}
            className="mt-1.5 lg:mt-2.5 flex items-center gap-1.5 text-[12px] lg:text-[15px] font-semibold text-gray-600 dark:text-white/65"
          >
            <span className={`material-icons-outlined text-[18px] lg:text-[22px] ${form.birthday_lunar ? 'text-brand' : ''}`}>
              {form.birthday_lunar ? 'check_box' : 'check_box_outline_blank'}
            </span>
            음력 생일
          </button>
        </div>
        <div className="min-w-0">
          <FieldLabel>교회 등록일</FieldLabel>
          <DatePicker
            large
            value={form.registered_at}
            onChange={v => set('registered_at', v)}
            maxDate={todayIso()}
            placeholder="등록일 고르기"
            className={pickerCls}
          />
        </div>
      </div>
      {(form.birthday || form.registered_at) && (
        <div className="flex gap-3 -mt-2 lg:-mt-3 text-[12px] lg:text-[14px] font-semibold">
          {/* 달력에는 '지우기'가 없다 — 잘못 넣은 날짜를 비울 길 */}
          {form.birthday && (
            <button type="button" onClick={() => set('birthday', '')} className="text-gray-500 dark:text-white/50 hover:text-brand">
              생일 지우기
            </button>
          )}
          {form.registered_at && (
            <button type="button" onClick={() => set('registered_at', '')} className="text-gray-500 dark:text-white/50 hover:text-brand">
              등록일 지우기
            </button>
          )}
        </div>
      )}

      <label className="block">
        <FieldLabel>연락처</FieldLabel>
        <input
          className={fieldCls}
          value={form.phone}
          maxLength={30}
          inputMode="tel"
          placeholder="010-0000-0000"
          onChange={e => set('phone', e.target.value)}
        />
      </label>

      <label className="block">
        <FieldLabel>주소</FieldLabel>
        <input
          className={fieldCls}
          value={form.address}
          maxLength={200}
          placeholder="심방 갈 때 쓰는 주소"
          onChange={e => set('address', e.target.value)}
        />
      </label>
      </div>{/* /왼쪽: 기본 정보 */}

      <div className="space-y-4 lg:space-y-6 lg:min-w-0 lg:flex lg:flex-col">
      <label className="block lg:flex-1 lg:flex lg:flex-col">
        <FieldLabel>가족 관계</FieldLabel>
        <textarea
          className={`${fieldCls} min-h-[72px] resize-y lg:resize-none lg:flex-1 lg:min-h-[140px] lg:leading-[1.75]`}
          value={form.family_note}
          maxLength={2000}
          placeholder="예: 배우자 김○○ 집사, 자녀 2명(고1·중2)"
          onChange={e => set('family_note', e.target.value)}
        />
      </label>

      <label className="block lg:flex-[1.4] lg:flex lg:flex-col">
        <FieldLabel hint="교역자 모두에게 보입니다">함께 기억할 것</FieldLabel>
        <textarea
          className={`${fieldCls} min-h-[88px] resize-y lg:resize-none lg:flex-1 lg:min-h-[180px] lg:leading-[1.75]`}
          value={form.pastoral_note}
          maxLength={4000}
          placeholder="오래 품고 있는 기도 제목, 형편, 섬기는 부서 등"
          onChange={e => set('pastoral_note', e.target.value)}
        />
      </label>
      </div>{/* /오른쪽: 길게 쓰는 칸 */}
      </div>
    </PastorModal>
  )
}

export default ProfileEditor
