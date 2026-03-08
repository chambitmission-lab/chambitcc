# 성경 음성 읽기 API 명세서

## 개요
사용자가 성경 구절을 음성으로 읽고 학습 완료를 체크하는 기능을 위한 백엔드 API 명세입니다.

## 인증
모든 API는 JWT 토큰 인증이 필요합니다.
```
Authorization: Bearer {access_token}
```

---

## 1. 구절 읽음 처리

### POST `/api/v1/bible/verses/{verse_id}/read`

사용자가 특정 구절을 읽었음을 기록합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| verse_id | integer | O | 구절 ID |

#### Request Body
```json
{
  "similarity": 0.95,
  "read_at": "2024-03-07T10:30:00Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| similarity | float | O | 텍스트 유사도 (0.0 ~ 1.0) |
| read_at | string | O | 읽은 시각 (ISO 8601) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": 456,
    "verse_id": 1,
    "similarity": 0.95,
    "read_at": "2024-03-07T10:30:00Z",
    "created_at": "2024-03-07T10:30:00Z"
  }
}
```

#### Error Responses
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패)
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 구절을 찾을 수 없음
- `409 Conflict`: 이미 읽음 처리된 구절

---

## 2. 읽은 구절 조회

### GET `/api/v1/bible/verses/read`

사용자가 읽은 구절 목록을 조회합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| book_id | integer | X | 책 ID (필터) |
| chapter | integer | X | 장 번호 (필터) |
| start_date | string | X | 시작 날짜 (ISO 8601) |
| end_date | string | X | 종료 날짜 (ISO 8601) |
| page | integer | X | 페이지 번호 (기본: 1) |
| page_size | integer | X | 페이지 크기 (기본: 50) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "read_verses": [
      {
        "id": 123,
        "verse_id": 1,
        "book_id": 1,
        "book_name_ko": "창세기",
        "chapter": 1,
        "verse": 1,
        "text": "태초에 하나님이 천지를 창조하시니라",
        "similarity": 0.95,
        "read_at": "2024-03-07T10:30:00Z"
      },
      {
        "id": 124,
        "verse_id": 2,
        "book_id": 1,
        "book_name_ko": "창세기",
        "chapter": 1,
        "verse": 2,
        "text": "땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라",
        "similarity": 0.88,
        "read_at": "2024-03-07T10:31:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 50,
      "total_items": 150,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### Error Responses
- `400 Bad Request`: 잘못된 쿼리 파라미터
- `401 Unauthorized`: 인증 실패

---

## 3. 읽기 진행률 조회

### GET `/api/v1/bible/reading-progress`

사용자의 성경 읽기 진행률을 조회합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| book_id | integer | X | 특정 책의 진행률 (없으면 전체) |

#### Response (200 OK) - 전체 진행률
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_verses": 31102,
      "read_verses": 1500,
      "progress": 4.82
    },
    "old_testament": {
      "total_verses": 23145,
      "read_verses": 800,
      "progress": 3.46
    },
    "new_testament": {
      "total_verses": 7957,
      "read_verses": 700,
      "progress": 8.80
    },
    "books": [
      {
        "book_id": 1,
        "book_name_ko": "창세기",
        "book_name_en": "Genesis",
        "total_verses": 1533,
        "read_verses": 150,
        "progress": 9.78,
        "last_read_at": "2024-03-07T10:30:00Z"
      }
    ]
  }
}
```

#### Response (200 OK) - 특정 책 진행률
```json
{
  "success": true,
  "data": {
    "book_id": 1,
    "book_name_ko": "창세기",
    "book_name_en": "Genesis",
    "total_verses": 1533,
    "read_verses": 150,
    "progress": 9.78,
    "chapters": [
      {
        "chapter": 1,
        "total_verses": 31,
        "read_verses": 31,
        "progress": 100.0,
        "completed": true,
        "last_read_at": "2024-03-07T10:30:00Z"
      },
      {
        "chapter": 2,
        "total_verses": 25,
        "read_verses": 15,
        "progress": 60.0,
        "completed": false,
        "last_read_at": "2024-03-07T11:00:00Z"
      }
    ]
  }
}
```

#### Error Responses
- `400 Bad Request`: 잘못된 쿼리 파라미터
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 책을 찾을 수 없음

---

## 4. 읽음 취소

### DELETE `/api/v1/bible/verses/{verse_id}/read`

특정 구절의 읽음 처리를 취소합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| verse_id | integer | O | 구절 ID |

#### Response (200 OK)
```json
{
  "success": true,
  "message": "읽음 처리가 취소되었습니다.",
  "data": {
    "verse_id": 1
  }
}
```

#### Error Responses
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 읽음 기록을 찾을 수 없음

---

## 5. 읽기 통계 조회

### GET `/api/v1/bible/reading-stats`

사용자의 읽기 통계를 조회합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| period | string | X | 기간 (daily, weekly, monthly, yearly) |
| start_date | string | X | 시작 날짜 (ISO 8601) |
| end_date | string | X | 종료 날짜 (ISO 8601) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "period": "weekly",
    "start_date": "2024-03-01",
    "end_date": "2024-03-07",
    "stats": {
      "total_verses_read": 150,
      "total_reading_time": 3600,
      "average_similarity": 0.89,
      "daily_breakdown": [
        {
          "date": "2024-03-01",
          "verses_read": 20,
          "reading_time": 480,
          "average_similarity": 0.91
        },
        {
          "date": "2024-03-02",
          "verses_read": 25,
          "reading_time": 600,
          "average_similarity": 0.88
        }
      ],
      "books_read": [
        {
          "book_id": 1,
          "book_name_ko": "창세기",
          "verses_read": 100,
          "progress": 6.52
        },
        {
          "book_id": 40,
          "book_name_ko": "마태복음",
          "verses_read": 50,
          "progress": 4.67
        }
      ]
    },
    "achievements": [
      {
        "type": "streak",
        "name": "7일 연속 읽기",
        "achieved_at": "2024-03-07T23:59:59Z"
      }
    ]
  }
}
```

