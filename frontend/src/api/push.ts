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
  url?: string;
  tag?: string;
}

export interface SendPushRequest {
  payload: PushPayload;
  user_ids?: number[];
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
  const response = await apiFetch(`${API_V1}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });
  
  if (!response.ok) {
    throw new Error('푸시 구독에 실패했습니다.');
  }
};

/**
 * 푸시 구독 해제
 */
export const unsubscribePush = async (endpoint: string): Promise<void> => {
  const token = localStorage.getItem('access_token');
  const encodedEndpoint = encodeURIComponent(endpoint);
  const response = await apiFetch(`${API_V1}/push/unsubscribe?endpoint=${encodedEndpoint}`, {
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
 */
export const sendPush = async (request: SendPushRequest): Promise<void> => {
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
    throw new Error(error.message || '푸시 전송에 실패했습니다.');
  }
};
