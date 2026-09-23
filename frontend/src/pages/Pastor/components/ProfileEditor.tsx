// 성도 명부 편집 — 교역자 공동 편집. 성도 본인에게는 보이지 않는 목양 정보.
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showToast } from '../../../utils/toast'
import { saveMemberProfile, type MemberProfile } from '../../../api/pastor'
import { FieldLabel, GhostButton, PastorModal, PrimaryButton } from './ui'
import { inputCls } from './pastorUtils'
import { CHURCH_TITLES } from '../../../utils/churchTitles'

// 자주 쓰는 직분은 pill 로(관리자 회원관리와 같은 목록 + 청년·학생), 그 밖은 직접 입력
const COMMON_TITLES = [...CHURCH_TITLES, '청년', '학생']

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
      void qc.invalidateQueries({ queryKey: ['pastor-member', memberId], refetchType: 'all' })
      void qc.invalidateQueries({ queryKey: ['pastor-roster'], refetchType: 'all' })
      void qc.invalidateQueries({ queryKey: ['pastor-home'], refetchType: 'all' })
      void qc.invalidateQueries({ queryKey: ['pastor-suggestions'], refetchType: 'all' })
      void qc.invalidateQueries({ queryKey: ['pastor-briefing', memberId], refetchType: 'all' })
      onClose()
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const districts = districtSuggestions.filter(d => d !== form.district).slice(0, 12)

  return (
    <PastorModal
      title={`${memberName} · 명부`}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose}>취소</GhostButton>
          <PrimaryButton disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? '저장 중...' : '저장'}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[12px] text-gray-600 dark:text-white/60 leading-relaxed">
        교역자 모두가 함께 보고 고치는 정보입니다. 성도님 본인에게는 직분만 보이고 나머지는 보이지 않습니다.
      </p>

      <div>
        <FieldLabel hint="본인 프로필에도 보입니다">직분</FieldLabel>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_TITLES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('church_title', form.church_title === t ? '' : t)}
              className={`px-3 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors ${
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
          className={inputCls}
          value={form.church_title}
          maxLength={30}
          placeholder="직접 입력 (예: 시무권사)"
          onChange={e => set('church_title', e.target.value)}
        />
      </div>

      <div>
        <FieldLabel>구역 · 목장</FieldLabel>
        <input
          className={inputCls}
          value={form.district}
          maxLength={50}
          placeholder="예: 3구역, 청년 2목장"
          onChange={e => set('district', e.target.value)}
        />
        {districts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {districts.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => set('district', d)}
                className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[12px] font-semibold text-gray-600 dark:text-white/65 hover:text-brand"
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>생일</FieldLabel>
          <input type="date" className={inputCls} value={form.birthday} onChange={e => set('birthday', e.target.value)} />
          <button
            type="button"
            onClick={() => set('birthday_lunar', !form.birthday_lunar)}
            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-gray-600 dark:text-white/65"
          >
            <span className={`material-icons-outlined text-[18px] ${form.birthday_lunar ? 'text-brand' : ''}`}>
              {form.birthday_lunar ? 'check_box' : 'check_box_outline_blank'}
            </span>
            음력 생일
          </button>
        </div>
        <label className="block">
          <FieldLabel>교회 등록일</FieldLabel>
          <input
            type="date"
            className={inputCls}
            value={form.registered_at}
            onChange={e => set('registered_at', e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <FieldLabel>연락처</FieldLabel>
        <input
          className={inputCls}
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
          className={inputCls}
          value={form.address}
          maxLength={200}
          placeholder="심방 갈 때 쓰는 주소"
          onChange={e => set('address', e.target.value)}
        />
      </label>

      <label className="block">
        <FieldLabel>가족 관계</FieldLabel>
        <textarea
          className={`${inputCls} min-h-[72px] resize-y`}
          value={form.family_note}
          maxLength={2000}
          placeholder="예: 배우자 김○○ 집사, 자녀 2명(고1·중2)"
          onChange={e => set('family_note', e.target.value)}
        />
      </label>

      <label className="block">
        <FieldLabel hint="교역자 모두에게 보입니다">함께 기억할 것</FieldLabel>
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          value={form.pastoral_note}
          maxLength={4000}
          placeholder="오래 품고 있는 기도 제목, 형편, 섬기는 부서 등"
          onChange={e => set('pastoral_note', e.target.value)}
        />
      </label>
    </PastorModal>
  )
}

export default ProfileEditor