#### Error Responses
- `400 Bad Request`: 잘못된 쿼리 파라미터
- `401 Unauthorized`: 인증 실패

---

## 6. 특정 장의 읽은 구절 확인

### GET `/api/v1/bible/chapters/{book_number}/{chapter}/read-status`

특정 장의 각 구절별 읽음 상태를 조회합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| book_number | integer | O | 책 번호 (1-66) |
| chapter | integer | O | 장 번호 |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "book_number": 1,
    "book_name_ko": "창세기",
    "chapter": 1,
    "total_verses": 31,
    "read_verses": 15,
    "progress": 48.39,
    "verses": [
      {
        "verse_id": 1,
        "verse": 1,
        "is_read": true,
        "similarity": 0.95,
        "read_at": "2024-03-07T10:30:00Z"
      },
      {
        "verse_id": 2,
        "verse": 2,
        "is_read": true,
        "similarity": 0.88,
        "read_at": "2024-03-07T10:31:00Z"
      },
      {
        "verse_id": 3,
        "verse": 3,
        "is_read": false,
        "similarity": null,
        "read_at": null
      }
    ]
  }
}
```

#### Error Responses
- `400 Bad Request`: 잘못된 파라미터
- `401 Unauthorized`: 인증 실패
- `404 Not Found`: 장을 찾을 수 없음

---

## 데이터베이스 스키마

### bible_reading_records 테이블
```sql
CREATE TABLE bible_reading_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verse_id BIGINT NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
    similarity DECIMAL(3, 2) NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
    read_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 한 사용자가 같은 구절을 중복으로 읽음 처리할 수 없음
    UNIQUE(user_id, verse_id)
);

