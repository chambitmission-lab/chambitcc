# Prayer Focus Mode - 백엔드 API 명세서

## 개요
집중 기도 모드(Prayer Focus Mode) 기능을 위한 백엔드 API 명세입니다.
사용자의 기도 세션 기록 및 통계 조회 기능을 제공합니다.

---

## 1. 기도 세션 기록 API

### Endpoint
```
POST /api/v1/prayer-sessions
```

### 설명
사용자가 완료한 기도 세션을 기록합니다.

### 인증
- **필수**: Bearer Token (로그인 필수)
- Header: `Authorization: Bearer {access_token}`

### Request Body
```json
{
  "duration": 600,           // 필수: 기도 시간 (초 단위)
  "completed_at": "2026-02-22T10:30:00Z",  // 선택: 완료 시각 (ISO 8601 형식, 기본값: 현재 시각)
  "verse_id": 123            // 선택: 함께 본 오늘의 말씀 ID (daily_verse 테이블 참조)
}
```

### Response (성공 - 201 Created)
```json
{
  "success": true,
  "message": "기도 세션이 기록되었습니다",
  "data": {
    "id": 456,
    "user_id": 789,
    "duration": 600,
    "completed_at": "2026-02-22T10:30:00Z",
    "verse_id": 123,
    "created_at": "2026-02-22T10:30:00Z"
  }
}
```

### Response (실패 - 401 Unauthorized)
```json
{
  "success": false,
  "detail": "로그인이 필요합니다"
}
```

### Response (실패 - 400 Bad Request)
```json
{
  "success": false,
  "detail": "duration은 필수 항목입니다"
}
```

---

## 2. 기도 통계 조회 API

### Endpoint
```
GET /api/v1/prayer-sessions/stats
```

### 설명
사용자의 기도 세션 통계를 조회합니다.

### 인증
- **필수**: Bearer Token (로그인 필수)
- Header: `Authorization: Bearer {access_token}`

### Query Parameters
```
period: string (선택) - 조회 기간
  - "week" (기본값): 최근 7일
  - "month": 최근 30일
  - "all": 전체 기간
```

### Request Example
```
GET /api/v1/prayer-sessions/stats?period=week
```

### Response (성공 - 200 OK)
```json
{
  "success": true,
  "data": {
    "total_sessions": 50,           // 총 세션 수
    "total_minutes": 500,            // 총 기도 시간 (분)
    "total_seconds": 30000,          // 총 기도 시간 (초)
    "streak_days": 7,                // 연속 기도 일수
    "this_week_sessions": 5,         // 이번 주 세션 수
    "this_week_minutes": 120,        // 이번 주 기도 시간 (분)
    "average_duration_minutes": 10,  // 평균 세션 시간 (분)
    "most_used_duration": 600,       // 가장 많이 사용한 시간 (초)
    "last_session_date": "2026-02-22T10:30:00Z"  // 마지막 기도 날짜
  }
}
```

### Response (실패 - 401 Unauthorized)
```json
{
  "success": false,
  "detail": "로그인이 필요합니다"
}
```

---

## 3. 기도 세션 히스토리 조회 API (선택사항)

### Endpoint
```
GET /api/v1/prayer-sessions
```

### 설명
사용자의 기도 세션 목록을 조회합니다. (향후 히스토리 기능 추가 시 사용)

### 인증
- **필수**: Bearer Token (로그인 필수)

### Query Parameters
```
page: integer (선택, 기본값: 1) - 페이지 번호
limit: integer (선택, 기본값: 20) - 페이지당 항목 수
```

### Response (성공 - 200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "duration": 600,
      "completed_at": "2026-02-22T10:30:00Z",
      "verse_id": 123,
      "verse_reference": "에스겔 37:5,10"
    },
    {
      "id": 455,
      "duration": 900,
      "completed_at": "2026-02-21T09:15:00Z",
      "verse_id": 122,
      "verse_reference": "시편 23:1"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

---

## 데이터베이스 스키마 제안

### prayer_sessions 테이블
```sql
CREATE TABLE prayer_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL,  -- 초 단위
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    verse_id INTEGER REFERENCES daily_verses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_prayer_sessions_user_id ON prayer_sessions(user_id);
CREATE INDEX idx_prayer_sessions_completed_at ON prayer_sessions(completed_at);
CREATE INDEX idx_prayer_sessions_user_completed ON prayer_sessions(user_id, completed_at DESC);
```

---

## 구현 우선순위

### Phase 1 (필수)
1. ✅ POST `/api/v1/prayer-sessions` - 세션 기록
2. ✅ GET `/api/v1/prayer-sessions/stats` - 통계 조회

### Phase 2 (선택)
3. GET `/api/v1/prayer-sessions` - 히스토리 조회
4. DELETE `/api/v1/prayer-sessions/{id}` - 세션 삭제

---

## 비즈니스 로직 참고사항

### 연속 기도 일수 (streak_days) 계산
- 오늘을 포함하여 연속으로 기도한 날짜 수
- 하루에 여러 세션이 있어도 1일로 계산
- 하루라도 빠지면 0으로 리셋

### 예시 계산
```
2026-02-22: 2 sessions (10분, 15분)
2026-02-21: 1 session (20분)
2026-02-20: 1 session (10분)
2026-02-19: 0 sessions (빠짐)
2026-02-18: 1 session (5분)

→ streak_days = 3 (2/20, 2/21, 2/22)
```

---

## 프론트엔드 연동 예시

### 세션 완료 시 호출
```typescript
// frontend/src/api/prayerSession.ts
export const createPrayerSession = async (
  duration: number,
  verseId?: number
): Promise<void> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(`${API_V1}/prayer-sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      duration,
      verse_id: verseId,
    }),
  })

  if (!response.ok) {
    throw new Error('기도 세션 기록에 실패했습니다')
  }

  return response.json()
}
```

### 통계 조회
```typescript
export const getPrayerStats = async (
  period: 'week' | 'month' | 'all' = 'week'
): Promise<PrayerStats> => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    throw new Error('로그인이 필요합니다')
  }

  const response = await apiFetch(
    `${API_V1}/prayer-sessions/stats?period=${period}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('통계 조회에 실패했습니다')
  }

  return response.json()
}
```

---

## 테스트 시나리오

### 1. 세션 기록 테스트
```bash
# 로그인 후 토큰 획득
TOKEN="your_access_token"

# 10분 세션 기록
curl -X POST http://localhost:8000/api/v1/prayer-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 600,
    "verse_id": 1
  }'
```

### 2. 통계 조회 테스트
```bash
# 이번 주 통계
curl -X GET "http://localhost:8000/api/v1/prayer-sessions/stats?period=week" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 참고사항

1. **타임존 처리**: 모든 시간은 UTC로 저장하고, 프론트엔드에서 로컬 시간으로 변환
2. **익명 사용자**: 로그인하지 않은 사용자는 로컬 스토리지에만 저장 (백엔드 호출 안 함)
3. **에러 처리**: 네트워크 오류 시 프론트엔드에서 재시도 로직 구현
4. **성능**: user_id와 completed_at에 복합 인덱스 생성 권장

---

## 질문이나 추가 요청사항

백엔드 구현 중 궁금한 점이나 추가 기능이 필요하면 언제든 말씀해주세요!
