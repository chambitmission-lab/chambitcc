/**
 * 홈(기도 목록) 팝업 공지
 *
 * 관리자가 "팝업으로 띄우기"를 켠 공지를 홈 진입 시 전면 팝업으로 한 건씩 보여주고,
 * 닫은 뒤에도 홈 상단에 얇은 배너를 남겨 언제든 다시 열 수 있게 한다.
 * '오늘 하루 안 보기 / 다시 안 보기'는 기기 로컬 설정(utils/noticeDismiss)이라
 * 서버에 남지 않는다 — 비로그인 방문자도 동일하게 동작한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarkAsRead, usePopupNotices } from '../../../hooks/useNotifications'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import {
  dismissNoticeForToday,
  dismissNoticeForever,
  isNoticeDismissed,
  markNoticeSeenThisSession,
} from '../../../utils/noticeDismiss'

/**
 * 공지 링크 → 실제 이동 대상.
 * /prayers/:id 는 전용 페이지가 아니라 홈의 기도 상세 모달이라 state로 넘겨야 한다
 * (NotificationModal의 resolveTarget과 같은 규칙).
 */
const resolveTarget = (
  linkUrl: string,
): { path: string; state?: Record<string, unknown> } => {
  const prayer = linkUrl.match(/^\/prayers\/(\d+)$/)
  if (prayer) return { path: '/', state: { openPrayerId: Number(prayer[1]) } }
  return { path: linkUrl }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })

