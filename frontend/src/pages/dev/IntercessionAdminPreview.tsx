// /dev/intercession-admin — 누군가의 기도 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 IntercessionDesk 를 표본으로 띄운다. 열기/닫기·지금 시작·신고 처리는
// 이 화면 안에서만 바뀐다(서버 호출 없음). 표본 인물은 가상이다.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IntercessionDesk from '../Admin/components/IntercessionDesk'
import type { IntercessionAdminOverview, IntercessionLetterReport } from '../../api/intercession'
import { showToast } from '../../utils/toast'

const CYCLE = { id: 3, start_date: '2026-11-01', end_date: '2026-12-06', theme_key: null, week_count: 5, current_week: 3 }

const SEED: IntercessionAdminOverview = {
  open: true,
  first_cycle_date: '2026-10-04',
  cycle: CYCLE,
  next_start_date: '2026-12-06',
  active_participants: 128,
  paused_participants: 9,
  linked_givers: 125,
  unlinked_active: 3,
  cycle_prayers: 1342,
  total_prayers: 2987,
  today_givers: 41,
  cycle_letters: 57,
  pending_reports: 2,
}

const REPORTS: IntercessionLetterReport[] = [
  {
    id: 11,
    body: '요즘 많이 힘드시죠.\n제가 매일 저녁 이름을 부르며 기도하고 있어요. 연락처 남겨 주시면 직접 찾아뵐게요.',
    report_reason: '개인 연락처를 요구해요',
    reported_at: '2026-11-24T21:12:00',
    month_start: '2026-11-01',
    sender_name: '김믿음',
    receiver_name: '박소망',
  },
  {
    id: 12,
    body: '기도하고 있어요. 힘내세요!',
    report_reason: null,
    reported_at: '2026-11-20T08:40:00',
    month_start: '2026-11-01',
    sender_name: '이사랑',
    receiver_name: '최은혜',
  },
]

const IntercessionAdminPreview = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(SEED)
  const [reports, setReports] = useState(REPORTS)

  return (
    <IntercessionDesk
      data={{ ...data, pending_reports: reports.length }}
      loading={false}
      reports={reports}
      busy={{ toggling: false, starting: false, resolving: false }}
      onBack={() => navigate(-1)}
      onToggleOpen={() => setData((d) => ({ ...d, open: !d.open }))}
      onStartNow={() => setData((d) => ({ ...d, cycle: { ...CYCLE, current_week: 0 } }))}
      onResolve={(r, restore) => {
        setReports((l) => l.filter((x) => x.id !== r.id))
        showToast(restore ? '되돌렸어요(미리보기)' : '숨김을 확정했어요(미리보기)', 'success')
      }}
      onViewPublic={() => showToast('미리보기 — /intercession 으로 가요', 'info')}
    />
  )
}

export default IntercessionAdminPreview
