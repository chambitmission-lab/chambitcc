import { API_V1, apiFetch } from '../config/api';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string; // 안드로이드 큰 이미지
  url?: string;
  tag?: string;
}

export interface SendPushRequest {
  payload: PushPayload;
  user_ids?: number[];
}

export interface SendPushResult {
  sent: number;
  failed: number;
  users_notified: number;
  success?: boolean;
  message?: string;
}

/**
 * VAPID 공개 키 가져오기
 */
export const getVapidPublicKey = async (): Promise<string> => {
  const response = await apiFetch(`${API_V1}/push/vapid-public-key`);
  if (!response.ok) {
    throw new Error('VAPID 공개 키를 가져올 수 없습니다.');
  }
  const data = await response.json();
  return data.publicKey;
};

/**
 * 푸시 구독 등록
 */
export const subscribePush = async (subscription: PushSubscriptionData): Promise<void> => {
  const token = localStorage.getItem('access_token');
  
  console.log('📝 푸시 구독 등록 시작');
  console.log('📦 구독 데이터:', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh.substring(0, 20) + '...',
      auth: subscription.keys.auth.substring(0, 20) + '...'
    }
  });
  
  const response = await apiFetch(`${API_V1}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });
  
  console.log('📡 구독 API 응답 상태:', response.status, response.statusText);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ 구독 실패:', error);
    throw new Error('푸시 구독에 실패했습니다.');
  }
  
  const result = await response.json().catch(() => null);
  console.log('✅ 구독 성공:', result);
};

/**
 * 푸시 구독 해제
 *
 * 주의: 일부러 apiFetch가 아닌 plain fetch를 사용한다.
 * 이 함수는 logout() 흐름에서도 호출되는데, logout이 호출되는 시점은
 * 토큰이 만료되어 refresh가 실패한 직후일 수 있다. 그 상황에서 apiFetch를
 * 쓰면 401 → refreshPromise 대기 → 자기 자신을 기다리는 데드락이 생긴다.
 * 401이 떠도 그냥 무시하고 진행해야 브라우저 측 unsubscribe까지 도달한다.
 */
export const unsubscribePush = async (endpoint: string): Promise<void> => {
  const token = localStorage.getItem('access_token');
  const encodedEndpoint = encodeURIComponent(endpoint);
  const response = await fetch(`${API_V1}/push/unsubscribe?endpoint=${encodedEndpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('푸시 구독 해제에 실패했습니다.');
  }
};

/**
 * 내 구독 목록 조회
 */
export const getMySubscriptions = async (): Promise<PushSubscriptionData[]> => {
  const token = localStorage.getItem('access_token');
  const response = await apiFetch(`${API_V1}/push/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('구독 목록을 가져올 수 없습니다.');
  }
  
  return response.json();
};

/**
 * 푸시 전송 (관리자 전용)
 *
 * 결과 객체(sent/failed/users_notified)를 그대로 반환한다.
 * HTTP 에러는 throw 하지만, sent===0 같은 부분 실패는 UI에서 결과 카드로 표시하도록
 * throw 하지 않고 그대로 결과를 돌려준다.
 */
export const sendPush = async (request: SendPushRequest): Promise<SendPushResult> => {
  const token = localStorage.getItem('access_token');

  const response = await apiFetch(`${API_V1}/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.detail || '푸시 전송에 실패했습니다.');
  }

  const result = await response.json().catch(() => null);
  return {
    sent: result?.sent ?? 0,
    failed: result?.failed ?? 0,
    users_notified: result?.users_notified ?? 0,
    success: result?.success,
    message: result?.message
  };
};
