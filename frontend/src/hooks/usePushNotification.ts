import { useState, useEffect } from 'react';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkNotificationPermission,
  showTestNotification
} from '../utils/pushNotification';
import { getMySubscriptions } from '../api/push';
import { isAuthenticated } from '../utils/auth';

export const usePushNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // 초기 상태 확인
  // 브라우저 pushManager의 구독은 origin 단위로 유지되므로, 그것만 보면
  // 이전 사용자가 켜둔 구독이 새 사용자에게도 "켜짐"으로 보인다.
  // 따라서 (1) 브라우저 endpoint와 (2) 현재 로그인 사용자의 백엔드 구독 목록을
  // 모두 확인해서 endpoint가 일치할 때만 "구독 중"으로 판정한다.
  useEffect(() => {
    const checkStatus = async () => {
      setPermission(checkNotificationPermission());

      if (!('serviceWorker' in navigator)) {
        setIsSubscribed(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const browserSub = await registration.pushManager.getSubscription();

        if (!browserSub) {
          setIsSubscribed(false);
          return;
        }

        if (!isAuthenticated()) {
          // 비로그인 상태에서는 백엔드 조회를 할 수 없으므로 꺼짐으로 표시
          setIsSubscribed(false);
          return;
        }

        const mySubs = await getMySubscriptions();
        const matched = mySubs.some((sub) => sub.endpoint === browserSub.endpoint);
        setIsSubscribed(matched);
      } catch (error) {
        console.error('❌ 푸시 구독 상태 확인 실패:', error);
        setIsSubscribed(false);
      }
    };

    checkStatus();
  }, []);

  // 구독
  const subscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await subscribeToPushNotifications();
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 해제
  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 알림
  const sendTestNotification = async (title: string, body: string): Promise<void> => {
    await showTestNotification(title, body);
  };

  return {
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};
