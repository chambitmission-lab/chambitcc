// /dev/offering-admin — 온라인 헌금 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 OfferingDesk 를 표본으로 띄운다. 성도 화면 미리보기(OfferingSection)는
// 공개 쿼리 캐시(offeringKeys.all)를 보므로 표본을 거기에도 심어, 공개·순서를 바꾸면 같이 바뀐다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import OfferingDesk from '../Admin/components/OfferingDesk'
import type { OfferingSel } from '../Admin/components/offeringDeskUtils'
import { offeringKeys } from '../../hooks/useOffering'
import type { OfferingAccount, OfferingData, OfferingGuide } from '../../types/offering'
import { showToast } from '../../utils/toast'

const GUIDE: OfferingGuide = {
  id: 1,
  title_ko: '온라인 헌금 안내',
  intro_ko: '교회에 직접 오시기 어려운 분들을 위해 온라인으로도 헌금하실 수 있어요.',
  method_title_ko: '입금 방법',
  deposit_format_ko: '헌금자명 + 핸드폰 뒷번호 4자리',
  deposit_desc_ko: '예) 홍길동1234 — 헌금 종류별 계좌로 보내 주세요.',
  note_ko: '',
  verse_text_ko: '각각 그 마음에 정한 대로 할 것이요 인색함으로나 억지로 하지 말지니 하나님은 즐겨 내는 자를 사랑하시느니라',
  verse_ref_ko: '고린도후서 9:7',
  updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
}

const acc = (id: number, label_ko: string, account_number: string, holder_ko: string, is_active = true, note_ko = ''): OfferingAccount => ({
  id,
  label_ko,
  bank_ko: id === 3 ? '우리은행' : '국민은행',
  account_number,
  holder_ko,
  note_ko,
  sort_order: id,
  is_active,
})

const ACCOUNTS: OfferingAccount[] = [
  acc(1, '십일조 · 감사헌금', '123-45-678901', '참빛교회'),
  acc(2, '선교헌금', '123-45-678902', '참빛교회', true, '해외 선교사님 후원에 쓰여요.'),
  acc(3, '건축헌금', '1002-345-678901', ''),
  acc(4, '구제헌금', '123-45-678904', '참빛교회', false),
]

const OfferingAdminPreview = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [accounts, setAccounts] = useState<OfferingAccount[]>(ACCOUNTS)
  const [selected, setSelected] = useState<OfferingSel | null>(null)

  // 성도 화면 미리보기가 보는 공개 캐시 — 숨김은 빼고 심는다
  useEffect(() => {
    qc.setQueryData<OfferingData>(offeringKeys.all, { guide: GUIDE, accounts: accounts.filter((a) => a.is_active) })
  }, [qc, accounts])

  const swap = (a: OfferingAccount, d: 'up' | 'down') =>
    setAccounts((l) => {
      const i = l.findIndex((x) => x.id === a.id)
      const j = d === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= l.length) return l
      const next = [...l]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })

  return (
    <OfferingDesk
      guide={GUIDE}
      accounts={accounts}
      loading={false}
      selected={selected}
      onSelect={setSelected}
      onCreateAccount={() => showToast('미리보기 — 계좌 추가는 실제 화면에서', 'info')}
      onBack={() => navigate(-1)}
      onEditGuide={() => showToast('미리보기 — 안내 문구 수정', 'info')}
      onEditAccount={(a) => showToast(`미리보기 — ${a.label_ko} 수정`, 'info')}
      onToggleAccount={(a) => setAccounts((l) => l.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)))}
      onMoveAccount={swap}
      onDeleteAccount={(a) => setAccounts((l) => l.filter((x) => x.id !== a.id))}
      onCopyTest={(a) => showToast(`미리보기 — ${a.account_number.replace(/[^0-9]/g, '')} 복사`, 'info')}
      onViewPublic={() => navigate('/news?tab=offering')}
    />
  )
}

export default OfferingAdminPreview
