# 디자인 업데이트 가이드

## 🎨 Instagram 스타일 디자인 적용

프로젝트 전체에 Instagram/소셜 미디어 스타일의 모던한 디자인을 적용했습니다.

## 주요 변경사항

### 1. Tailwind CSS 통합
- **Tailwind CSS v3.4** 설치 및 설정
- PostCSS 설정 추가
- 커스텀 컬러 팔레트 정의

### 2. 디자인 시스템

#### 컬러 팔레트
```css
--primary: #0095f6 (Instagram Blue)
--background-light: #ffffff
--background-dark: #000000
--surface-light: #fafafa
--surface-dark: #121212
--border-light: #dbdbdb
--border-dark: #262626
```

#### 타이포그래피
- **폰트**: Inter (Google Fonts)
- **아이콘**: Material Icons (Outlined & Round)

### 3. 컴포넌트 업데이트

#### Header (NewHeader.tsx)
- 고정 헤더 (sticky top)
- TrueLight 브랜딩
- 다크모드 토글 버튼
- 알림 아이콘 (빨간 점 표시)
- 메시지 아이콘
- 모바일 메뉴

#### Home (NewHome.tsx)
- **Story Section**: 카테고리별 스토리 링 (Health, Family, Work, Peace)
- **Sort Tabs**: Popular, Latest, My Feed
- **Prayer Composer**: 인라인 입력 + 모달
- **Prayer Feed**: Instagram 포스트 스타일 카드
- **Floating Action Button**: 모바일용 작성 버튼
- **Bottom Navigation**: 5개 탭 (Home, Search, Add, Favorites, Profile)

#### Prayer Components
- **PrayerComposer**: 모달 스타일 작성 폼
- **PrayerArticle**: Instagram 포스트 카드 디자인
  - 프로필 아바타
  - 제목 + 내용 (인용 스타일)
  - 액션 버튼 (기도, 댓글, 공유, 북마크)
  - 통계 표시

#### Auth Pages (Login/Register)
- 중앙 정렬 카드 레이아웃
- TrueLight 브랜딩
- 깔끔한 입력 필드
- 링크 카드 분리

#### Other Pages
- 통일된 레이아웃 (max-w-md 컨테이너)
- 이모지 아이콘
- 준비 중 메시지

### 4. 다크모드 지원
- Tailwind의 `dark:` 클래스 활용
- ThemeContext에서 `dark` 클래스 토글
- 모든 컴포넌트에 다크모드 스타일 적용

### 5. 반응형 디자인
- 모바일 우선 (max-w-md)
- 데스크톱에서 중앙 정렬
- 좌우 border로 앱 느낌

## 기술 스택

- **React 19.2**
- **TypeScript**
- **Tailwind CSS 3.4**
- **Vite 7.3**
- **Material Icons**
- **Google Fonts (Inter)**

## 개발 서버 실행

```bash
cd frontend
npm install
npm run dev
```

서버: http://localhost:5174

## 빌드

```bash
npm run build
```

## 주요 파일

- `tailwind.config.js` - Tailwind 설정
- `postcss.config.js` - PostCSS 설정
- `src/index.css` - 글로벌 스타일 + Tailwind imports
- `src/pages/Home/NewHome.tsx` - 메인 피드
- `src/components/layout/NewHeader/NewHeader.tsx` - 헤더
- `src/contexts/ThemeContext.tsx` - 다크모드 관리

## 디자인 특징

### Instagram 스타일 요소
1. **Story Ring**: 그라데이션 링 (활성/비활성)
2. **Card Layout**: 깔끔한 카드 디자인
3. **Typography**: Inter 폰트, 다양한 weight
4. **Icons**: Material Icons (Outlined/Round)
5. **Colors**: Instagram Blue (#0095f6)
6. **Spacing**: 일관된 패딩/마진
7. **Borders**: 얇은 border (1px)
8. **Shadows**: 미묘한 그림자
9. **Transitions**: 부드러운 애니메이션

### 모바일 최적화
- 최대 너비 448px (max-w-md)
- 터치 친화적 버튼 크기
- 하단 네비게이션
- Floating Action Button
- 스크롤 최적화

## 기능 유지

모든 기존 기능은 그대로 유지됩니다:
- ✅ 기도 요청 작성/조회
- ✅ 기도하기 토글
- ✅ 정렬 (인기순/최신순)
- ✅ 무한 스크롤
- ✅ 익명 작성
- ✅ 로그인/회원가입
- ✅ 다크모드

## 브라우저 지원

- Chrome/Edge (최신)
- Safari (최신)
- Firefox (최신)
- 모바일 브라우저

## 라이선스

MIT