const HomeNotice = () => {
  const navigate = useNavigate()
  const { data } = usePopupNotices()
  const markAsRead = useMarkAsRead()
  const isLoggedIn = !!localStorage.getItem('access_token')

  const notices = useMemo(() => data ?? [], [data])
  // 이번 방문에서 이미 닫은 공지 — '안 보기'와 달리 저장하지 않는다(다음 진입 때 다시 뜸)
  const [closedIds, setClosedIds] = useState<ReadonlySet<number>>(() => new Set())
  // 배너로 다시 열었을 때는 '안 보기'로 숨긴 공지까지 전부 보여준다
  const [showDismissed, setShowDismissed] = useState(false)
  const readMarkedRef = useRef<Set<number>>(new Set())

  // 아직 띄워야 할 공지들 (최신순). 앞에서부터 한 건씩 보여준다.
  const queue = useMemo(
    () =>
      notices.filter(
        (n) =>
          !closedIds.has(n.id) &&
          (showDismissed || !isNoticeDismissed(n.id, n.updated_at)),
      ),
    [notices, closedIds, showDismissed],
  )

  const current = queue[0]

  // 팝업으로 본 공지는 읽음 처리 — 헤더 알림 뱃지가 이미 확인한 공지로 계속 울리지 않게
  useEffect(() => {
    if (!current || !isLoggedIn || current.is_read) return
    if (readMarkedRef.current.has(current.id)) return
    readMarkedRef.current.add(current.id)
    markAsRead.mutate(current.id, { onError: () => {} })
  }, [current, isLoggedIn, markAsRead])

  const closeCurrent = useCallback(() => {
    const notice = queue[0]
    if (!notice) return
    // 홈을 떠났다 돌아와도 방금 확인한 팝업이 다시 뜨지 않게 (앱 재시작 시엔 다시 노출)
    markNoticeSeenThisSession(notice.id, notice.updated_at)
    setClosedIds((prev) => {
      const next = new Set(prev)
      next.add(notice.id)
      return next
    })
  }, [queue])

  const handleToday = () => {
    if (current) dismissNoticeForToday(current.id, current.updated_at)
    closeCurrent()
  }

  const handleForever = () => {
    if (current) dismissNoticeForever(current.id, current.updated_at)
    closeCurrent()
  }

  const handleLink = () => {
    if (!current?.link_url) return
    const target = resolveTarget(current.link_url)
    closeCurrent()
    navigate(target.path, { state: target.state })
  }

  // 배너 → 팝업 다시 열기 (안 보기로 숨긴 공지도 여기서는 다시 볼 수 있다)
  const reopen = () => {
    setShowDismissed(true)
    setClosedIds(new Set())
  }

  useModalBackButton(closeCurrent, !!current)

  if (notices.length === 0) return null

  const latest = notices[0]

  return (
    <>
      <style>{`
        @keyframes notice-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes notice-card-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notice-backdrop { animation: notice-backdrop-in 0.16s ease-out; }
        .notice-card { animation: notice-card-in 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
        @media (prefers-reduced-motion: reduce) {
          .notice-backdrop, .notice-card { animation: none; }
        }
      `}</style>

      {/* 홈 상단 배너 — 팝업을 닫아도 확인 경로가 남는다 */}
      <button
        type="button"
        onClick={reopen}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors active:opacity-80"
        style={{
          background: 'var(--brand-soft)',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        <span
          className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full"
          style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
          aria-hidden
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11v3a1 1 0 0 0 1 1h2.5l4.5 4V6l-4.5 4H4a1 1 0 0 0-1 1Z" />
            <path d="M16 9a4 4 0 0 1 0 6" />
          </svg>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold truncate" style={{ color: 'var(--text-strong)' }}>
            {latest.title}
          </span>
          {notices.length > 1 && (
            <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              외 {notices.length - 1}건의 공지
            </span>
          )}
        </span>
        <span className="shrink-0 text-[11.5px] font-semibold" style={{ color: 'var(--brand)' }}>
          보기
        </span>
      </button>

      {/* 전면 팝업 */}
      {current && (
        <div
          className="notice-backdrop fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCurrent}
        >
          <div
            className="notice-card relative w-full max-w-md max-h-[88vh] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--surface-container)',
              border: '1px solid var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="공지사항"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold tracking-[0.12em]" style={{ color: 'var(--brand)' }}>
                  공지사항
                </p>
                <h2
                  className="mt-1 text-[18px] font-bold leading-snug tracking-[-0.015em]"
                  style={{ color: 'var(--text-strong)' }}
                >
                  {current.title}
                </h2>
                <p className="mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(current.created_at)}
                  {queue.length > 1 && ` · 1/${queue.length}`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCurrent}
                aria-label="닫기"
                className="shrink-0 w-9 h-9 -mr-1.5 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--brand-soft)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {current.image_url && (
                <img
                  src={current.image_url}
                  alt=""
                  className="w-full rounded-2xl mb-3.5 object-contain"
                  style={{
                    maxHeight: '46vh',
                    background: 'var(--surface-inset)',
                    filter: 'var(--media-dim)',
                  }}
                />
              )}
              <p
                className="text-[14.5px] leading-[1.75] whitespace-pre-wrap break-words"
                style={{ color: 'var(--text-body)' }}
              >
                {current.content}
              </p>

              {current.link_url && (
                <button
                  type="button"
                  onClick={handleLink}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold"
                  style={{ color: 'var(--brand)' }}
                >
                  바로가기
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>

            {/* 푸터 — 확인이 주 동작, 안 보기는 한 단계 낮은 위계 */}
            <div
              className="px-5 pt-3 pb-4"
              style={{ borderTop: '1px solid var(--card-border)' }}
            >
              <button
                type="button"
                onClick={closeCurrent}
                className="w-full h-12 rounded-2xl text-[15px] font-bold brand-gradient active:opacity-90 transition-opacity"
              >
                {queue.length > 1 ? '다음 공지 보기' : '확인'}
              </button>
              <div className="mt-2.5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2 py-1 text-[12.5px] font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  오늘 하루 안 보기
                </button>
                <span className="w-px h-3" style={{ background: 'var(--card-border)' }} aria-hidden />
                <button
                  type="button"
                  onClick={handleForever}
                  className="px-2 py-1 text-[12.5px] font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  다시 안 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default HomeNotice
