import { API_V1 } from '../config/api'
import { tokenStore } from '../utils/tokenStore'
import { request, type UntypedJson } from './utils/request'

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
  const data = await request<UntypedJson>('/push/vapid-public-key', { errorMessage: 'VAPID 공개 키를 가져올 수 없습니다.' })
  return data.publicKey;
};

/**
 * 푸시 구독 등록
 */
export const subscribePush = async (subscription: PushSubscriptionData): Promise<void> => {
  console.log('📝 푸시 구독 등록 시작');
  console.log('📦 구독 데이터:', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh.substring(0, 20) + '...',
      auth: subscription.keys.auth.substring(0, 20) + '...'
    }
  });
  
  let result: UntypedJson = null
  try {
    result = await request<UntypedJson>('/push/subscribe', {
      method: 'POST',
      json: subscription,
      errorMessage: '푸시 구독에 실패했습니다.',
      ignoreServerDetail: true,
    })
  } catch (error) {
    console.error('❌ 구독 실패:', error);
    throw error
  }
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
export const unsubscribePush = async (endpoint: string, token?: string | null): Promise<void> => {
  // logout 흐름에서는 토큰을 지우기 전에 스냅샷한 값을 넘겨받는다.
  // (인자가 없으면 기존 동작대로 localStorage에서 조회)
  const authToken = token ?? tokenStore.getAccess();
  const encodedEndpoint = encodeURIComponent(endpoint);

  // 네트워크가 느리거나 멈춰도 무한정 매달리지 않도록 타임아웃을 건다.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_V1}/push/unsubscribe?endpoint=${encodedEndpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('푸시 구독 해제에 실패했습니다.');
    }
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * 내 구독 목록 조회
 */
export const getMySubscriptions = async (): Promise<PushSubscriptionData[]> => {
  return request<PushSubscriptionData[]>('/push/subscriptions', { errorMessage: '구독 목록을 가져올 수 없습니다.' })
};

/**
 * 푸시 전송 (관리자 전용)
 *
 * 결과 객체(sent/failed/users_notified)를 그대로 반환한다.
 * HTTP 에러는 throw 하지만, sent===0 같은 부분 실패는 UI에서 결과 카드로 표시하도록
 * throw 하지 않고 그대로 결과를 돌려준다.
 */
export const sendPush = async (payload: SendPushRequest): Promise<SendPushResult> => {
  const result: UntypedJson = await request<UntypedJson>('/push/send', {
    method: 'POST',
    json: payload,
    errorMessage: '푸시 전송에 실패했습니다.',
  }).catch((error: unknown) => {
    if (error instanceof SyntaxError) return null // 본문이 JSON 이 아니면 결과 없음으로
    throw error
  });
  return {
    sent: result?.sent ?? 0,
    failed: result?.failed ?? 0,
    users_notified: result?.users_notified ?? 0,
    success: result?.success,
    message: result?.message
  };
};
