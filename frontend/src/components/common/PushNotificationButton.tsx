import { useState } from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';

export const PushNotificationButton = () => {
  const { isSubscribed, permission, isLoading, subscribe, unsubscribe } = usePushNotification();
  const [showMessage, setShowMessage] = useState(false);

  const handleToggle = async () => {
    console.log('🔘 푸시 알림 토글 클릭');
    console.log('현재 상태:', { isSubscribed, permission, isLoading });
    
    if (isSubscribed) {
      console.log('📴 구독 해제 시도...');
      const success = await unsubscribe();
      console.log('구독 해제 결과:', success);
      if (success) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    } else {
      console.log('📲 구독 시도...');
      const success = await subscribe();
      console.log('구독 결과:', success);
      if (success) {
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      } else if (permission === 'denied') {
        alert('알림 권한이 차단되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
      } else {
        console.error('❌ 구독 실패 - 권한:', permission);
        alert('알림 구독에 실패했습니다. 콘솔을 확인해주세요.');
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
        className="flex items-center gap-3 group"
      >
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {isLoading ? '처리 중...' : '알림'}
        </span>
        
        {/* Instagram-style toggle switch */}
        <div className={`
          relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out
          ${isSubscribed 
            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400' 
            : 'bg-gray-300 dark:bg-gray-600'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          group-hover:shadow-md
        `}>
          <div className={`
            absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md
            transition-transform duration-300 ease-in-out
            ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}
          `}>
            <span className="absolute inset-0 flex items-center justify-center text-xs">
              {isSubscribed ? '🔔' : '🔕'}
            </span>
          </div>
        </div>
      </button>

      {showMessage && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap z-50">
          {isSubscribed ? '✅ 알림이 활성화되었습니다' : '알림이 비활성화되었습니다'}
        </div>
      )}
    </div>
  );
};
