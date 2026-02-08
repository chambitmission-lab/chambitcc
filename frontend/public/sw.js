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
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\//, '');
  const fullUrl = `${ORIGIN}${BASE_PATH}${cleanPath}`;
  console.log('🔗 URL 생성:', path, '→', fullUrl);
  return fullUrl;
};

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
    if (data.icon && !data.icon.startsWith('http')) {
      const originalIcon = data.icon;
      data.icon = getAbsoluteUrl(data.icon);
      console.log('🔧 아이콘 URL 변환:', originalIcon, '→', data.icon);
    }
    
    // badge도 절대 URL로 변환
    if (data.badge && !data.badge.startsWith('http')) {
      data.badge = getAbsoluteUrl(data.badge);
    }
    
    // image도 절대 URL로 변환 (안드로이드 큰 이미지)
    if (data.image && !data.image.startsWith('http')) {
      const originalImage = data.image;
      data.image = getAbsoluteUrl(data.image);
      console.log('🔧 이미지 URL 변환:', originalImage, '→', data.image);
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
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false,
        dir: 'auto',
        lang: 'ko',
        // 안드로이드 최적화
        renotify: true,
        timestamp: Date.now()
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

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(self.clients.claim());
});
