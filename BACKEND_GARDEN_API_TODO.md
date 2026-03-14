# 🌸 디지털 가드닝 백엔드 API 구현 가이드

## ✅ 구현 완료

백엔드 API가 구현되어 프론트엔드에서 활성화되었습니다!

**변경 사항:**
- `frontend/src/hooks/useGarden.ts` - API 호출 활성화 완료
- 백엔드 API 연동 완료

## 📋 구현된 API

## 🎯 필요한 백엔드 API

### 1. 읽은 구절 조회 API (필수)

#### GET `/api/v1/bible/verses/read`

정원 기능의 핵심 API입니다. 사용자가 읽은 모든 구절을 조회합니다.

**Query Parameters:**
```
- book_id (optional): 책 ID 필터
- chapter (optional): 장 번호 필터
- start_date (optional): 시작 날짜 (ISO 8601)
- end_date (optional): 종료 날짜 (ISO 8601)
- page (optional): 페이지 번호 (기본: 1)
- page_size (optional): 페이지 크기 (기본: 50, 최대: 1000)
```

**Response:**
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
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 1000,
      "total_items": 150,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

**데이터베이스 쿼리 예시 (Python/SQLAlchemy):**
```python
from sqlalchemy import select
from sqlalchemy.orm import Session

def get_read_verses(
    db: Session,
    user_id: int,
    book_id: Optional[int] = None,
    chapter: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50
):
    # 기본 쿼리
    query = (
        select(
            BibleReadingRecord.id,
            BibleReadingRecord.verse_id,
            BibleVerse.book_id,
            BibleBook.book_name_ko,
            BibleVerse.chapter,
            BibleVerse.verse,
            BibleVerse.text,
            BibleReadingRecord.similarity,
            BibleReadingRecord.read_at
        )
        .join(BibleVerse, BibleReadingRecord.verse_id == BibleVerse.id)
        .join(BibleBook, BibleVerse.book_id == BibleBook.id)
        .where(BibleReadingRecord.user_id == user_id)
    )
    
    # 필터 적용
    if book_id:
        query = query.where(BibleVerse.book_id == book_id)
    if chapter:
        query = query.where(BibleVerse.chapter == chapter)
    if start_date:
        query = query.where(BibleReadingRecord.read_at >= start_date)
    if end_date:
        query = query.where(BibleReadingRecord.read_at <= end_date)
    
    # 정렬 (최신순)
    query = query.order_by(BibleReadingRecord.read_at.desc())
    
    # 페이지네이션
    total = db.execute(select(func.count()).select_from(query.subquery())).scalar()
    offset = (page - 1) * page_size
    results = db.execute(query.offset(offset).limit(page_size)).all()
    
    return {
        "read_verses": [
            {
                "id": r.id,
                "verse_id": r.verse_id,
                "book_id": r.book_id,
                "book_name_ko": r.book_name_ko,
                "chapter": r.chapter,
                "verse": r.verse,
                "text": r.text,
                "similarity": float(r.similarity),
                "read_at": r.read_at.isoformat()
            }
            for r in results
        ],
        "pagination": {
            "current_page": page,
            "page_size": page_size,
            "total_items": total,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        }
    }
```

### 2. 구절 읽음 처리 API (이미 구현됨?)

#### POST `/api/v1/bible/verses/{verse_id}/read`

이 API는 이미 구현되어 있을 가능성이 높습니다. 확인이 필요합니다.

**Request:**
```json
{
  "similarity": 0.95,
  "read_at": "2024-03-07T10:30:00Z"
}
```

**Response:**
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

## 🔧 백엔드 구현 체크리스트

### Phase 1: 기본 기능 (필수)
- [ ] `GET /api/v1/bible/verses/read` 엔드포인트 구현
- [ ] 페이지네이션 지원 (page_size 최대 1000)
- [ ] 날짜 필터 지원 (start_date, end_date)
- [ ] 책/장 필터 지원 (book_id, chapter)
- [ ] 인증 미들웨어 적용
- [ ] 에러 핸들링 (400, 401, 404)

