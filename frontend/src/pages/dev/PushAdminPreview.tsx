// /dev/push-admin — 푸시 알림 관리 데스크 미리보기 (DEV 전용)
//
// 관리자 로그인·백엔드 없이 PushDesk + PushComposePanel 을 표본으로 띄운다. 보내기는 서버 호출 없이
// 가짜 결과만 그린다. 받는 사람 고르기(AudiencePicker)는 회원 목록이 비어 '전체'만 살아 있다.
// 일부 실패·전혀 못 닿음·지난해 기록 표본 포함.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PushDesk from '../Admin/components/PushDesk'
import PushComposePanel, { type PushDraft, type PushResult } from '../Admin/components/PushComposePanel'
import { DEFAULT_ICON, NOTIFICATIONS_URL } from '../Admin/components/pushDeskUtils'
import { useAudiencePicker } from '../../hooks/useAudiencePicker'
import type { PushSendLog } from '../../api/push'
import { showToast } from '../../utils/toast'

const pad = (n: number) => String(n).padStart(2, '0')
const at = (days: number, h: number, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}:00`
}

let seq = 0
const log = (title: string, body: string, days: number, p: Partial<PushSendLog> = {}): PushSendLog => ({
  id: ++seq,
  sender_user_id: 1,
  sender_name: '관리자',
  title,
  body,
  url: NOTIFICATIONS_URL,
  tag: 'notification',
  audience_mode: 'all',
  audience_label: '전체 회원',
  target_count: 214,
  sent: 182,
  failed: 0,
  users_notified: 182,
  recorded: 1,
  created_at: at(days, 9, 30),
  ...p,
})

const LOGS: PushSendLog[] = [
  log('이번 주일은 연합 예배로 드려요', '11시 한 번만 드립니다. 본당으로 모여 주세요.', 1),
  log('새로운 설교', '새로운 설교 영상이 업로드되었습니다.', 3, { url: '/sermon', tag: 'sermon', failed: 7 }),
  log('구역장 모임 안내', '수요일 저녁 7시 교육관 2층입니다.', 9, { audience_mode: 'selected', audience_label: '선택 12명', target_count: 12, sent: 0, failed: 12, users_notified: 0 }),
  log('함께 기도해요', '오늘의 기도 제목에 함께 동참해 주세요.', 24, { url: '/home', tag: 'prayer' }),
  log('관리자 점검', '관리자만 받는 시험 발송입니다.', 40, { audience_mode: 'admin', audience_label: '관리자', target_count: 4, sent: 4, users_notified: 4 }),
  log('성탄 축하 인사', '기쁜 성탄 보내세요!', 340, { recorded: 0 }),
]

const EMPTY: PushDraft = { title: '', body: '', url: NOTIFICATIONS_URL, tag: 'notification', icon: DEFAULT_ICON }

const PushAdminPreview = () => {
  const navigate = useNavigate()
  const picker = useAudiencePicker()
  const [draft, setDraft] = useState(EMPTY)
  const [result, setResult] = useState<PushResult>(null)
  const canSend = !!draft.title.trim() && !!draft.body.trim() && picker.audienceCount > 0

  return (
    <PushDesk
      logs={LOGS}
      total={LOGS.length + 14}
      loading={false}
      error={false}
      hasMore
      loadingMore={false}
      onLoadMore={() => showToast('미리보기 — 지난 기록을 더 불러와요', 'info')}
      members={{ all: 214, active: 196 }}
      onBack={() => navigate(-1)}
      onReuse={(l) => {
        setDraft((d) => ({ ...d, title: l.title, body: l.body, url: l.url || NOTIFICATIONS_URL, tag: l.tag || 'notification' }))
        setResult(null)
      }}
      renderCompose={(onClose) => (
        <PushComposePanel
          draft={draft}
          onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
          onApplyPreset={(p) => setDraft((d) => ({ ...d, title: p.title, body: p.body, url: p.url, tag: p.tag }))}
          picker={picker}
          sending={false}
          result={result}
          canSend={canSend}
          onSend={() => setResult({ ok: true, data: { sent: 180, failed: 3, users_notified: 183, recorded: 1 }, audienceLabel: picker.audienceLabel })}
          onReset={() => {
            setDraft(EMPTY)
            setResult(null)
          }}
          onClose={onClose}
        />
      )}
    />
  )
}

export default PushAdminPreview
