# ✅ 백엔드 API 연동 완료

## 🎉 완료 상태

백엔드에서 제공한 API 확장에 맞춰 프론트엔드 연동이 완료되었습니다!

## 📋 백엔드에서 구현된 API

1. ✅ `GET /api/v1/profile/stats` - 확장된 통계 반환
2. ✅ `GET /api/v1/profile/detail` - 전체 프로필 정보에 새 통계 포함
3. ✅ `POST /api/v1/prayers/{prayer_id}/pray` - 기도 시간 파라미터 추가

## 🔧 프론트엔드 수정 사항

### 1. 타입 정의 업데이트
**파일**: `frontend/src/types/profile.ts`
- `total_prayer_time` 필드 추가 (선택적)
- `bible_reading` 필드 추가 (선택적)

### 2. API 함수 업데이트
**파일**: `frontend/src/api/prayer/prayerActionApi.ts`
- `addPrayer()` 함수에 `prayerDurationMinutes` 파라미터 추가
- 백엔드로 기도 시간 전송

### 3. 훅 업데이트
**파일**: `frontend/src/hooks/usePrayerToggle.ts`
- `togglePrayer()` 함수에 `durationMinutes` 파라미터 추가
- 기도 시간을 API로 전달

### 4. 새로운 훅 추가
**파일**: `frontend/src/hooks/usePrayerTimer.ts`
- 기도 시간 추적 기능
- 타이머 시작/정지
- 경과 시간 계산

### 5. 프로필 페이지 (이미 구현됨)
**파일**: `frontend/src/pages/Profile/Profile.tsx`
- API 데이터 우선 사용
- 없으면 추정값 사용 (하위 호환성)

## 🔄 자동 연동 흐름

```
백엔드 API 응답
    ↓
프론트엔드 타입 체크 (선택적 필드)
    ↓
데이터 있음? → 사용
데이터 없음? → 추정값 사용
    ↓
업적 시스템 계산
    ↓
프로필 글로우 업데이트
```

## 📊 데이터 흐름

### 프로필 통계 조회
```
사용자 → 프로필 페이지 접속
    ↓
GET /api/v1/profile/stats
    ↓
{
  activity: {
    total_prayer_time: 150  // ✅ 백엔드에서 제공
  },
  bible_reading: {          // ✅ 백엔드에서 제공
    chapters_read: 50,
    books_completed: ["창세기"]
  }
}
    ↓
포인트 계산 (150분 × 1P = 150P)
    ↓
레벨 계산 (150P → Lv.2 작은 불꽃)
    ↓
프로필 글로우 주황색으로 표시
```

### 기도하기 (기도 시간 포함)
```
사용자 → 기도 버튼 클릭
    ↓
(선택적) 타이머 시작
    ↓
(선택적) 타이머 정지 → 5분 경과
    ↓
POST /api/v1/prayers/123/pray
{
  prayer_duration_minutes: 5  // ✅ 프론트엔드에서 전송
}
    ↓
백엔드: user.total_prayer_time += 5
    ↓
프로필 캐시 무효화
    ↓
다음 프로필 조회 시 업데이트된 데이터 표시
```

## 🎯 현재 동작 방식

### 시나리오 1: 백엔드에서 모든 데이터 제공
```json
// API 응답
{
  "activity": {
    "total_prayer_time": 150
  },
  "bible_reading": {
    "chapters_read": 50,
    "books_completed": ["창세기"]
  }
}

// 프론트엔드 계산
totalPrayerTime: 150        // ✅ API 데이터 사용
bibleChaptersRead: 50       // ✅ API 데이터 사용
bibleBooksCompleted: ["창세기"]  // ✅ API 데이터 사용

// 포인트 계산
150 (기도시간) + 60 (기도횟수) + 35 (연속) + 150 (성경) + 50 (완독) = 445P
→ Lv.3 타오르는 불 (빨간색 글로우)
```

### 시나리오 2: 백엔드에서 일부 데이터만 제공
```json
// API 응답
{
  "activity": {
    "total_prayer_time": 150
  }
  // bible_reading 없음
}

// 프론트엔드 계산
totalPrayerTime: 150        // ✅ API 데이터 사용
bibleChaptersRead: 0        // ⚠️ 추정값 (없음)
bibleBooksCompleted: []     // ⚠️ 추정값 (없음)

// 포인트 계산
150 (기도시간) + 60 (기도횟수) + 35 (연속) = 245P
→ Lv.2 작은 불꽃 (주황색 글로우)
```

