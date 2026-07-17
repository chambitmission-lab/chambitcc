import { usePushNotification } from '../../hooks/usePushNotification';
import { showToast } from '../../utils/toast';

export const PushNotificationButton = () => {
  const { isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotification();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        showToast('알림이 비활성화되었습니다', 'info');
      }
    } else {
      const success = await subscribe();
      if (success) {
        showToast('알림이 활성화되었습니다', 'success');
      } else if (permission === 'denied') {
        alert('알림 권한이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
      } else {
        showToast('알림 구독에 실패했습니다', 'error');
      }
    }
  };

  // 알림을 지원하지 않는 브라우저
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      aria-pressed={isSubscribed}
      className="flex items-center gap-3 shrink-0"
    >
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {isLoading ? '처리 중...' : '알림'}
      </span>

      <div
        className={`
          relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out
          ${isSubscribed ? 'bg-[var(--brand)]' : 'bg-gray-300 dark:bg-white/[0.16]'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div
          className={`
            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md
            transition-transform duration-300 ease-in-out
            ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
    </button>
  );
};
