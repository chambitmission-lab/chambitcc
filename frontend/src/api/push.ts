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
  
  console.log('🚀 API 호출: POST /api/v1/push/send');
  console.log('📦 요청 데이터:', request);
  
  const response = await apiFetch(`${API_V1}/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(request)
  });
  
  console.log('📡 응답 상태:', response.status, response.statusText);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('❌ API 에러 응답:', error);
    throw new Error(error.message || '푸시 전송에 실패했습니다.');
  }
  
  const result = await response.json().catch(() => null);
  console.log('✅ API 응답 성공:', result);
  
  // 전송 결과 상세 로그
  if (result) {
    if (result.success === false || result.failed > 0) {
      console.warn('⚠️ 푸시 전송 결과:', {
        성공: result.sent || 0,
        실패: result.failed || 0,
        알림받은사용자: result.users_notified || 0,
        메시지: result.message
      });
      
      if (result.sent === 0) {
        throw new Error('푸시 전송 실패: 대상 사용자가 구독하지 않았거나 구독 정보가 유효하지 않습니다.');
      }
    } else {
      console.log('📊 전송 통계:', {
        성공: result.sent || 0,
        실패: result.failed || 0,
        알림받은사용자: result.users_notified || 0
      });
    }
  }
};
