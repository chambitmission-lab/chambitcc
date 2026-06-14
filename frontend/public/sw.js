// Service Worker for Push Notifications

// base path 설정 (프로덕션/개발 환경 자동 감지)
// GitHub Pages: https://chambitmission-lab.github.io/chambitcc/
const ORIGIN = self.location.origin;
const SW_PATH = self.location.pathname; // /chambitcc/sw.js
const BASE_PATH = SW_PATH.replace(/sw\.js$/, ''); // /chambitcc/

console.log('🚀 Service Worker 시작');
console.log('ORIGIN:', ORIGIN);
console.log('SW_PATH:', SW_PATH);
console.log('BASE_PATH:', BASE_PATH);

// 절대 URL 생성 함수
const getAbsoluteUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // 슬래시로 시작하면 제거
  const cleanPath = path.replace(/^\/+/, '');
  
  // BASE_PATH가 /로 끝나지 않으면 추가
  const basePath = BASE_PATH.endsWith('/') ? BASE_PATH : BASE_PATH + '/';
  
  const fullUrl = `${ORIGIN}${basePath}${cleanPath}`;
  console.log('🔗 URL 생성:', path, '→', fullUrl);
  return fullUrl;
};

// 앱이 Cache Storage에 적어둔 API base를 읽는다 (예: https://api.example.com/api/v1).
// pushsubscriptionchange(구독 회전)에서 백엔드 재등록에 사용한다.
// SW 스크립트 URL을 건드리지 않으므로 기존 구독이 보존된다.
const SW_CONFIG_CACHE = 'chambit-sw-config';
const SW_API_BASE_KEY = '/__sw_api_base';

const getApiBase = async () => {
  try {
    const cache = await caches.open(SW_CONFIG_CACHE);
    const res = await cache.match(SW_API_BASE_KEY);
    if (!res) return null;
    return (await res.text()) || null;
  } catch (e) {
    return null;
  }
};

// Base64(또는 PEM) 공개 키를 Uint8Array로 변환 (VAPID 키용)
// 프론트엔드 utils/pushNotification.ts의 로직과 동일하게 유지한다.
const urlBase64ToUint8Array = (base64String) => {
  let base64 = base64String
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/\s/g, '');

  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  base64 = base64 + padding;

  const rawData = self.atob(base64);
  const derKey = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    derKey[i] = rawData.charCodeAt(i);
  }

  // DER-encoded SPKI(91바이트)면 헤더 26바이트를 제거해 raw 65바이트만 사용
  if (derKey.length === 91) {
    return derKey.slice(26);
  }
  return derKey;
};

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return self.btoa(binary);
};

