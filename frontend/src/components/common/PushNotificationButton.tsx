import { usePushNotification } from '../../hooks/usePushNotification';
import { useLanguage } from '../../contexts/LanguageContext';
import { showToast } from '../../utils/toast';

export const PushNotificationButton = () => {
  const { isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotification();
  const { t } = useLanguage();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        showToast(t('pushToastDisabled'), 'info');
      }
    } else {
      const success = await subscribe();
      if (success) {
        showToast(t('pushToastEnabled'), 'success');
      } else if (permission === 'denied') {
        alert(t('pushPermissionDenied'));
      } else {
        showToast(t('pushToastFailed'), 'error');
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
        {isLoading ? t('pushToggleLoading') : t('pushToggleLabel')}
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
