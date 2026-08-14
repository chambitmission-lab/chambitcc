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
  
  // icon: 투명 배경 글리프(알림 카드용) — 안드로이드가 원형 크롭해도 잘리지 않게
  // 192px 캔버스 안 136px 박스로 여백을 둔다.
  // badge: 전체 로고 흰색 실루엣(안드로이드 상태바는 알파 마스크만 렌더링하므로
  // 컬러 아이콘을 주면 회색 덩어리가 된다. 불꽃만 넣으면 로고가 잘려 보인다는 피드백으로 전체 로고 사용).
  // image(큰 이미지)는 기본값을 두지 않는다 — 페이로드가 명시할 때만 표시.
  const defaultData = {
    title: '알림',
    body: '새로운 알림이 도착했습니다.',
    icon: getAbsoluteUrl('notification-icon-192.png?v=2'),
    badge: getAbsoluteUrl('notification-badge-96.png?v=3'),
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
        // 백엔드는 icon/badge 미지정 시 null을 담아 보내는데, 그대로 스프레드하면
        // null이 기본 아이콘을 덮어써 아이콘 없는 알림이 된다. null/undefined는 버린다.
        const cleaned = Object.fromEntries(
          Object.entries(parsedData).filter(([, v]) => v !== null && v !== undefined)
        );
        data = { ...defaultData, ...cleaned };
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
          icon: getAbsoluteUrl('notification-icon-192.png?v=2'),
          badge: getAbsoluteUrl('notification-badge-96.png?v=3')
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

// ─────────────────────────────────────────────────────────────
// App Shell 캐싱 — 오프라인 콜드 스타트 지원
//
// index.html 은 Network First(온라인이면 항상 서버 최신 → appVersion.ts 의
// version.json 업데이트 감지 흐름이 그대로 유효), 오프라인일 때만 캐시 폴백.
// /assets/* 번들은 파일명에 콘텐츠 해시가 있어 내용이 절대 변하지 않으므로
// Cache First 가 안전하고, 재방문 로딩도 빨라진다.
// version.json / sw.js 는 업데이트 감지의 근거라서 절대 캐시하지 않는다.
// ─────────────────────────────────────────────────────────────
const APP_SHELL_CACHE = 'chambit-app-shell-v1';
const ASSETS_CACHE = 'chambit-assets-v1';
const ASSET_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30일 — 재배포로 안 쓰게 된 옛 번들 정리 기준

// 설치 시 index.html 과 그것이 참조하는 엔트리 번들을 미리 캐싱한다.
// (첫 방문의 자산 요청은 아직 SW 통제 밖이라 런타임 캐싱만으로는
//  두 번째 방문부터 오프라인이 가능해지는데, 프리캐시로 첫 방문부터 채운다)
const precacheAppShell = async () => {
  const res = await fetch(BASE_PATH, { cache: 'no-store' });
  if (!res || !res.ok) return;

  const shellCache = await caches.open(APP_SHELL_CACHE);
  await shellCache.put(BASE_PATH, res.clone());

  // index.html 이 참조하는 /assets/ 번들(src/href 속성)을 추출해 프리캐시
  try {
    const html = await res.text();
    const matches = html.match(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g) || [];
    const assetUrls = [...new Set(matches.map((m) => m.replace(/^(?:src|href)="/, '').replace(/"$/, '')))];
    const assetsCache = await caches.open(ASSETS_CACHE);
    await Promise.all(
      assetUrls.map(async (u) => {
        try {
          const r = await fetch(u);
          if (r && r.ok) await assetsCache.put(u, r);
        } catch (e) {
          // 개별 자산 실패는 무시 — 런타임 캐싱이 다음 방문에 채운다
        }
      })
    );
  } catch (e) {
    // HTML 파싱 실패해도 index 캐시는 이미 확보됨
  }

  // 설치형 PWA 아이콘·매니페스트도 오프라인 대비
  try {
    const staticFiles = ['manifest.webmanifest', 'pwa-192x192.png', 'pwa-512x512.png'].map(
      (f) => `${BASE_PATH}${f}`
    );
    await Promise.all(
      staticFiles.map(async (u) => {
        try {
          const r = await fetch(u);
          if (r && r.ok) await shellCache.put(u, r);
        } catch (e) { /* 무시 */ }
      })
    );
  } catch (e) { /* 무시 */ }
};

// date 헤더 기준으로 오래된 번들 캐시 제거.
// activate 는 sw.js 자체가 바뀔 때만 돌므로, 온라인 앱 시작 때도 호출한다.
const pruneOldAssets = async () => {
  const cache = await caches.open(ASSETS_CACHE);
  const requests = await cache.keys();
  const now = Date.now();
  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const dateHeader = response && response.headers.get('date');
      if (dateHeader && now - new Date(dateHeader).getTime() > ASSET_MAX_AGE) {
        await cache.delete(request);
      }
    })
  );
};

let lastAssetPruneAt = 0;

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker 설치됨');
  event.waitUntil(
    precacheAppShell()
      .catch((e) => console.warn('App Shell 프리캐시 실패 (무시):', e))
      .then(() => self.skipWaiting())
  );
});

