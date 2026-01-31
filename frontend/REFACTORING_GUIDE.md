# CommunityFeed 리팩토링 가이드

## 📋 개요
CommunityFeed 컴포넌트를 SOLID 원칙에 따라 리팩토링했습니다.

## 🎯 적용된 SOLID 원칙

### 1. 단일 책임 원칙 (Single Responsibility Principle)
각 모듈이 하나의 명확한 책임만 가지도록 분리했습니다.

### 2. 개방-폐쇄 원칙 (Open-Closed Principle)
새로운 기능 추가 시 기존 코드 수정 없이 확장 가능합니다.

### 3. 의존성 역전 원칙 (Dependency Inversion Principle)
커스텀 훅을 통한 추상화로 컴포넌트 간 결합도를 낮췄습니다.

## 📁 새로운 파일 구조

```
frontend/src/
├── components/community/
│   ├── PostItem.tsx              # 개별 게시물 UI 컴포넌트
│   ├── PostItem.css              # PostItem 전용 스타일
│   ├── PostComposer.tsx          # 게시물 작성 폼 컴포넌트
│   └── PostComposer.css          # PostComposer 전용 스타일
│
├── hooks/
│   ├── useCommunityFeed.ts       # 피드 데이터 페칭 & 상태 관리
│   └── usePostActions.ts         # 좋아요/리트윗 비즈니스 로직
│
├── utils/
│   └── dateUtils.ts              # 시간 계산 유틸리티
│
├── styles/
│   └── common.css                # 공통 재사용 스타일
│
└── pages/Home/
    ├── components/
    │   └── CommunityFeed.tsx     # 메인 컴포넌트 (조합만 담당)
    └── styles/
        └── CommunityFeed.css     # 레이아웃 & 섹션 스타일
```

## 🔧 각 모듈의 책임

### TypeScript/React 컴포넌트

#### `CommunityFeed.tsx` (30줄)
- **책임**: 컴포넌트 조합 및 데이터 흐름 관리
- **역할**: 
  - 커스텀 훅 호출
  - 하위 컴포넌트 조합
  - 로딩/에러 상태 처리

#### `PostItem.tsx` (80줄)
- **책임**: 개별 게시물 렌더링
- **역할**:
  - 게시물 데이터 표시
  - 액션 버튼 UI
  - 이벤트 핸들러 연결

#### `PostComposer.tsx` (60줄)
- **책임**: 게시물 작성 폼
- **역할**:
  - 입력 폼 관리
  - 유효성 검증
  - 게시물 작성 API 호출

#### `useCommunityFeed.ts` (40줄)
- **책임**: 피드 데이터 관리
- **역할**:
  - API 호출
  - 로딩/에러 상태 관리
  - 데이터 캐싱

#### `usePostActions.ts` (80줄)
- **책임**: 게시물 액션 처리
- **역할**:
  - 좋아요/리트윗 로직
  - 에러 처리
  - UI 상태 업데이트

#### `dateUtils.ts` (15줄)
- **책임**: 시간 계산
- **역할**:
  - 상대 시간 변환
  - 날짜 포맷팅

### CSS 스타일

#### `common.css`
- **책임**: 재사용 가능한 공통 스타일
- **포함**:
  - 그라디언트 텍스트/버튼
  - 카드 스타일
  - 아바타
  - 공통 애니메이션

#### `CommunityFeed.css`
- **책임**: 메인 컨테이너 레이아웃
- **포함**:
  - 섹션 배경
  - 헤더 레이아웃
  - 타임라인 구조
  - 로딩/에러 상태

#### `PostItem.css`
- **책임**: 게시물 아이템 스타일
- **포함**:
  - 게시물 카드
  - 아바타
  - 콘텐츠 레이아웃
  - 액션 버튼

#### `PostComposer.css`
- **책임**: 작성 폼 스타일
- **포함**:
  - 폼 레이아웃
  - 텍스트 영역
  - 버튼 스타일
  - 반응형 디자인

## ✅ 리팩토링 효과

### Before (300줄)
- 하나의 거대한 컴포넌트
- 모든 로직이 한 곳에 집중
- 테스트 어려움
- 재사용 불가능

### After (6개 모듈, 각 15-80줄)
- 명확한 책임 분리
- 독립적인 테스트 가능
- 높은 재사용성
- 쉬운 유지보수

## 🚀 사용 예시

```tsx
// CommunityFeed.tsx - 간결한 조합
const CommunityFeed = () => {
  const { posts, setPosts, loading, error } = useCommunityFeed()
  const { handleLike, handleRetweet } = usePostActions({ posts, setPosts })

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts])
  }

  if (loading) return <FeedContainer>로딩 중...</FeedContainer>
  if (error) return <FeedContainer>{error}</FeedContainer>

  return (
    <FeedContainer 
      posts={posts} 
      onPostCreated={handlePostCreated} 
      onLike={handleLike} 
      onRetweet={handleRetweet} 
    />
  )
}
```

## 🎨 CSS 모듈화 장점

1. **관심사 분리**: 각 컴포넌트가 자신의 스타일만 관리
2. **재사용성**: common.css의 유틸리티 클래스 활용
3. **유지보수**: 스타일 변경 시 해당 파일만 수정
4. **성능**: 필요한 스타일만 로드
5. **가독성**: 작은 파일로 분리되어 이해하기 쉬움

## 📝 추가 개선 가능 사항

1. **에러 바운더리**: 에러 처리 개선
2. **무한 스크롤**: 페이지네이션 추가
3. **낙관적 업데이트**: UX 개선
4. **테스트 코드**: 단위 테스트 추가
5. **CSS Modules**: CSS 네임스페이스 충돌 방지