### Phase 2: 성능 최적화 (권장)
- [ ] 데이터베이스 인덱스 추가
  - `bible_reading_records(user_id, read_at)`
  - `bible_reading_records(user_id, verse_id)`
- [ ] 쿼리 최적화 (JOIN 최소화)
- [ ] 캐싱 구현 (Redis)
  - 키: `user:{user_id}:read_verses`
  - TTL: 5분

### Phase 3: 추가 기능 (선택)
- [ ] 읽기 통계 API
- [ ] 월별 집계 API
- [ ] 읽기 진행률 API

## 🚀 백엔드 구현 후 프론트엔드 활성화

백엔드 API가 준비되면 다음 파일을 수정하세요:

### 1. `frontend/src/hooks/useGarden.ts`

```typescript
// 변경 전
const { data: readVersesData, isLoading, error } = useReadVerses(
  { page_size: 1000 },
  false // 비활성화
)

// 변경 후
const { data: readVersesData, isLoading, error } = useReadVerses({
  page_size: 1000,
})
```

### 2. 로딩/에러 상태 복원

```typescript
return {
  flowers,
  monthlyGardens,
  currentMonthGarden,
  isLoading, // false → 실제 로딩 상태
  error, // null → 실제 에러 상태
}
```

## 🧪 테스트 방법

### 1. API 테스트 (cURL)

```bash
# 읽은 구절 조회
curl -X GET "http://localhost:8000/api/v1/bible/verses/read?page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 구절 읽음 처리
curl -X POST "http://localhost:8000/api/v1/bible/verses/1/read" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"similarity": 0.95, "read_at": "2024-03-07T10:30:00Z"}'
```

### 2. 프론트엔드 테스트

1. 백엔드 API 구현 완료
2. `useGarden.ts` 수정 (위 참고)
3. 프론트엔드 재빌드: `npm run build`
4. 브라우저에서 `/garden` 접속
5. 성경 읽기 후 정원 확인

## 📊 예상 데이터 흐름

```
1. 사용자가 성경 구절 읽기
   ↓
2. POST /api/v1/bible/verses/{verse_id}/read
   ↓
3. bible_reading_records 테이블에 저장
   ↓
4. 정원 페이지 접속
   ↓
5. GET /api/v1/bible/verses/read?page_size=1000
   ↓
6. 읽은 구절 데이터 반환
   ↓
7. 프론트엔드에서 꽃으로 변환
   ↓
8. 정원에 표시
```

## 🐛 예상 문제 및 해결

### 문제 1: 422 Unprocessable Entity
**원인:** page_size가 너무 크거나 잘못된 파라미터
**해결:** 백엔드에서 page_size 최대값 검증 (1000)

### 문제 2: 성능 저하 (많은 구절)
**원인:** JOIN이 많거나 인덱스 부족
**해결:** 
- 인덱스 추가
- 쿼리 최적화
- 캐싱 구현

### 문제 3: 타임아웃
**원인:** 데이터가 너무 많음
**해결:**
- 페이지네이션 강제 (최대 1000개)
- 날짜 필터 권장 (최근 1년)

## 📝 데이터베이스 스키마 확인

백엔드에 다음 테이블이 있는지 확인하세요:

```sql
-- 읽기 기록 테이블
CREATE TABLE bible_reading_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    verse_id BIGINT NOT NULL REFERENCES bible_verses(id),
    similarity DECIMAL(3, 2) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, verse_id)
);

-- 인덱스
CREATE INDEX idx_bible_reading_user_read_at 
ON bible_reading_records(user_id, read_at DESC);
```

## 🎯 우선순위

1. **최우선 (P0):** `GET /api/v1/bible/verses/read` 구현
2. **높음 (P1):** 페이지네이션 및 필터 지원
3. **중간 (P2):** 성능 최적화 (인덱스, 캐싱)
4. **낮음 (P3):** 추가 통계 API

## 📞 도움이 필요하신가요?

- 📖 API 스펙: `BIBLE_READING_API_SPEC.md` 참고
- 🐛 이슈 발생 시: GitHub Issues
- 💬 질문: 개발팀 채널

**백엔드 API 구현 후 정원 기능이 완전히 작동합니다! 🌸**
