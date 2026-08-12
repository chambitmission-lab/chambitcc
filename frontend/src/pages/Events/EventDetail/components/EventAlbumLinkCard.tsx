// 일정 상세 → 행사 앨범 연동 카드
// 이 일정에 연결된 행사 앨범 포스트가 있을 때만 "이날의 사진 보기" 카드를 보여준다.
// 로그인한 성도만 앨범을 볼 수 있으므로 비로그인에서는 조회 자체를 하지 않는다.
import { useNavigate } from 'react-router-dom'
import { useEventAlbumsByEvent } from '../../../../hooks/useEventAlbum'

interface EventAlbumLinkCardProps {
  eventId: number
}

export const EventAlbumLinkCard = ({ eventId }: EventAlbumLinkCardProps) => {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('access_token')
  const { data: albums } = useEventAlbumsByEvent(eventId, isLoggedIn)

  if (!isLoggedIn || !albums || albums.length === 0) return null

  const first = albums[0]
  const photoCount = albums.reduce((sum, p) => sum + p.photo_count, 0)

  return (
    <button
      type="button"
      onClick={() => navigate(`/news?tab=event-album&post=${first.id}`)}
      className="group w-full text-left"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_12px_rgba(0,0,0,0.25)] transition-all duration-200 group-hover:border-[var(--brand-soft-strong)] group-active:scale-[0.995]">
        <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />

        <div className="relative z-10 flex items-center gap-3 pl-3.5 pr-3 py-3">
          {/* 대표 썸네일 */}
          <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--brand-soft-strong)] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center">
            {first.cover_url ? (
              <img
                src={first.cover_url}
                alt={first.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[22px]">📸</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-ink-strong tracking-[-0.01em] truncate">
              📸 이날의 사진 보기
            </p>
            <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate mt-0.5">
              {first.title}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">
              행사 앨범 {albums.length}개 · 사진 {photoCount}장
            </p>
          </div>

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-gray-400 dark:text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </button>
  )
}
