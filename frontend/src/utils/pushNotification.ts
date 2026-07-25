import { getVapidPublicKey, subscribePush, unsubscribePush, getMySubscriptions } from '../api/push';

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

// healPushSubscription 중복 실행 방지용 (앱 시작 + visibilitychange가 겹칠 수 있음)
let lastHealAttemptAt = 0;
const HEAL_MIN_INTERVAL_MS = 60 * 60 * 1000; // 1시간

/**
 * 앱 시작·포그라운드 복귀 시 호출하는 푸시 구독 자가 치유.
 *
 * restorePushSubscriptionForUser는 로그인 순간 한 번만 실행되고 실패해도
 * 재시도가 없어서, 그때 놓치면 사용자가 켜둔 알림이 꺼진 채 남는다.
 * (예: 같은 기기에서 다른 계정이 endpoint를 가져갔거나, 로그인 시점의
 * 네트워크/서비스워커 타이밍 문제, 푸시 서비스의 endpoint 만료 등)
 *
 * 이 함수는 "사용자가 켜둔 상태(push_pref=on) + 권한 granted"인데
 * 실제 구독이 현재 사용자와 어긋나 있으면 조용히 재구독해서 복구한다.
 * 정상 상태면 백엔드 조회 1회 외에 아무것도 하지 않으며,
 * 과도한 호출을 막기 위해 1시간에 한 번만 실제 검사를 수행한다.
 *
 * 안전 장치:
 * - 권한이 'granted'가 아니면 아무것도 하지 않음 (프롬프트 자동 재출현 방지).
 * - 절대 예외를 던지지 않음 — 앱 시작 흐름을 막으면 안 된다.
 */
export const healPushSubscription = async (username: string | null): Promise<void> => {
  if (!username) return;
  if (!getPushPreference(username)) return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (checkNotificationPermission() !== 'granted') return;

  const now = Date.now();
  if (now - lastHealAttemptAt < HEAL_MIN_INTERVAL_MS) return;
  lastHealAttemptAt = now;

  try {
    const registration = await navigator.serviceWorker.ready;
    const browserSub = await registration.pushManager.getSubscription();

    if (browserSub) {
      const mySubs = await getMySubscriptions();
      const matched = mySubs.some((sub) => sub.endpoint === browserSub.endpoint);
      if (matched) return; // 브라우저 구독이 현재 사용자 소유로 정상 등록됨
    }

    // 브라우저 구독이 없거나(만료·해제됨), 있어도 내 것이 아님(다른 계정이
    // 이 기기를 썼던 경우) → 재구독으로 현재 사용자에게 되돌린다.
    const success = await subscribeToPushNotifications();
    if (success) {
      console.log(`✅ ${username}의 푸시 구독을 자가 치유했습니다`);
    } else {
      console.warn(`푸시 구독 자가 치유 실패 (${username}): subscribe가 false 반환`);
    }
  } catch (error) {
    console.warn('푸시 구독 자가 치유 중 에러 (무시):', error);
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
    icon: `${import.meta.env.BASE_URL}notification-icon-192.png`,
    badge: `${import.meta.env.BASE_URL}notification-badge-96.png`,
    tag: 'test-notification'
  });
};
