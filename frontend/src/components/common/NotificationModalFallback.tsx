/**
 * 알림 모달 청크가 아직 내려오는 동안 보여주는 뼈대.
 * Suspense fallback 이 null 이면 종을 눌러도 청크 도착까지 아무 반응이 없어
 * "무겁게 열린다"고 느껴진다 — 백드롭과 헤더를 먼저 그려 눌린 반응을 즉시 준다.
 * 레이아웃·클래스는 NotificationModal 본체와 같아 교체 시 자리가 튀지 않는다.
 */
const NotificationModalFallback = ({ onClose }: { onClose: () => void }) => (
  <>
    <div className="fixed inset-0 bg-black/40 z-[999]" onClick={onClose} />
    <div className="notif-panel fixed top-[60px] right-5 w-[400px] max-w-[calc(100vw-40px)] max-h-[calc(100vh-100px)] z-[1000] flex flex-col rounded-[22px] overflow-hidden bg-white dark:bg-gray-900 ring-1 ring-black/[0.06] dark:ring-white/[0.08] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 lg:px-7 lg:pt-6 lg:pb-4">
        <h2 className="text-[19px] lg:text-[24px] font-extrabold text-ink-strong tracking-[-0.03em]">알림</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-11 h-11 lg:w-12 lg:h-12 -mr-2 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded-full"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="lg:w-[26px] lg:h-[26px]" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-20" aria-busy>
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-gray-700 border-t-brand rounded-full animate-spin" />
      </div>
    </div>
  </>
)

export default NotificationModalFallback
