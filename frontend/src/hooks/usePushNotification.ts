import { useState, useEffect } from 'react';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
  checkNotificationPermission,
  showTestNotification
} from '../utils/pushNotification';

export const usePushNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // 초기 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
      setPermission(checkNotificationPermission());
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
