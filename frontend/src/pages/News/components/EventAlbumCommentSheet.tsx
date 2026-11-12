// 행사 앨범 댓글 하단 시트 (Single Responsibility: 댓글 시트 껍데기)
// 본문(목록+작성)은 EventAlbumCommentThread — PC 2단 상세와 같은 것을 쓴다.
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { EventAlbumPost } from '../../../types/eventAlbum'
import { useLanguage } from '../../../contexts/LanguageContext'
import { SheetGrabber } from '../../../components/common/SheetGrabber'
import EventAlbumCommentThread from './EventAlbumCommentThread'

interface EventAlbumCommentSheetProps {
  post: EventAlbumPost
  onClose: () => void
}

const EventAlbumCommentSheet = ({ post, onClose }: EventAlbumCommentSheetProps) => {
  const { t } = useLanguage()

  useModalBackButton(onClose)

  return (
    // 넘겨보기(EventAlbumReel, z-[115]) 위에서도 열리므로 그보다 위에 둔다
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg h-[85dvh] sm:h-[calc(80dvh/var(--az,1))] bg-background-light dark:bg-[#1c1c26] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-black/[0.04] dark:border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--brand-soft-strong)] rounded-full blur-3xl pointer-events-none" />

        {/* 핸들 + 헤더 */}
        <div className="relative z-10 shrink-0">
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <SheetGrabber onClose={onClose} className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-ink-strong tracking-[-0.015em]">
                {t('newsEaCommentTitle')}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-white/50 truncate">
                {t('newsEaCommentSubtitle').replace('{title}', post.title)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('newsClose')}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-white/55 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-brand transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <EventAlbumCommentThread postId={post.id} variant="sheet" />
      </div>
    </div>
  )
}

export default EventAlbumCommentSheet
