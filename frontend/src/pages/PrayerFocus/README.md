# Prayer Focus Mode

포모도로 기법에서 영감을 받은 집중 기도 타이머 기능입니다.

## 기능

### 1. 타이머 선택
- 5분, 10분, 15분, 20분, 30분 프리셋 제공
- 원형 프로그레스 바로 진행 상황 시각화

### 2. 오늘의 말씀 표시
- 기도 중 오늘의 성경 구절 표시
- 집중력 향상 및 영적 묵상 지원

### 3. 타이머 컨트롤
- 일시정지/재개 기능
- 초기화 기능
- 페이지 이탈 경고

### 4. 완료 화면
- 기도 완료 축하 메시지
- 기도 시간 통계 표시
- 다시 시작 또는 종료 선택

## 컴포넌트 구조

```
PrayerFocus/
├── index.tsx              # 메인 컴포넌트
├── usePrayerTimer.ts      # 타이머 로직 훅
├── TimerDisplay.tsx       # 원형 타이머 UI
├── VerseDisplay.tsx       # 말씀 표시
├── TimerControls.tsx      # 컨트롤 버튼
└── SessionComplete.tsx    # 완료 화면
```

## 사용 방법

1. 홈 화면에서 "Prayer Focus Mode" 카드 클릭
2. 원하는 기도 시간 선택 (5~30분)
3. 타이머 시작 후 집중하여 기도
4. 필요시 일시정지/재개 가능
5. 완료 후 통계 확인 및 다시 시작 가능

## 향후 백엔드 연동 필요 사항

### API 엔드포인트
```typescript
// 기도 세션 기록
POST /api/prayer-sessions
{
  "duration": 600,        // 초 단위
  "date": "2026-02-22",
  "verse_id": 123         // 선택사항
}

// 기도 통계 조회
GET /api/prayer-stats
Response: {
  "total_sessions": 50,
  "total_minutes": 500,
  "streak_days": 7,
  "this_week_minutes": 120
}
```

### 로컬 스토리지 (임시)
현재는 세션 완료 시 로컬에만 저장됩니다.
백엔드 API 준비 후 서버 동기화 추가 예정.

## 기술 스택

- React Hooks (useState, useEffect, useRef, useCallback)
- TypeScript
- Tailwind CSS
- React Router
- 기존 프로젝트의 useDailyVerse 훅 활용

## 특징

- 📱 모바일 최적화 UI
- 🎨 그라데이션 배경 및 글래스모피즘 효과
- ⏱️ 정확한 타이머 (setInterval 기반)
- 📳 완료 시 진동 알림 (지원 기기)
- 🚪 페이지 이탈 방지 경고
- 🌙 다크모드 지원