-- 인덱스
CREATE INDEX idx_bible_reading_user_id ON bible_reading_records(user_id);
CREATE INDEX idx_bible_reading_verse_id ON bible_reading_records(verse_id);
CREATE INDEX idx_bible_reading_read_at ON bible_reading_records(read_at);
CREATE INDEX idx_bible_reading_user_read_at ON bible_reading_records(user_id, read_at);
```

### 기존 bible_verses 테이블 참조
```sql
-- 이미 존재하는 테이블
CREATE TABLE bible_verses (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(book_id, chapter, verse)
);
```

---

## 비즈니스 로직

### 1. 읽음 처리 규칙
- 유사도가 75% 이상일 때만 읽음 처리
- 한 구절은 한 번만 읽음 처리 가능 (중복 불가)
- 읽은 시각은 클라이언트에서 전송 (서버 시각과 비교하여 검증)

### 2. 진행률 계산
```
진행률 = (읽은 구절 수 / 전체 구절 수) × 100
```

### 3. 통계 계산
- 일일 읽은 구절 수
- 평균 유사도
- 연속 읽기 일수 (streak)
- 완독한 책 수

### 4. 성능 최적화
- 진행률 조회 시 캐싱 (Redis)
- 통계 데이터는 배치로 집계
- 읽음 상태 조회 시 인덱스 활용

---

## 에러 코드

| 코드 | 메시지 | 설명 |
|------|--------|------|
| 400 | INVALID_SIMILARITY | 유사도 값이 0~1 범위를 벗어남 |
| 400 | INVALID_DATE_FORMAT | 날짜 형식이 잘못됨 |
| 401 | UNAUTHORIZED | 인증 토큰이 없거나 유효하지 않음 |
| 404 | VERSE_NOT_FOUND | 구절을 찾을 수 없음 |
| 404 | READING_RECORD_NOT_FOUND | 읽음 기록을 찾을 수 없음 |
| 409 | ALREADY_READ | 이미 읽음 처리된 구절 |

---

## 보안 고려사항

### 1. 인증 및 권한
- 모든 API는 JWT 인증 필요
- 사용자는 자신의 읽기 기록만 조회/수정 가능

### 2. 데이터 검증
- 유사도 값 범위 검증 (0.0 ~ 1.0)
- 날짜 형식 검증
- SQL Injection 방지

### 3. Rate Limiting
- 읽음 처리: 분당 60회
- 조회: 분당 120회

### 4. 데이터 무결성
- UNIQUE 제약으로 중복 방지
- Foreign Key로 참조 무결성 보장
- Transaction으로 원자성 보장

---

## 테스트 시나리오

### 1. 정상 케이스
```
1. 사용자가 구절을 읽음 (유사도 95%)
2. 읽음 처리 API 호출
3. 성공 응답 확인
4. 진행률 조회 시 반영 확인
```

### 2. 중복 읽음 시도
```
1. 사용자가 구절을 읽음
2. 읽음 처리 API 호출 (성공)
3. 같은 구절 다시 읽음 처리 시도
4. 409 Conflict 응답 확인
```

### 3. 유사도 부족
```
1. 사용자가 구절을 부정확하게 읽음 (유사도 60%)
2. 프론트엔드에서 읽음 처리 API 호출 안 함
3. 사용자에게 재시도 안내
```

### 4. 진행률 조회
```
1. 여러 구절 읽음 처리
2. 진행률 조회 API 호출
3. 정확한 진행률 계산 확인
4. 캐싱 동작 확인
```

---

## 구현 우선순위

### Phase 1 (필수)
1. ✅ 구절 읽음 처리 API
2. ✅ 읽은 구절 조회 API
3. ✅ 특정 장의 읽음 상태 조회 API
4. ✅ 데이터베이스 스키마 생성

### Phase 2 (중요)
5. ⬜ 읽기 진행률 조회 API
6. ⬜ 읽음 취소 API
7. ⬜ 캐싱 구현

### Phase 3 (선택)
8. ⬜ 읽기 통계 API
9. ⬜ 배치 집계 작업
10. ⬜ 성취 시스템

---

## 참고사항

### 프론트엔드 연동
- 읽음 처리 성공 시 로컬 상태 업데이트
- 페이지 로드 시 읽음 상태 조회
- 낙관적 업데이트 (Optimistic Update) 적용 가능

### 성능 목표
- 읽음 처리: 100ms 이내
- 조회: 200ms 이내
- 진행률 계산: 500ms 이내 (캐싱 시)

### 모니터링
- API 응답 시간
- 에러율
- 일일 활성 사용자 수
- 평균 읽은 구절 수

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2024-03-07 | 초안 작성 |
