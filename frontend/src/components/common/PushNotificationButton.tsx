import { usePushNotification } from '../../hooks/usePushNotification';
import { useLanguage } from '../../contexts/LanguageContext';
import { showToast } from '../../utils/toast';
import { alertDialog } from '../../utils/confirmDialog'

type Translate = ReturnType<typeof useLanguage>['t'];

/**
 * 권한이 'denied'일 때 플랫폼별 해제 방법 안내.
 * - iOS 홈 화면 앱: 한 번 거부하면 영구 거부 → iOS 설정 or 재설치
 * - Android Chrome: 사이트 권한 또는 시스템의 Chrome 앱 알림 자체가 꺼진 경우
 * - 그 외 데스크톱/기타 브라우저: 주소창 자물쇠 → 사이트 설정
 */
const getDeniedGuide = (t: Translate): string => {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isIOS && isStandalone) return t('pushDeniedIosPwa');
  if (isAndroid) return isStandalone ? t('pushDeniedAndroidPwa') : t('pushDeniedAndroid');
  return t('pushDeniedDesktop');
};

export const PushNotificationButton = () => {
  const { isSubscribed, isLoading, subscribeDetailed, unsubscribe } = usePushNotification();
  const { t } = useLanguage();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        showToast(t('pushToastDisabled'), 'info');
      }
    } else {
      const result = await subscribeDetailed();
      if (result.ok) {
        showToast(t('pushToastEnabled'), 'success');
        return;
      }
      switch (result.reason) {
        case 'denied':
          await alertDialog({
            title: t('pushToastFailed'),
            message: getDeniedGuide(t),
            tone: 'warning',
            icon: 'notifications_off',
          });
          break;
        case 'dismissed':
          showToast(t('pushPromptDismissed'), 'info');
          break;
        case 'insecure':
          showToast(t('pushInsecure'), 'error');
          break;
        case 'unsupported':
          showToast(t('pushUnsupported'), 'error');
          break;
        default:
          await alertDialog({
            title: t('pushToastFailed'),
            message: t('pushErrorGeneric'),
            tone: 'warning',
            icon: 'notifications_off',
          });
          console.warn('푸시 구독 오류 상세:', result.detail);
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
