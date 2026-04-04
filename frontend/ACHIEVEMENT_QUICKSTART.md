# 🚀 업적 시스템 빠른 시작 가이드

## 📱 사용자 관점

### 프로필 화면에서 확인할 수 있는 것들

1. **프로필 아바타 글로우**
   - 활동이 많을수록 더 밝고 화려한 색상
   - 레벨이 올라갈수록 글로우 크기와 강도 증가
   - 현재 레벨 이름이 아바타 아래 표시

2. **신앙의 온도 (레벨 진행도)**
   - 현재 포인트와 레벨 표시
   - 다음 레벨까지 필요한 포인트
   - 포인트 획득 방법 안내

3. **업적 뱃지**
   - 해금된 업적은 밝게 표시되며 클릭 가능
   - 미해금 업적은 흐리게 표시되며 진행도 확인 가능
   - 업적 클릭 시 상세 정보 모달

### 포인트 획득 방법

```
기도하기      → 1분당 1P, 1회당 2P
연속 기도     → 1일당 5P
성경 읽기     → 1장당 3P, 1권 완독 50P
댓글 작성     → 1개당 1P
기도 동참     → 1개당 2P
```

### 레벨 시스템

```
Lv.0  새싹 (0P)          → 회색 글로우
Lv.1  불씨 (50P)         → 황금색 글로우
Lv.2  작은 불꽃 (150P)   → 주황색 글로우
Lv.3  타오르는 불 (300P) → 빨간색 글로우
Lv.4  뜨거운 열정 (500P) → 보라색 글로우
Lv.5  신앙의 빛 (1000P)  → 파란색 글로우
Lv.6  천상의 광채 (2000P)→ 흰색 글로우
```

## 👨‍💻 개발자 관점

### 컴포넌트 사용법

```typescript
import ProfileGlow from './components/ProfileGlow'
import { calculateGlowLevel, calculateActivityPoints } from '../../utils/achievementCalculator'

// 활동 데이터 준비
const activityData = {
  totalPrayerTime: 150,
  totalPrayerCount: 30,
  streakDays: 7,
  bibleChaptersRead: 50,
  bibleBooksCompleted: ['창세기'],
  repliesCount: 25,
  prayingForCount: 15,
}

// 포인트 및 레벨 계산
const points = calculateActivityPoints(activityData)
const glowLevel = calculateGlowLevel(points)

// 컴포넌트 렌더링
<ProfileGlow 
  glowLevel={glowLevel}
  fullName="홍길동"
  specialAchievementColor="rgba(255, 215, 0, 0.8)" // 선택적
/>
```

### 새로운 업적 추가하기

`frontend/src/types/achievement.ts` 파일의 `ACHIEVEMENTS` 배열에 추가:

```typescript
{
  id: 'new_achievement',
  type: 'prayer_time',
  title: '새로운 업적',
  description: '설명',
  requirement: 100,
  glowColor: 'rgba(255, 0, 0, 0.8)',
  glowIntensity: 0.8,
  icon: '🎯',
}
```

### 새로운 레벨 추가하기

`frontend/src/types/achievement.ts` 파일의 `GLOW_LEVELS` 배열에 추가:

```typescript
{
  level: 7,
  name: '신의 영광',
  minPoints: 5000,
  glowColor: 'rgba(255, 215, 0, 1)',
  glowIntensity: 1,
  glowSize: 100,
  pulseSpeed: 0.8,
}
```

### 포인트 계산 로직 수정

`frontend/src/utils/achievementCalculator.ts`의 `calculateActivityPoints` 함수 수정:

```typescript
export const calculateActivityPoints = (activity: UserActivityData): number => {
  let points = 0
  
  // 기존 로직...
  
  // 새로운 활동 추가
  points += activity.newActivity * 10
  
  return points
}
```

## 🔌 백엔드 API 연동

### 필요한 API 엔드포인트

```typescript
// GET /api/v1/profile/stats
{
  "activity": {
    "total_prayer_time": 150,  // 추가 필요
    "total_count": 30,
    "streak_days": 7
  },
  "bible_reading": {           // 추가 필요
    "chapters_read": 50,
    "books_completed": ["창세기", "출애굽기"]
  }
}
```

### 프론트엔드 타입 업데이트

`frontend/src/types/profile.ts`에 이미 선택적 필드로 추가됨:

```typescript
export interface ProfileStats {
  activity: {
    total_prayer_time?: number  // 분 단위
  }
  bible_reading?: {
    chapters_read: number
    books_completed: string[]
  }
}
```

## 🎨 커스터마이징

### 글로우 색상 변경

특별한 이벤트나 업적에 따라 커스텀 색상 적용:

```typescript
<ProfileGlow 
  glowLevel={glowLevel}
  fullName={fullName}
  specialAchievementColor="rgba(255, 215, 0, 0.9)" // 금색
/>
```

### 애니메이션 속도 조절

`GlowLevel`의 `pulseSpeed` 값 조정 (초 단위):
- 빠른 펄스: 1초
- 보통: 2초
- 느린 펄스: 3초

## 🧪 테스트

### 로컬에서 테스트하기

1. 브라우저 개발자 도구 열기
2. 로컬 스토리지에서 `unlocked_achievements` 삭제
3. 프로필 페이지 새로고침
4. 업적 해금 알림 확인

### 다양한 레벨 테스트

Profile.tsx에서 임시로 포인트 값 조정:

```typescript
const activityData = {
  totalPrayerTime: 2000,  // 높은 값으로 테스트
  // ...
}
```

## 📊 성능 최적화

- `useMemo`로 계산 결과 캐싱
- 로컬 스토리지로 업적 상태 저장
- CSS 애니메이션 사용 (JS 애니메이션보다 성능 우수)
- 조건부 렌더링으로 불필요한 컴포넌트 제거

## 🐛 문제 해결

### 글로우가 표시되지 않음
- 브라우저가 CSS backdrop-filter를 지원하는지 확인
- 다크모드/라이트모드 전환 시 색상 확인

### 업적이 해금되지 않음
- 로컬 스토리지 확인
- 계산 로직 디버깅
- API 데이터 확인

### 포인트가 정확하지 않음
- 백엔드 API에서 실제 데이터 제공 확인
- `calculateActivityPoints` 로직 검증

## 🎯 다음 단계

1. 백엔드 API에 기도 시간 및 성경 읽기 데이터 추가
2. 업적 해금 시 서버에 저장
3. 친구 비교 기능 추가
4. 주간/월간 챌린지 구현
5. 업적 공유 기능 추가
