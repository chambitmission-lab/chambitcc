# PWA 설정 가이드

## ✅ 완료된 작업

1. **vite-plugin-pwa 설치 완료**
2. **Vite 설정 완료** (`vite.config.ts`)
3. **PWA 메타 태그 추가** (`index.html`)
4. **앱 아이콘 생성** (chambit.png 사용)
5. **Service Worker 자동 생성 설정**

## 📱 PWA 기능

- ✅ 홈화면에 앱 설치 가능
- ✅ 오프라인 지원 (캐싱)
- ✅ 전체화면 앱 모드
- ✅ 자동 업데이트
- ✅ API 요청 캐싱 (24시간)

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
npm run build
npm run preview
```

### 2. 스마트폰에서 테스트
1. 빌드 후 배포 (GitHub Pages 등)
2. 스마트폰 브라우저로 접속
3. **iOS (Safari)**: 공유 버튼 → "홈 화면에 추가"
4. **Android (Chrome)**: 메뉴 → "홈 화면에 추가" 또는 자동 팝업

### 3. Chrome DevTools로 테스트
1. `npm run preview` 실행
2. Chrome에서 열기
3. F12 → Application 탭
4. Manifest, Service Workers 확인

## 🎨 아이콘 최적화 (선택사항)

현재는 `chambit.png`를 그대로 사용 중입니다.
더 나은 품질을 위해 다음 크기로 최적화 권장:

- `pwa-192x192.png` - 192x192px
- `pwa-512x512.png` - 512x512px

온라인 도구: https://realfavicongenerator.net/

## 🚀 배포 후 확인사항

1. HTTPS 필수 (GitHub Pages는 자동 지원)
2. manifest.webmanifest 로딩 확인
3. Service Worker 등록 확인
4. 설치 프롬프트 표시 확인

## 📝 설정 커스터마이징

`vite.config.ts`에서 수정 가능:
- `theme_color`: 앱 테마 색상
- `background_color`: 스플래시 배경색
- `display`: 'standalone', 'fullscreen', 'minimal-ui'
- 캐싱 전략 및 기간

## 🔧 문제 해결

### 설치 버튼이 안 보여요
- HTTPS 확인
- Service Worker 등록 확인
- 이미 설치되어 있는지 확인

### 오프라인이 안 돼요
- Service Worker가 활성화되었는지 확인
- 캐시 전략 확인 (workbox 설정)

### 업데이트가 안 돼요
- `registerType: 'autoUpdate'` 설정됨
- 브라우저 캐시 삭제 후 재시도
