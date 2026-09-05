/**
 * 홈(기도 목록) 팝업 공지
 *
 * 관리자가 "팝업으로 띄우기"를 켠 공지를 홈 진입 시 전면 팝업으로 한 건씩 보여주고,
 * 닫은 뒤에도 홈 상단에 얇은 배너를 남겨 언제든 다시 열 수 있게 한다.
 * 단 '다시 안 보기'를 누른 공지는 배너에서도 빼야 한다 — 안 보겠다고 한 공지가
 * 홈 최상단에 계속 남아 있으면 그 선택이 무시된 것처럼 보인다.
 * '오늘 하루 안 보기 / 다시 안 보기'는 기기 로컬 설정(utils/noticeDismiss)이라
 * 서버에 남지 않는다 — 비로그인 방문자도 동일하게 동작한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarkAsRead, usePopupNotices } from '../../../hooks/useNotifications'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
// 포스터 확대 보기는 탭해야 열린다 — lazy 로 분리
const ImageLightbox = lazy(() => import('../../../components/common/ImageLightbox'))
import NoticeContent from '../../../components/common/NoticeContent'
import { noticePreviewText } from '../../../utils/noticeMarkup'
import {
  dismissNoticeForToday,
  dismissNoticeForever,
  isNoticeDismissed,
  isNoticeDismissedForever,
  markNoticeSeenThisSession,
} from '../../../utils/noticeDismiss'
import { tokenStore } from '../../../utils/tokenStore'

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

/** 오늘/어제는 날짜 대신 사람 말로 — 방금 올라온 공지라는 게 먼저 읽힌다 */
const formatRelative = (iso: string) => {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000)
  if (days <= 0) return '오늘'
  if (days === 1) return '어제'
  return formatDate(iso)
}

/** 배너 미리보기 — 서식을 벗기고 한 줄로 눕혀 truncate가 자연스럽게 걸리도록 */
const previewOf = (content: string) => noticePreviewText(content)