### 시나리오 3: 백엔드에서 데이터 미제공 (기존 방식)
```json
// API 응답
{
  "activity": {
    "total_count": 30
  }
  // total_prayer_time 없음
  // bible_reading 없음
}

// 프론트엔드 계산
totalPrayerTime: 150        // ⚠️ 추정값 (30회 × 5분)
bibleChaptersRead: 0        // ⚠️ 추정값 (없음)
bibleBooksCompleted: []     // ⚠️ 추정값 (없음)

// 포인트 계산
150 (추정) + 60 (기도횟수) + 35 (연속) = 245P
→ Lv.2 작은 불꽃 (주황색 글로우)
```

## 🧪 테스트 방법

### 1. 로컬 개발 환경
```bash
# 백엔드 실행
cd backend
uvicorn app.main:app --reload

# 프론트엔드 실행
cd frontend
npm run dev

# 브라우저에서 확인
# 1. 로그인
# 2. 프로필 페이지 접속
# 3. 개발자 도구 > Network 탭
# 4. profile/stats 응답 확인
```

### 2. API 응답 확인
```bash
# 프로필 통계 조회
curl -X GET "http://localhost:8000/api/v1/profile/stats" \
  -H "Authorization: Bearer <token>"

# 기대 응답
{
  "activity": {
    "total_prayer_time": 150  // ✅ 있어야 함
  },
  "bible_reading": {          // ✅ 있으면 좋음
    "chapters_read": 50,
    "books_completed": ["창세기"]
  }
}
```

### 3. 기도 시간 전송 확인
```bash
# 기도하기 (시간 포함)
curl -X POST "http://localhost:8000/api/v1/prayers/123/pray" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prayer_duration_minutes": 5}'

# 프로필 다시 조회
curl -X GET "http://localhost:8000/api/v1/profile/stats" \
  -H "Authorization: Bearer <token>"

# total_prayer_time이 5 증가했는지 확인
```

## 📝 체크리스트

### 백엔드 개발자
- [x] API 확장 완료
- [ ] 로컬 테스트
- [ ] 스테이징 배포
- [ ] 프로덕션 배포

### 프론트엔드 개발자
- [x] 타입 정의 업데이트
- [x] API 함수 업데이트
- [x] 훅 업데이트
- [x] 하위 호환성 보장
- [ ] 로컬 테스트
- [ ] 스테이징 테스트
- [ ] 프로덕션 배포

## 🎨 사용자 경험

### 즉시 확인 가능
1. 프로필 페이지 접속
2. 프로필 아바타 주변 글로우 확인
3. "신앙의 온도" 섹션에서 현재 레벨 확인
4. 업적 뱃지 확인

### 기도 후 변화
1. 기도 버튼 클릭
2. (백엔드에서 시간 누적)
3. 프로필 페이지 재방문
4. 포인트 증가 확인
5. 레벨업 시 글로우 색상 변화 확인

## 🚀 다음 단계

### 단기 (1주)
- [ ] 백엔드 API 배포
- [ ] 프론트엔드 배포
- [ ] 실제 데이터로 테스트
- [ ] 사용자 피드백 수집

### 중기 (1개월)
- [ ] 기도 시간 타이머 UI 추가
- [ ] 성경 읽기 기록 UI 추가
- [ ] 업적 해금 알림 개선
- [ ] 친구 레벨 비교 기능

### 장기 (3개월)
- [ ] 주간/월간 챌린지
- [ ] 특별 이벤트 글로우
- [ ] 커스텀 글로우 색상
- [ ] 리더보드 시스템

## 📚 참고 문서

- `BACKEND_API_REQUIREMENTS.md` - 백엔드 API 요구사항 상세
- `BACKEND_INTEGRATION_GUIDE.md` - 연동 가이드
- `frontend/ACHIEVEMENT_SYSTEM.md` - 업적 시스템 전체 문서
- `frontend/ACHIEVEMENT_QUICKSTART.md` - 빠른 시작 가이드

## 🎊 완료!

백엔드 API 확장에 맞춰 프론트엔드 연동이 완료되었습니다. 이제 배포 후 실제 데이터로 테스트하면 됩니다! 🚀

### 핵심 포인트
✅ 하위 호환성 보장 (API 데이터 없어도 동작)
✅ 선택적 필드로 구현 (단계적 배포 가능)
✅ 자동 연동 (추가 작업 불필요)
✅ 기도 시간 추적 준비 완료
