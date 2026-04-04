# 🏆 업적 및 보상 시스템

프로필 화면에 기도 활동 기반 시각적 보상 시스템이 추가되었습니다.

## 📋 개요

사용자의 기도 활동, 성경 읽기, 커뮤니티 참여를 추적하여 프로필 사진 주변의 네온 글로우 효과와 업적 뱃지로 보상하는 게임화 시스템입니다.

## ✨ 주요 기능

### 1. 동적 글로우 효과
- 활동 포인트에 따라 프로필 아바타 주변의 글로우 색상과 강도가 변화
- 7단계 레벨 시스템 (새싹 → 천상의 광채)
- 각 레벨마다 고유한 색상, 크기, 펄스 속도

### 2. 업적 시스템
11가지 업적 카테고리:
- **기도 시간**: 30분, 100분, 300분 달성
- **성경 읽기**: 창세기 완독, 100장, 500장 읽기
- **연속 기도**: 7일, 30일 연속
- **기도 횟수**: 50회, 200회
- **커뮤니티**: 댓글 50개 작성

### 3. 포인트 시스템
활동별 포인트:
- 기도 1분: 1P
- 기도 1회: 2P
- 연속 1일: 5P
- 성경 1장: 3P
- 완독 1권: 50P
- 댓글 1개: 1P
- 기도중인 항목 1개: 2P

### 4. 레벨 진행도
- 현재 레벨과 다음 레벨까지 필요한 포인트 표시
- 시각적 진행 바와 애니메이션 효과
- 포인트 획득 방법 안내

### 5. 업적 뱃지
- 해금된 업적을 프로필에 표시
- 각 업적마다 고유한 아이콘과 글로우 효과
- 미해금 업적의 진행도 표시
- 업적 클릭 시 상세 정보 모달

## 🎨 글로우 레벨

| 레벨 | 이름 | 필요 포인트 | 색상 |
|------|------|-------------|------|
| 0 | 새싹 | 0 | 회색 |
| 1 | 불씨 | 50 | 황금색 |
| 2 | 작은 불꽃 | 150 | 주황색 |
| 3 | 타오르는 불 | 300 | 빨간색 |
| 4 | 뜨거운 열정 | 500 | 보라색 |
| 5 | 신앙의 빛 | 1000 | 파란색 |
| 6 | 천상의 광채 | 2000 | 흰색 |

## 📁 파일 구조

```
frontend/src/
├── types/
│   └── achievement.ts              # 업적 시스템 타입 정의
├── utils/
│   └── achievementCalculator.ts    # 포인트 및 업적 계산 로직
└── pages/Profile/
    └── components/
        ├── ProfileGlow.tsx         # 동적 글로우 효과 컴포넌트
        ├── LevelProgress.tsx       # 레벨 진행도 표시
        ├── AchievementBadges.tsx   # 업적 뱃지 그리드
        └── AchievementModal.tsx    # 업적 상세 모달
```

## 🔧 구현 세부사항

### ProfileGlow 컴포넌트
```typescript
interface ProfileGlowProps {
  glowLevel: GlowLevel
  fullName: string
  specialAchievementColor?: string  // 특별 업적 색상 오버라이드
}
```

- 레벨에 따라 동적으로 글로우 크기, 색상, 애니메이션 속도 조정
- CSS-in-JS 스타일로 실시간 색상 변경
- 다층 글로우 레이어로 깊이감 표현

### Achievement 계산
```typescript
calculateActivityPoints(activity: UserActivityData): number
calculateGlowLevel(points: number): GlowLevel
calculateAchievements(activity: UserActivityData): Achievement[]
```

- 사용자 활동 데이터를 포인트로 변환
- 포인트 기반 레벨 계산
- 각 업적의 달성 여부 및 진행도 계산

### 로컬 스토리지 활용
- 새로 해금된 업적 추적
- 업적 해금 시 축하 모달 자동 표시
- 중복 알림 방지

## 🚀 향후 확장 가능성

### 백엔드 API 연동
현재는 프론트엔드에서 추정값을 사용하지만, 다음 API 엔드포인트 추가 권장:

```typescript
// 프로필 통계 확장
interface ProfileStats {
  activity: {
    total_prayer_time?: number      // 총 기도 시간 (분)
  }
  bible_reading?: {
    chapters_read: number            // 읽은 장 수
    books_completed: string[]        // 완독한 책 목록
  }
}
```

### 추가 기능 아이디어
1. **특별 이벤트 글로우**: 크리스마스, 부활절 등 특별한 날 한정 색상
2. **친구 비교**: 친구들과 레벨 비교 기능
3. **주간/월간 챌린지**: 시간 제한 업적
4. **업적 공유**: SNS에 업적 공유 기능
5. **커스텀 글로우**: 특정 업적 달성 시 색상 선택 가능
6. **애니메이션 효과**: 레벨업 시 특수 효과
7. **리더보드**: 전체 사용자 랭킹

## 🎮 사용자 경험

### 동기 부여 요소
- **즉각적 피드백**: 활동 즉시 포인트 반영
- **시각적 보상**: 눈에 보이는 프로필 변화
- **진행도 표시**: 다음 목표까지 얼마나 남았는지 명확히 표시
- **수집 욕구**: 모든 업적 해금 도전

### 게임화 원칙
- **명확한 목표**: 각 업적의 요구사항 명시
- **점진적 난이도**: 쉬운 업적부터 어려운 업적까지
- **다양한 경로**: 기도, 성경 읽기, 커뮤니티 등 다양한 방법으로 성장
- **성취감**: 업적 해금 시 축하 모달과 특별 효과

## 📊 성능 고려사항

- `useMemo`를 활용한 불필요한 재계산 방지
- 로컬 스토리지로 업적 상태 캐싱
- CSS 애니메이션으로 부드러운 효과
- 조건부 렌더링으로 최적화

## 🐛 알려진 제한사항

1. 현재 기도 시간과 성경 읽기 데이터는 추정값 사용
2. 백엔드 API에서 실제 데이터를 제공해야 정확한 계산 가능
3. 업적 해금 알림은 로컬 스토리지 기반 (기기별 독립적)

## 📝 사용 예시

```typescript
// Profile.tsx에서 사용
const activityData: UserActivityData = {
  totalPrayerTime: 150,
  totalPrayerCount: 30,
  streakDays: 7,
  bibleChaptersRead: 50,
  bibleBooksCompleted: ['창세기'],
  repliesCount: 25,
  prayingForCount: 15,
}

const points = calculateActivityPoints(activityData)  // 485 포인트
const level = calculateGlowLevel(points)              // 레벨 4: 뜨거운 열정
const achievements = calculateAchievements(activityData)
```

## 🎯 임팩트

- **사용자 참여도 증가**: 게임화 요소로 지속적인 활동 유도
- **신앙 생활 시각화**: "내 신앙의 온도"를 눈으로 확인
- **커뮤니티 활성화**: 업적 공유 및 비교로 상호작용 증가
- **재방문율 향상**: 다음 레벨/업적을 위한 동기 부여