const HomeNotice = () => {
  const navigate = useNavigate()
  const { data } = usePopupNotices()
  const markAsRead = useMarkAsRead()
  const isLoggedIn = !!tokenStore.getAccess()

  const notices = useMemo(() => data ?? [], [data])
  // 이번 방문에서 이미 닫은 공지 — '안 보기'와 달리 저장하지 않는다(다음 진입 때 다시 뜸)
  const [closedIds, setClosedIds] = useState<ReadonlySet<number>>(() => new Set())
  // 배너로 다시 열었을 때는 '오늘 하루 안 보기'로 숨긴 공지까지 다시 보여준다
  // ('다시 안 보기'는 예외 — 아래 foreverIds 로 배너·재열기 모두에서 제외)
  const [showDismissed, setShowDismissed] = useState(false)
  // 이번 렌더에서 방금 '다시 안 보기'를 누른 공지 — 저장소 쓰기는 리렌더를 일으키지
  // 않으므로, 누른 즉시 배너에서 빼려면 상태로도 들고 있어야 한다
  const [justDismissed, setJustDismissed] = useState<readonly number[]>([])
  const readMarkedRef = useRef<Set<number>>(new Set())
  // 확대해서 보는 중인 포스터 — 공지 포스터는 글씨가 작아 팝업 안에서는 다 안 읽힌다
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  // '다시 안 보기'로 숨긴 공지 id — 첫 렌더에도 바로 판정해야 배너가 깜빡이지 않는다.
  // 공지가 수정되면 숨김이 무효화되므로 updated_at 이 바뀔 때(notices 갱신)도 다시 본다.
  const foreverIds = useMemo(
    () =>
      new Set([
        ...justDismissed,
        ...notices
          .filter((n) => isNoticeDismissedForever(n.id, n.updated_at))
          .map((n) => n.id),
      ]),
    [notices, justDismissed],
  )

  // 아직 띄워야 할 공지들 (최신순). 앞에서부터 한 건씩 보여준다.
  const queue = useMemo(
    () =>
      notices.filter(
        (n) =>
          !closedIds.has(n.id) &&
          !foreverIds.has(n.id) &&
          (showDismissed || !isNoticeDismissed(n.id, n.updated_at)),
      ),
    [notices, closedIds, foreverIds, showDismissed],
  )

  // 배너에 남길 공지 — '확인'·'오늘 하루'로 닫은 것은 유지, '다시 안 보기'만 제외
  const bannerNotices = useMemo(
    () => notices.filter((n) => !foreverIds.has(n.id)),
    [notices, foreverIds],
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
    if (current) {
      dismissNoticeForever(current.id, current.updated_at)
      const id = current.id
      setJustDismissed((prev) => [...prev, id])
    }
    closeCurrent()
  }

  const handleLink = () => {
    if (!current?.link_url) return
    const target = resolveTarget(current.link_url)
    closeCurrent()
    navigate(target.path, { state: target.state })
  }

  // 배너 → 팝업 다시 열기 ('오늘 하루 안 보기'로 숨긴 공지도 여기서는 다시 볼 수 있다.
  // '다시 안 보기'는 queue 에서 foreverIds 로 제외돼 여기서도 안 뜬다)
  const reopen = () => {
    setShowDismissed(true)
    setClosedIds(new Set())
  }

  useModalBackButton(closeCurrent, !!current)

  if (bannerNotices.length === 0) return null

  const latest = bannerNotices[0]

  return (
    <>
      <style>{`
        @keyframes notice-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes notice-card-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notice-banner-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: none; }
        }
        .notice-backdrop { animation: notice-backdrop-in 0.16s ease-out; }
        .notice-card { animation: notice-card-in 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
        .notice-banner { animation: notice-banner-in 0.32s cubic-bezier(0.16, 1, 0.3, 1); }

        /* 팝업 속 포스터 — 세로로 긴 포스터가 본문을 다 밀어내지 않을 만큼만.
           PC는 화면이 세로로 여유가 있어 한 단계 크게 보여준다 */
        .notice-poster-img { max-height: 46vh; }
        @media (min-width: 1024px) {
          .notice-poster-img { max-height: 58vh; }
        }

        /* 배너 오른쪽 끝 마스코트 — "알림판에 공지 붙이는 양".
           배너는 높이만 ≈81px로 고정이고 가로는 모바일 4.4:1 ~ PC 15:1까지 변한다 →
           cover 금지. 카드색 가로 워시 위에 높이맞춤(auto N%) 삽화를 오른쪽에 얹는다.
           삽화는 사방이 알파로 페이드된 webp라 카드색과 색 맞춤이 따로 필요 없다.
           right 26px 은 셰브런(오른쪽 12~29px) 자리를 비켜 세우기 위한 오프셋. */
        .notice-banner {
          background-image:
            linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container) 34%, rgba(255, 255, 255, 0) 100%),
            url('/images/notice/banner-light.webp');
          background-repeat: no-repeat, no-repeat;
          background-position: left center, right 26px center;
          /* 모바일은 배너 폭이 좁아 제목이 삽화 위를 지나간다 → 한 단계 작게 */
          background-size: 100% 100%, auto 86%;
        }
        @media (min-width: 1024px) {
          .notice-banner { background-size: 100% 100%, auto 100%; }
        }
        [data-theme='dark'] .notice-banner {
          background-image:
            linear-gradient(90deg, var(--surface-container) 0%, var(--surface-container) 34%, rgba(32, 31, 31, 0) 100%),
            url('/images/notice/banner-dark.webp');
        }

        /* 가운데 빈 구간 연출 — 공지 한 장이 날아가 게시판에 붙는다.
           바깥 span 은 배너 폭과 같아서 translateX 의 %가 곧 배너 폭 비율이 된다
           (요소 자기 크기 기준이라, 폭이 358~1192px로 변해도 착지점이 안 흔들린다).
           출발/착지는 변수로 빼서 모바일·PC 각각 삽화 속 '게시판 종이' 위치에 맞춘다 —
           삽화 크기가 모바일 auto 86% / PC auto 100% 로 달라 좌표가 같을 수 없다. */
        .notice-fly {
          /* 모바일: 미리보기 글줄이 끝나는 뒤쪽에서 출발해 짧게 붙는다 */
          --fly-from: 52%;
          --fly-to: calc(100% - 94px);
          animation: notice-fly 11s cubic-bezier(0.2, 0.5, 0.25, 1) infinite;
        }
        .notice-leaf { animation: notice-flutter 1.35s ease-in-out infinite; }
        .notice-pin {
          position: absolute;
          right: 79px;
          top: 25px;
          animation: notice-pin 11s linear infinite;
        }
        @media (min-width: 1024px) {
          .notice-fly { --fly-from: 36%; --fly-to: calc(100% - 106px); }
          .notice-pin { right: 90px; }
        }
        @keyframes notice-fly {
          0%        { opacity: 0; transform: translateX(var(--fly-from)); }
          4%        { opacity: 1; }
          25%       { opacity: 1; }
          28%       { transform: translateX(var(--fly-to)); }
          31%, 100% { opacity: 0; transform: translateX(var(--fly-to)); }
        }
        @keyframes notice-flutter {
          0%   { transform: translateY(calc(-50% - 6px)) rotate(-9deg); }
          30%  { transform: translateY(calc(-50% - 13px)) rotate(7deg); }
          65%  { transform: translateY(calc(-50% - 1px)) rotate(-5deg); }
          100% { transform: translateY(calc(-50% - 6px)) rotate(-9deg); }
        }
        @keyframes notice-pin {
          0%, 27%   { opacity: 0; transform: scale(0.3); }
          29%       { opacity: 0.9; transform: scale(0.6); }
          38%, 100% { opacity: 0; transform: scale(1.6); }
        }
        /* 날아가는 종이 — 삽화 속 공지 종이와 같은 톤 */
        .notice-banner { --notice-paper: #ffffff; --notice-paper-line: rgba(122, 108, 88, 0.55); }
        [data-theme='dark'] .notice-banner { --notice-paper: #efe6d4; --notice-paper-line: rgba(60, 48, 32, 0.5); }

        @media (prefers-reduced-motion: reduce) {
          .notice-backdrop, .notice-card, .notice-banner { animation: none; }
          .notice-fly, .notice-pin { display: none; }
        }
      `}</style>

      {/* 홈 상단 배너 — 팝업을 닫아도 확인 경로가 남는다.
          풀블리드 알림 띠가 아니라 홈의 다른 카드와 같은 리듬(px-4 · 라운드 카드)으로
          앉혀 아래 히어로 카드와 경쟁하지 않게 한다. 브랜드색은 채움이 아니라
          아이콘·키커 같은 작은 액센트로만 — 공지는 '경고'가 아니라 '소식'이라서. */}
      <div className="px-4 pt-3">
        <button
          type="button"
          onClick={reopen}
          aria-label={`공지사항 ${latest.title} 자세히 보기`}
          className="notice-banner feed-card group relative w-full overflow-hidden rounded-2xl text-left transition-[transform,border-color,box-shadow] duration-150 hover:border-[var(--brand-glow)] hover:shadow-[0_6px_18px_-6px_var(--brand-glow)] active:scale-[0.985]"
        >
          {/* 카드 모서리의 은은한 브랜드 광 */}
          <span
            aria-hidden
            className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full blur-2xl"
            style={{ background: 'var(--brand-soft-strong)' }}
          />

          {/* 공지 배달 연출. 본문보다 먼저 그려 글씨 뒤로 지나가게 한다 */}
          <span
            aria-hidden
            className="notice-fly pointer-events-none absolute inset-y-0 left-0 w-full"
          >
            <svg
              className="notice-leaf absolute left-0 top-1/2"
              width="19"
              height="15"
              viewBox="0 0 19 15"
              fill="none"
            >
              <rect
                x="1"
                y="1"
                width="17"
                height="13"
                rx="1.8"
                fill="var(--notice-paper)"
                stroke="var(--notice-paper-line)"
                strokeWidth="0.9"
              />
              <path
                d="M4.2 5.2c1.1-.8 2.1.8 3.2 0s2.1.8 3.2 0M4.2 9c1.1-.8 2.1.8 3.2 0s2.1.8 3.2 0"
                stroke="var(--notice-paper-line)"
                strokeWidth="0.85"
                strokeLinecap="round"
                opacity="0.7"
              />
            </svg>
          </span>
          {/* 착지 순간 '탁' — 게시판 종이 자리에서 퍼지는 링 */}
          <span
            aria-hidden
            className="notice-pin pointer-events-none h-3 w-3 rounded-full"
            style={{ border: '1.5px solid var(--brand)' }}
          />

          <div className="relative flex items-center gap-3 py-3 pl-3.5 pr-3">
            {/* 포스터가 붙은 공지는 썸네일이 곧 내용 — 없으면 게시판 압정 */}
            {latest.image_url ? (
              <img
                src={latest.image_url}
                alt=""
                className="h-11 w-11 shrink-0 rounded-[13px] object-cover"
                style={{ background: 'var(--surface-inset)', filter: 'var(--media-dim)' }}
              />
            ) : (
              <span
                aria-hidden
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px]"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 17v5" />
                  <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                </svg>
              </span>
            )}

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span
                  className="text-[10.5px] font-bold tracking-[0.1em]"
                  style={{ color: 'var(--brand)' }}
                >
                  공지
                </span>
                <span
                  aria-hidden
                  className="h-2.5 w-px"
                  style={{ background: 'var(--card-border)' }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {formatRelative(latest.created_at)}
                </span>
                {bannerNotices.length > 1 && (
                  <span
                    className="ml-0.5 rounded-full px-1.5 py-[1.5px] text-[10px] font-bold leading-none"
                    style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                  >
                    +{bannerNotices.length - 1}
                  </span>
                )}
              </span>
              <span
                className="mt-1 block truncate text-[14.5px] font-bold tracking-[-0.01em]"
                style={{ color: 'var(--text-strong)' }}
              >
                {latest.title}
              </span>
              {/* 제목만 있으면 '알림'이고, 한 줄이 보이면 '소식'이 된다 */}
              <span
                className="mt-[1px] block truncate text-[12px] leading-snug"
                style={{ color: 'var(--text-muted)' }}
              >
                {previewOf(latest.content)}
              </span>
            </span>

            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </button>
      </div>

      {/* 전면 팝업 */}
      {current && (
        <div
          className="notice-backdrop fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCurrent}
        >
          <div
            className="notice-card relative w-full max-w-md lg:max-w-lg max-h-[88vh] rounded-3xl overflow-hidden flex flex-col"
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
                <button
                  type="button"
                  onClick={() => setZoomSrc(current.image_url as string)}
                  aria-label={`${current.title} 포스터 크게 보기`}
                  className="poster-btn group/poster relative mb-3.5 block w-full overflow-hidden rounded-2xl"
                  style={{ background: 'var(--surface-inset)' }}
                >
                  <img
                    src={current.image_url}
                    alt=""
                    className="notice-poster-img w-full object-contain transition-transform duration-200 group-hover/poster:scale-[1.02]"
                    style={{ filter: 'var(--media-dim)' }}
                  />
                  {/* 눌러야 읽힌다는 걸 알려주는 손잡이 — 없으면 그냥 작은 그림으로 끝난다 */}
                  <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-[2px]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.2-3.2M11 8.5v5M8.5 11h5" />
                    </svg>
                    크게 보기
                  </span>
                </button>
              )}
              <NoticeContent source={current.content} />

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

      {/* 포스터 확대 보기 — 핀치·휠·두 번 탭으로 원하는 곳만 키워서 읽는다 */}
      {zoomSrc && (
        <Suspense fallback={null}>
          <ImageLightbox
            src={zoomSrc}
            caption={current?.title}
            onClose={() => setZoomSrc(null)}
          />
        </Suspense>
      )}
    </>
  )
}

export default HomeNotice
