// 푸시 알림 관리 (admin, /admin/push)
// Single Responsibility: 작성 상태·발송·보낸 기록 조회.
// 화면은 PushDesk(관리 데스크 — 왼쪽 새 알림 + 보낸 기록, 오른쪽 작성 패널 또는 기록 상세, 2026-11-27),
// 작성 패널은 PushComposePanel, 받는 사람 고르기는 AudiencePicker 가 그린다.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getPushHistory, sendPush, PushResultUnavailableError, type PushPayload, type PushSendLog } from '../../api/push'
import { useAudiencePicker } from '../../hooks/useAudiencePicker'
import { adminKeys } from '../../hooks/queryKeys'
import { confirmDialog } from '../../utils/confirmDialog'
import { showToast } from '../../utils/toast'
import { can } from '../../utils/access'
import PushDesk from './components/PushDesk'
import PushComposePanel, { type PushDraft, type PushResult } from './components/PushComposePanel'
import { BODY_MAX, DEFAULT_ICON, NOTIFICATIONS_URL, TITLE_MAX, type PushPreset } from './components/pushDeskUtils'

const HISTORY_PAGE_SIZE = 20
const pushHistoryKey = adminKeys.pushHistory()

const EMPTY_DRAFT: PushDraft = { title: '', body: '', url: NOTIFICATIONS_URL, tag: 'notification', icon: DEFAULT_ICON }

export const PushNotificationManagement = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [draft, setDraft] = useState<PushDraft>(EMPTY_DRAFT)
  const patch = (p: Partial<PushDraft>) => setDraft((d) => ({ ...d, ...p }))

  const picker = useAudiencePicker({
    onLoadUsersError: () => showToast('사용자 목록을 불러오는데 실패했습니다', 'error'),
  })
  const { audienceMode, audienceUserIds, audienceCount, audienceLabel } = picker

  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<PushResult>(null)

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void picker.loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  const history = useInfiniteQuery({
    queryKey: pushHistoryKey,
    queryFn: ({ pageParam }) => getPushHistory({ page: pageParam as number, limit: HISTORY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const logs = history.data?.pages.flatMap((p) => p.items) ?? []
  const total = history.data?.pages[0]?.total ?? 0

  const applyPreset = (p: PushPreset) => {
    patch({ title: p.title, body: p.body, url: p.url, tag: p.tag })
    showToast(`'${p.title}' 내용을 채웠어요`, 'success')
  }

  const handleSend = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      showToast('제목과 내용을 입력해주세요', 'error')
      return
    }
    if (audienceMode !== 'all' && (!audienceUserIds || audienceUserIds.length === 0)) {
      showToast('전송할 대상이 없습니다', 'error')
      return
    }
    if (
      !(await confirmDialog({
        title: '푸시 알림 보내기',
        message: `${audienceLabel}에게 보낼까요?`,
        description: '보낸 알림은 취소할 수 없어요. 알림함(알림 벨)에도 함께 남아요.',
        confirmText: '보내기',
        tone: 'brand',
        icon: 'send',
      }))
    )
      return

    setIsSending(true)
    setResult(null)
    try {
      const payload: PushPayload = {
        title: draft.title.trim(),
        body: draft.body.trim(),
        icon: draft.icon.trim() || DEFAULT_ICON,
        image: 'pwa-512x512.png',
        url: draft.url.trim() || '/',
        tag: draft.tag.trim() || 'notification',
      }
      const data = await sendPush(
        { payload, user_ids: audienceUserIds, audience_mode: audienceMode, audience_label: audienceLabel },
        // 서버가 발송을 받아 백그라운드로 보내는 동안 — 창을 닫아도 발송은 계속된다
        { onStarted: () => setResult({ ok: 'pending', audienceLabel }) },
      )
      setResult({ ok: true, data, audienceLabel })
      void queryClient.invalidateQueries({ queryKey: pushHistoryKey })
      if (data.failed === 0 && data.sent > 0) showToast(`${data.sent}명에게 보냈어요`, 'success')
      else if (data.sent === 0) showToast('실제로 닿은 사람이 없어요', 'error')
      else showToast(`${data.sent}명 성공 · ${data.failed}명 실패`, 'success')
    } catch (error) {
      if (error instanceof PushResultUnavailableError) {
        // 발송은 나갔거나 진행 중이고 결과만 못 받은 경우 — 실패로 보이지 않게 기록으로 안내
        setResult(null)
        void queryClient.invalidateQueries({ queryKey: pushHistoryKey })
        showToast(error.message, 'info')
        return
      }
      const message = error instanceof Error ? error.message : '푸시 알림 전송에 실패했습니다'
      setResult({ ok: false, message })
      showToast(message, 'error')
    } finally {
      setIsSending(false)
    }
  }

  // 기록에서 "다시 쓰기" — 지난 내용을 그대로 채운다 (받는 사람은 다시 고르게 둔다)
  const reuseLog = (log: PushSendLog) => {
    setDraft((d) => ({
      ...d,
      title: log.title.slice(0, TITLE_MAX),
      body: log.body.slice(0, BODY_MAX),
      url: log.url || NOTIFICATIONS_URL,
      tag: log.tag || 'notification',
    }))
    setResult(null)
    showToast('지난 알림 내용을 채웠어요 — 받는 사람을 확인하세요', 'success')
  }

  const handleReset = () => {
    setDraft(EMPTY_DRAFT)
    picker.reset()
    setResult(null)
  }

  const canSend = draft.title.trim().length > 0 && draft.body.trim().length > 0 && !isSending && audienceCount > 0

  return (
    <PushDesk
      logs={logs}
      total={total}
      loading={history.isPending}
      error={history.isError}
      hasMore={!!history.hasNextPage}
      loadingMore={history.isFetchingNextPage}
      onLoadMore={() => void history.fetchNextPage()}
      members={{ all: picker.users.length, active: picker.activeCount }}
      onBack={() => navigate(-1)}
      onReuse={reuseLog}
      renderCompose={(onClose) => (
        <PushComposePanel
          draft={draft}
          onChange={patch}
          onApplyPreset={applyPreset}
          picker={picker}
          sending={isSending}
          result={result}
          canSend={canSend}
          onSend={() => void handleSend()}
          onReset={handleReset}
          onClose={onClose}
        />
      )}
    />
  )
}

export default PushNotificationManagement
