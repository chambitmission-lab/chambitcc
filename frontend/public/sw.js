// Service Worker for Push Notifications

// base path 설정 (프로덕션/개발 환경 자동 감지)
const BASE_PATH = self.location.pathname.includes('/chambitcc/') ? '/chambitcc/' : '/';

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  console.log('푸시 알림 수신:', event);
  console.log('BASE_PATH:', BASE_PATH);
  
  const defaultData = {
    title: '알림',
    body: '새로운 알림이 도착했습니다.',
    icon: `${BASE_PATH}pwa-192x192.png`,
    url: BASE_PATH
  };

  // 데이터 파싱 및 알림 표시를 Promise로 처리
  const notificationPromise = (async () => {
    let data = { ...defaultData };

    // 데이터가 있으면 파싱
    if (event.data) {
      try {
        const parsedData = event.data.json();
        console.log('파싱된 데이터:', parsedData);
        data = { ...defaultData, ...parsedData };
      } catch (e) {
        console.error('데이터 파싱 실패:', e);
        try {
          const textData = event.data.text();
          console.log('원본 텍스트:', textData);
          // 텍스트로 받은 경우 body에 표시
          data.body = textData || data.body;
        } catch (textError) {
          console.error('텍스트 파싱도 실패:', textError);
        }
      }
    }

    // 아이콘 경로 수정 (BASE_PATH 적용)
    if (data.icon && !data.icon.startsWith('http') && !data.icon.startsWith(BASE_PATH)) {
      console.log('🔧 아이콘 경로 수정:', data.icon, '→', `${BASE_PATH}${data.icon.replace(/^\//, '')}`);
      data.icon = `${BASE_PATH}${data.icon.replace(/^\//, '')}`;
    }
    
    // URL 경로도 BASE_PATH 적용
    if (data.url && !data.url.startsWith('http') && !data.url.startsWith(BASE_PATH)) {
      console.log('🔧 URL 경로 수정:', data.url, '→', `${BASE_PATH}${data.url.replace(/^\//, '')}`);
      data.url = `${BASE_PATH}${data.url.replace(/^\//, '')}`;
    }

    console.log('알림 표시 시도:', data);

    // 알림 표시
    try {
      const notificationOptions = {
        body: data.body,
        icon: data.icon || `${BASE_PATH}pwa-192x192.png`,
        badge: `${BASE_PATH}pwa-192x192.png`,
        tag: data.tag || `notification-${Date.now()}`,
        data: { url: data.url || BASE_PATH },
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false
      };
      
      console.log('알림 옵션:', notificationOptions);
      
      const result = await self.registration.showNotification(data.title, notificationOptions);
      console.log('✅ 알림 표시 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 알림 표시 실패:', error);
      console.error('에러 상세:', error.message, error.stack);
      
      // 실패해도 기본 알림이라도 표시 시도
      try {
        console.log('🔄 기본 알림으로 재시도...');
        return await self.registration.showNotification('알림', {
          body: data.body || '새로운 알림이 도착했습니다.',
          icon: `${BASE_PATH}pwa-192x192.png`
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
  console.log('알림 클릭:', event);
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
  console.log('알림 닫힘:', event);
});

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨');
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  event.waitUntil(clients.claim());
});