// 푸시 서비스가 구독 endpoint를 회전/만료시키면 발생.
// 새 endpoint로 재구독한 뒤 백엔드의 기존(old) 레코드를 갱신해
// 사용자 구독이 조용히 끊기는 것을 막는다(인증 토큰 없이 old_endpoint로 식별).
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 pushsubscriptionchange 발생');

  event.waitUntil((async () => {
    try {
      const apiBase = await getApiBase();
      if (!apiBase) {
        console.warn('API base가 없어 구독 회전을 건너뜁니다.');
        return;
      }

      const oldEndpoint = event.oldSubscription && event.oldSubscription.endpoint;
      if (!oldEndpoint) {
        // 옛 endpoint를 모르면 백엔드에서 사용자를 식별할 수 없다.
        // 다음 로그인/토글 시 재구독으로 복구되므로 조용히 종료.
        console.warn('oldSubscription endpoint가 없어 회전을 건너뜁니다.');
        return;
      }

      // 브라우저가 새 구독을 제공하면 그대로 쓰고, 없으면 직접 재구독
      let newSub = event.newSubscription;
      if (!newSub) {
        const res = await fetch(`${apiBase}/push/vapid-public-key`);
        if (!res.ok) throw new Error('VAPID 키 조회 실패');
        const { publicKey } = await res.json();
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      const p256dh = newSub.getKey('p256dh');
      const auth = newSub.getKey('auth');
      if (!p256dh || !auth) throw new Error('새 구독 키를 가져올 수 없습니다.');

      const rotateRes = await fetch(`${apiBase}/push/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_endpoint: oldEndpoint,
          endpoint: newSub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(p256dh),
            auth: arrayBufferToBase64(auth)
          }
        })
      });

      if (rotateRes.ok) {
        console.log('✅ 구독 회전 완료 (백엔드 갱신)');
      } else {
        console.warn('구독 회전 백엔드 갱신 실패:', rotateRes.status);
      }
    } catch (error) {
      console.error('❌ pushsubscriptionchange 처리 실패:', error);
    }
  })());
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('📬 푸시 알림 수신:', event);
  
  const defaultData = {
    title: '알림',
    body: '새로운 알림이 도착했습니다.',
    icon: getAbsoluteUrl('pwa-192x192.png'),
    badge: getAbsoluteUrl('pwa-192x192.png'),
    image: getAbsoluteUrl('pwa-512x512.png'),
    url: BASE_PATH
  };

  // 데이터 파싱 및 알림 표시를 Promise로 처리
  const notificationPromise = (async () => {
    let data = { ...defaultData };

    // 데이터가 있으면 파싱
    if (event.data) {
      try {
        const parsedData = event.data.json();
        console.log('📦 파싱된 데이터:', parsedData);
        data = { ...defaultData, ...parsedData };
      } catch (e) {
        console.error('❌ 데이터 파싱 실패:', e);
        try {
          const textData = event.data.text();
          console.log('� 원본 텍스트:', textData);
          data.body = textData || data.body;
        } catch (textError) {
          console.error('❌ 텍스트 파싱도 실패:', textError);
        }
      }
    }

    // 아이콘을 절대 URL로 변환
    if (data.icon) {
      const originalIcon = data.icon;
      data.icon = getAbsoluteUrl(data.icon);
      console.log('�️ 아이콘 변환:', originalIcon, '→', data.icon);
    }
    
    // badge도 절대 URL로 변환
    if (data.badge) {
      data.badge = getAbsoluteUrl(data.badge);
    }
    
    // image도 절대 URL로 변환 (안드로이드 큰 이미지)
    if (data.image) {
      const originalImage = data.image;
      data.image = getAbsoluteUrl(data.image);
      console.log('�️ 이미지 변환:', originalImage, '→', data.imaige);
    }
    
    // URL 경로 수정
    if (data.url && !data.url.startsWith('http') && !data.url.startsWith(BASE_PATH)) {
      const originalUrl = data.url;
      data.url = `${BASE_PATH}${data.url.replace(/^\//, '')}`;
      console.log('🔧 URL 경로 수정:', originalUrl, '→', data.url);
    }

    console.log('🔔 알림 표시 시도:', data);

    // 알림 표시
    try {
      const notificationOptions = {
        body: data.body,
        icon: data.icon,
        badge: data.badge || data.icon,
        image: data.image, // 안드로이드에서 큰 이미지로 표시
        tag: data.tag || `notification-${Date.now()}`,
        data: { url: data.url || BASE_PATH },
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지 (헤드업 알림)
        vibrate: [200, 100, 200, 100, 200], // 더 강한 진동
        silent: false,
        dir: 'auto',
        lang: 'ko',
        // 안드로이드 최적화
        renotify: true,
        timestamp: Date.now(),
        // 헤드업 알림을 위한 추가 옵션
        actions: [] // 빈 배열이라도 있으면 우선순위 상승
      };
      
      console.log('📋 알림 옵션:', notificationOptions);
      
      const result = await self.registration.showNotification(data.title, notificationOptions);
      console.log('✅ 알림 표시 성공');
      return result;
    } catch (error) {
      console.error('❌ 알림 표시 실패:', error);
      console.error('에러 상세:', error.message, error.stack);
      
      // 실패해도 기본 알림이라도 표시 시도
      try {
        console.log('🔄 기본 알림으로 재시도...');
        return await self.registration.showNotification('알림', {
          body: data.body || '새로운 알림이 도착했습니다.',
          icon: getAbsoluteUrl('pwa-192x192.png'),
          badge: getAbsoluteUrl('pwa-192x192.png')
        });
      } catch (retryError) {
        console.error('❌ 재시도도 실패:', retryError);
        throw retryError;
      }
    }
  })();

  event.waitUntil(notificationPromise.catch(err => {
    console.error('❌ Promise 처리 실패:', err);
  }));
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('👆 알림 클릭:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || BASE_PATH;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // 이미 열린 창이 있으면 포커스
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('🔕 알림 닫힘:', event.notification.tag);
});

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker 설치됨');
  self.skipWaiting();
});

// Service Worker 활성화 - 오래된 API 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.keys().then(requests => {
        const now = Date.now();
        return Promise.all(
          requests.map(request => {
            return cache.match(request).then(response => {
              if (response) {
                const dateHeader = response.headers.get('date');
                if (dateHeader) {
                  const cacheAge = now - new Date(dateHeader).getTime();
                  if (cacheAge > API_CACHE_DURATION) {
                    return cache.delete(request);
                  }
                }
              }
            });
          })
        );
      });
    }).then(() => self.clients.claim())
  );
});

// API 캐싱 전략 (Network First with Cache Fallback)
const CACHE_NAME = 'chambit-api-cache-v1';
const API_CACHE_DURATION = 1000 * 60 * 60 * 24; // 1일 (React Query persist가 장기 캐싱 담당)

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API 요청만 캐싱 (GET 요청만)
  if (event.request.method === 'GET' && url.pathname.includes('/api/')) {
    event.respondWith(
      // Network First 전략: 네트워크 우선, 실패 시 캐시 사용
      fetch(event.request)
        .then(response => {
          // 성공하면 캐시에 저장하고 반환
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 가져오기
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('📦 캐시에서 응답:', url.pathname);
              return cachedResponse;
            }
            // 캐시도 없으면 오프라인 응답
            return new Response(
              JSON.stringify({ 
                error: 'offline', 
                message: '오프라인 상태입니다. 네트워크 연결을 확인해주세요.' 
              }),
              { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
  }
});
