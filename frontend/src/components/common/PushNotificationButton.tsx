import { useState } from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';

export const PushNotificationButton = () => {
  const { isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotification();
  const [showMessage, setShowMessage] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } else {
      const success = await subscribe();
      if (success) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      } else if (permission === 'denied') {
        alert('알림 권한이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
      }
    }
  };

  // 알림을 지원하지 않는 브라우저
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${isSubscribed 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-xl">
          {isSubscribed ? '🔔' : '🔕'}
        </span>
        <span>
          {isLoading 
            ? '처리 중...' 
            : isSubscribed 
              ? '알림 켜짐' 
              : '알림 받기'
          }
        </span>
      </button>

      {showMessage && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap z-50">
          {isSubscribed ? '✅ 알림이 활성화되었습니다' : '알림이 비활성화되었습니다'}
        </div>
      )}
    </div>
  );
};
