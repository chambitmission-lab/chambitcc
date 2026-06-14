import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push';

// 사용자별 푸시 알림 선호도를 localStorage에 저장하기 위한 키 prefix.
// 같은 브라우저에서 사용자가 바뀌면 각자 자기 키를 갖기 때문에 격리가 유지된다.
const PUSH_PREF_PREFIX = 'push_pref_';

/**
 * Base64 문자열을 Uint8Array로 변환 (VAPID 키용)
 */
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  // PEM 형식 헤더/푸터 제거 및 이스케이프된 줄바꿈 처리
  let base64 = base64String
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\\n/g, '') // 이스케이프된 \n 제거
    .replace(/\n/g, '')  // 실제 줄바꿈 제거
    .replace(/\r/g, '')  // 캐리지 리턴 제거
    .replace(/\s/g, ''); // 모든 공백 제거

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
    console.error('처리된 base64 문자열:', base64);
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
export const unsubscribeFromPushNotifications = async (
  token?: string | null
): Promise<boolean> => {
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

    // 백엔드에서 구독 해제 — 실패해도 로컬 브라우저 구독은 반드시 끊는다.
    // (예: 토큰 만료 후 logout 호출 흐름)
    try {
      await unsubscribePush(subscription.endpoint, token);
    } catch (backendError) {
      console.warn('백엔드 구독 해제 실패 (브라우저 구독은 계속 해제 진행):', backendError);
    }

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
 * 사용자별 푸시 알림 선호도 저장 (localStorage).
 * 같은 브라우저에서 사용자 A의 'on'과 사용자 B의 'off'가 공존할 수 있다.
 */
export const setPushPreference = (username: string | null, enabled: boolean): void => {
  if (!username) return;
  localStorage.setItem(`${PUSH_PREF_PREFIX}${username}`, enabled ? 'on' : 'off');
};

/**
 * 사용자별 푸시 알림 선호도 조회. 명시적으로 'on'일 때만 true.
 * (한 번도 설정한 적 없거나 'off'면 false)
 */
export const getPushPreference = (username: string | null): boolean => {
  if (!username) return false;
  return localStorage.getItem(`${PUSH_PREF_PREFIX}${username}`) === 'on';
};

/**
 * 로그인 직후 호출. 해당 사용자가 이전 세션에서 푸시를 켜둔 상태였다면
 * 자동으로 브라우저 + 백엔드 재구독을 수행한다.
 *
 * 안전 장치:
 * - 권한이 'granted'가 아니면 아무것도 하지 않음 (권한 프롬프트 자동 재출현 방지).
 * - 실패해도 절대 예외를 던지지 않음 — 로그인 흐름은 막히면 안 된다.
 */
export const restorePushSubscriptionForUser = async (
  username: string | null
): Promise<void> => {
  if (!username) return;
  if (!getPushPreference(username)) return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (checkNotificationPermission() !== 'granted') {
    // 권한이 없으면 자동으로 프롬프트를 띄우지 않고 조용히 종료.
    // 사용자가 직접 프로필에서 토글을 켜면 그 때 권한을 다시 요청한다.
    return;
  }

  try {
    const success = await subscribeToPushNotifications();
    if (!success) {
      console.warn(`자동 푸시 재구독 실패 (${username}): subscribe가 false 반환`);
    } else {
      console.log(`✅ ${username}의 푸시 구독을 자동 복원했습니다`);
    }
  } catch (error) {
    console.warn('자동 푸시 재구독 중 예상치 못한 에러 (무시):', error);
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
    icon: '/chambitcc/pwa-192x192.png',
    badge: '/chambitcc/pwa-192x192.png',
    tag: 'test-notification'
  });
};