// Service Worker 활성화 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  const KNOWN_CACHES = [CACHE_NAME, HERO_CACHE_NAME, SW_CONFIG_CACHE, APP_SHELL_CACHE, ASSETS_CACHE];
  event.waitUntil(
    Promise.all([
      // 오래된 API 캐시 항목 정리
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
      }),
      // 오래된 번들 캐시 정리
      pruneOldAssets().catch(() => {}),
      // 더 이상 안 쓰는 chambit-* 캐시 통째로 정리
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith('chambit-') && !KNOWN_CACHES.includes(n))
            .map((n) => caches.delete(n))
        )
      ),
    ]).then(() => self.clients.claim())
  );
});

// API 캐싱 전략 (Network First with Cache Fallback)
const CACHE_NAME = 'chambit-api-cache-v1';
const API_CACHE_DURATION = 1000 * 60 * 60 * 24; // 1일 (React Query persist가 장기 캐싱 담당)

// 소개 페이지 히어로 배경 캐시 (Cache First)
//
// 이 프로젝트의 Supabase Storage 는 업로드 시 cacheControl 을 지정해도 실제 응답은
// `cache-control: no-cache` 로 나간다(sb-gateway-mode: direct). 그래서 브라우저는
// 방문할 때마다 조건부 요청을 보내고, 그 왕복(304)이 끝나야 배경을 그린다.
// 파일명에 timestamp+uuid 가 들어가 배경을 바꾸면 URL 자체가 달라지므로
// 캐시를 먼저 쓰더라도 옛 이미지가 남을 일이 없다.
const HERO_CACHE_NAME = 'chambit-about-hero-v1';

const isAboutImageRequest = (url) =>
  url.hostname.endsWith('.supabase.co') &&
  url.pathname.includes('/storage/v1/object/public/') &&
  url.pathname.includes('/about/');

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'GET' && isAboutImageRequest(url)) {
    event.respondWith(
      caches.open(HERO_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached; // 네트워크 왕복 없이 즉시 표시

          return fetch(event.request).then((response) => {
            // <img crossorigin> 이라 응답은 type 'cors' — 실제 상태 코드를 볼 수 있다.
            // (no-cors 였다면 opaque 라 404 도 구분 못 하고 캐싱된다)
            if (response && response.ok) {
              cache.put(event.request, response.clone());
              // 배경 교체 시 URL이 바뀌므로 이전 항목은 즉시 정리 (히어로는 항상 1장)
              cache.keys().then((keys) => {
                keys.forEach((key) => {
                  if (key.url !== event.request.url) cache.delete(key);
                });
              });
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // SSE(실시간 스트림)는 절대 가로채지 않는다 — clone()+cache.put이
  // 끝나지 않는 스트림을 무한 버퍼링하게 된다 (알림 스트림 등)
  const accept = event.request.headers.get('accept') || '';
  if (accept.includes('text/event-stream') || url.pathname.endsWith('/stream')) {
    return;
  }

  // TTS 오디오 스트림도 캐싱 제외 — 장(章)마다 수 MB짜리 MP3를 clone()으로
  // 이중 버퍼링하고 Cache Storage 를 무한정 키우게 된다 (음성×장 조합만큼 누적)
  if (url.pathname.includes('/bible/tts/')) {
    return;
  }

  // version.json / sw.js 는 항상 네트워크 그대로 통과 —
  // 앱 업데이트 감지의 근거라서 SW 가 캐시로 응답하면 영원히 옛 버전에 갇힌다
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    return;
  }

  // ── App Shell: 네비게이션(문서) 요청 — Network First ──
  // 온라인이면 항상 서버 최신 index.html (버전 감지 흐름 유지),
  // 오프라인일 때만 캐시된 index.html 로 앱을 띄운다.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 홈(index.html) 응답만 오프라인 폴백으로 보관.
          // /b/* 공유 링크는 Pages Function 프리뷰 응답이라 index 로 캐싱하면 오염된다.
          if (response && response.ok && !response.redirected && url.pathname === BASE_PATH) {
            const copy = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(BASE_PATH, copy));
          }
          // 온라인 앱 시작을 계기로 오래된 번들 정리 (SW 프로세스당 1시간에 1회)
          if (Date.now() - lastAssetPruneAt > 1000 * 60 * 60) {
            lastAssetPruneAt = Date.now();
            pruneOldAssets().catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches.match(BASE_PATH, { cacheName: APP_SHELL_CACHE }).then((cached) => {
            if (cached) return cached;
            return new Response(
              '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인</title><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;background:#131313;color:#e5e7eb;text-align:center"><div><p style="font-size:40px;margin:0 0 12px">📡</p><p style="font-size:17px;font-weight:700;margin:0 0 6px">오프라인 상태입니다</p><p style="font-size:14px;color:#9ca3af;margin:0">네트워크 연결 후 다시 열어주세요.</p></div></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          })
        )
    );
    return;
  }

  // ── 해시 번들(/assets/*) — Cache First ──
  // 파일명에 콘텐츠 해시가 있어 같은 URL 의 내용은 절대 변하지 않는다.
  // 재배포되면 index.html 이 새 해시 URL 을 참조하므로 자연스럽게 캐시 미스 → 갱신.
  if (url.origin === ORIGIN && url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // ── 그 외 같은 출처 정적 파일(아이콘·이미지·폰트·매니페스트) — Stale While Revalidate ──
  // 해시가 없는 public/ 파일들이라 캐시를 먼저 쓰되 백그라운드로 갱신한다.
  if (url.origin === ORIGIN && /\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(APP_SHELL_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const network = fetch(event.request)
            .then((response) => {
              if (response && response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached || Response.error());
          return cached || network;
        })
      )
    );
    return;
  }

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
