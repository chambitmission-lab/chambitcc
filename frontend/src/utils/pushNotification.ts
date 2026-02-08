import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push';

/**
 * Base64 문자열을 Uint8Array로 변환 (VAPID 키용)
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  // PEM 형식 헤더/푸터 제거
  let base64 = base64String
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, ''); // 모든 공백, 줄바꿈 제거

  // URL-safe base64를 일반 base64로 변환
  base64 = base64
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  // 패딩 추가
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  base64 = base64 + padding;

  try {
    const rawData = window.atob(base64);
    const derKey = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      derKey[i] = rawData.charCodeAt(i);
    }

    // DER 형식에서 raw public key 추출
    // DER 형식: 헤더(26 bytes) + raw key(65 bytes)
    // P-256 공개 키는 마지막 65 바이트
    if (derKey.length === 91) {
      // DER-encoded SPKI format
      return derKey.slice(26); // 헤더 26바이트 제거, raw 65바이트 반환
    }
    
    // 이미 raw 형식이면 그대로 반환
    return derKey;
  } catch (error) {
    console.error('Base64 디코딩 실패:', error);
    throw new Error('VAPID 키 변환에 실패했습니다.');
  }
};

/**
 * ArrayBuffer를 Base64 문자열로 변환
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * 푸시 알림 권한 요청
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

/**
 * 푸시 알림 권한 확인
 */
export const checkNotificationPermission = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * 푸시 알림 구독
 */
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  try {
    // Service Worker 확인
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker를 지원하지 않는 브라우저입니다.');
    }

    // 권한 요청
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }

    // Service Worker 등록 대기
    const registration = await navigator.serviceWorker.ready;

    // VAPID 공개 키 가져오기
    const publicKeyPEM = await getVapidPublicKey();
    console.log('받은 VAPID 공개 키:', publicKeyPEM);
    
    const applicationServerKey = urlBase64ToUint8Array(publicKeyPEM);
    console.log('변환된 키 길이:', applicationServerKey.length, '바이트');
    
    if (applicationServerKey.length !== 65) {
      throw new Error(`잘못된 키 길이: ${applicationServerKey.length} (예상: 65)`);
    }

    // 푸시 구독
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource
    });

    // 구독 정보를 백엔드로 전송
    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!p256dh || !auth) {
      throw new Error('구독 키를 가져올 수 없습니다.');
    }

    await subscribePush({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(p256dh),
        auth: arrayBufferToBase64(auth)
      }
    });

    console.log('✅ 푸시 알림 구독 완료');
    return true;
  } catch (error) {
    console.error('❌ 푸시 알림 구독 실패:', error);
    return false;
  }
};

/**
 * 푸시 알림 구독 해제
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('구독 정보가 없습니다.');
      return false;
    }

    // 백엔드에서 구독 해제
    await unsubscribePush(subscription.endpoint);

    // 브라우저에서 구독 해제
    await subscription.unsubscribe();

    console.log('✅ 푸시 알림 구독 해제 완료');
    return true;
  } catch (error) {
    console.error('❌ 푸시 알림 구독 해제 실패:', error);
    return false;
  }
};

/**
 * 현재 푸시 구독 상태 확인
 */
export const isPushSubscribed = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch (error) {
    console.error('❌ 푸시 구독 상태 확인 실패:', error);
    return false;
  }
};

/**
 * 테스트 알림 표시
 */
export const showTestNotification = async (title: string, body: string): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker를 지원하지 않는 브라우저입니다.');
  }

  const permission = checkNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('알림 권한이 없습니다.');
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'test-notification'
  });
};
