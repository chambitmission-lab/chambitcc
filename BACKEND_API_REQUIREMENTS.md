# 🔌 백엔드 API 요구사항 - 업적 시스템

## 📋 개요

프로필 화면의 업적 및 보상 시스템을 위해 백엔드 API에 추가 데이터가 필요합니다.

## 🎯 필수 API 확장

### 1. 프로필 통계 API 확장

**엔드포인트**: `GET /api/v1/profile/stats` 또는 `GET /api/v1/profile/detail`

**현재 응답 구조**:
```json
{
  "user_id": 1,
  "username": "user123",
  "full_name": "홍길동",
  "activity": {
    "this_week_count": 5,
    "total_count": 30,
    "streak_days": 7
  },
  "content": {
    "my_prayers": 10,
    "praying_for": 15,
    "my_replies": 25
  }
}
```

**추가 필요 필드**:
```json
{
  "user_id": 1,
  "username": "user123",
  "full_name": "홍길동",
  "activity": {
    "this_week_count": 5,
    "total_count": 30,
    "streak_days": 7,
    "total_prayer_time": 150  // ⭐ 추가: 총 기도 시간 (분 단위)
  },
  "content": {
    "my_prayers": 10,
    "praying_for": 15,
    "my_replies": 25
  },
  "bible_reading": {  // ⭐ 추가: 성경 읽기 통계
    "chapters_read": 50,
    "books_completed": ["창세기", "출애굽기"]
  }
}
```

## 📊 데이터 수집 방법

### 1. 기도 시간 추적 (`total_prayer_time`)

#### 방법 A: 기도 작성 시 예상 시간 기록
```python
# 기도 작성 시
prayer_time = len(prayer_content.split()) * 0.5  # 단어당 0.5분 추정
user.total_prayer_time += prayer_time
```

#### 방법 B: 사용자가 직접 입력
```python
# 기도 작성 폼에 "기도 시간" 필드 추가
{
  "title": "기도 제목",
  "content": "기도 내용",
  "prayer_duration": 10  # 사용자가 입력한 기도 시간 (분)
}
```

#### 방법 C: 프론트엔드에서 타이머 측정 후 전송
```python
# 프론트엔드에서 기도 작성 시작/종료 시간 측정
POST /api/v1/prayers/log-time
{
  "prayer_id": 123,
  "duration_minutes": 15
}
```

**권장**: 방법 C (가장 정확)

### 2. 성경 읽기 추적 (`bible_reading`)

#### 필요한 테이블
```sql
CREATE TABLE bible_reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    book_name VARCHAR(50),  -- 예: "창세기", "출애굽기"
    chapter_number INTEGER,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_name, chapter_number)
);
```

#### API 엔드포인트 추가
```python
# 성경 읽기 기록
POST /api/v1/bible/reading/mark
{
  "book_name": "창세기",
  "chapter_number": 1
}

# 응답
{
  "success": true,
  "chapters_read": 51,  # 총 읽은 장 수
  "books_completed": ["창세기"]  # 완독한 책 목록
}
```

#### 완독 판단 로직
```python
BIBLE_CHAPTERS = {
    "창세기": 50,
    "출애굽기": 40,
    "레위기": 27,
    # ... 전체 성경 66권
}

def get_completed_books(user_id):
    completed = []
    for book_name, total_chapters in BIBLE_CHAPTERS.items():
        read_chapters = BibleReadingProgress.query.filter_by(
            user_id=user_id,
            book_name=book_name
        ).count()
        
        if read_chapters >= total_chapters:
            completed.append(book_name)
    
    return completed
```

## 🔧 구현 우선순위

### Phase 1: 최소 기능 (1-2일)
- [x] 프론트엔드 구현 완료
- [ ] `total_prayer_time` 필드 추가 (추정값 사용)
- [ ] 프로필 API 응답에 포함

### Phase 2: 성경 읽기 (1주)
- [ ] `bible_reading_progress` 테이블 생성
- [ ] 성경 읽기 기록 API 구현
- [ ] 프로필 API에 `bible_reading` 필드 추가

### Phase 3: 정확한 기도 시간 (2주)
- [ ] 프론트엔드 타이머 구현
- [ ] 기도 시간 로깅 API 구현
- [ ] 실제 측정값으로 업데이트

## 📝 데이터베이스 스키마 변경

### 1. users 테이블 확장
```sql
ALTER TABLE users 
ADD COLUMN total_prayer_time INTEGER DEFAULT 0;  -- 분 단위

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_users_prayer_time ON users(total_prayer_time);
```

### 2. bible_reading_progress 테이블 생성
```sql
CREATE TABLE bible_reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_name VARCHAR(50) NOT NULL,
    chapter_number INTEGER NOT NULL,
    read_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_name, chapter_number)
);

CREATE INDEX idx_bible_reading_user ON bible_reading_progress(user_id);
CREATE INDEX idx_bible_reading_book ON bible_reading_progress(user_id, book_name);
```

### 3. prayer_time_logs 테이블 (선택적)
```sql
CREATE TABLE prayer_time_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prayer_id INTEGER REFERENCES prayers(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prayer_time_user ON prayer_time_logs(user_id);
```

## 🔌 API 엔드포인트 상세

### 1. 프로필 통계 조회 (수정)
```
GET /api/v1/profile/stats
GET /api/v1/profile/detail
```

**응답 예시**:
```json
{
  "user_id": 1,
  "username": "user123",
  "full_name": "홍길동",
  "activity": {
    "this_week_count": 5,
    "total_count": 30,
    "streak_days": 7,
    "total_prayer_time": 150
  },
  "content": {
    "my_prayers": 10,
    "praying_for": 15,
    "my_replies": 25
  },
  "bible_reading": {
    "chapters_read": 50,
    "books_completed": ["창세기", "출애굽기"]
  }
}
```

### 2. 기도 시간 기록 (신규)
```
POST /api/v1/prayers/log-time
```

**요청**:
```json
{
  "prayer_id": 123,  // 선택적
  "duration_minutes": 15
}
```

**응답**:
```json
{
  "success": true,
  "total_prayer_time": 165,
  "message": "기도 시간이 기록되었습니다"
}
```

### 3. 성경 읽기 기록 (신규)
```
POST /api/v1/bible/reading/mark
```

**요청**:
```json
{
  "book_name": "창세기",
  "chapter_number": 1
}
```

**응답**:
```json
{
  "success": true,
  "already_read": false,
  "chapters_read": 51,
  "books_completed": ["창세기"],
  "book_progress": {
    "book_name": "창세기",
    "chapters_read": 50,
    "total_chapters": 50,
    "completed": true
  }
}
```

### 4. 성경 읽기 진행도 조회 (신규)
```
GET /api/v1/bible/reading/progress
```

**응답**:
```json
{
  "total_chapters_read": 50,
  "books_completed": ["창세기"],
  "books_in_progress": [
    {
      "book_name": "출애굽기",
      "chapters_read": 10,
      "total_chapters": 40,
      "progress_percentage": 25
    }
  ]
}
```

### 5. 성경 읽기 기록 삭제 (신규)
```
DELETE /api/v1/bible/reading/mark
```

**요청**:
```json
{
  "book_name": "창세기",
  "chapter_number": 1
}
```

## 🔐 권한 및 보안

### 인증
- 모든 엔드포인트는 JWT 토큰 필요
- `Authorization: Bearer <token>` 헤더 사용

### 권한
- 사용자는 자신의 데이터만 조회/수정 가능
- 관리자는 모든 사용자 데이터 조회 가능

### 유효성 검사
```python
# 성경 읽기 기록 시
- book_name: 66권 성경 중 하나여야 함
- chapter_number: 해당 책의 장 범위 내여야 함

# 기도 시간 기록 시
- duration_minutes: 1 ~ 1440 (24시간) 범위
```

## 📈 성능 고려사항

### 캐싱
```python
# Redis 캐싱 (10분)
@cache.cached(timeout=600, key_prefix='profile_stats')
def get_profile_stats(user_id):
    # ...
```

### 쿼리 최적화
```python
# N+1 문제 방지
def get_bible_reading_stats(user_id):
    # 한 번의 쿼리로 모든 데이터 가져오기
    readings = BibleReadingProgress.query.filter_by(
        user_id=user_id
    ).all()
    
    # 메모리에서 처리
    chapters_read = len(readings)
    books_completed = calculate_completed_books(readings)
    
    return {
        "chapters_read": chapters_read,
        "books_completed": books_completed
    }
```

### 인덱스
- `user_id`에 인덱스 필수
- 자주 조회되는 필드에 복합 인덱스

## 🧪 테스트 데이터

### 개발/테스트용 시드 데이터
```python
# 테스트 사용자 데이터
test_user = {
    "user_id": 999,
    "username": "test_user",
    "full_name": "테스트 사용자",
    "activity": {
        "total_prayer_time": 150,
        "total_count": 30,
        "streak_days": 7
    },
    "bible_reading": {
        "chapters_read": 50,
        "books_completed": ["창세기"]
    }
}
```

## 📊 마이그레이션 전략

### 기존 사용자 데이터 처리
```python
# 기존 사용자의 total_prayer_time 추정
def migrate_prayer_time():
    users = User.query.all()
    for user in users:
        # 기도 횟수 기반 추정 (1회당 5분)
        estimated_time = user.total_prayer_count * 5
        user.total_prayer_time = estimated_time
    db.session.commit()
```

## 🔄 프론트엔드 연동

### 현재 상태
- 프론트엔드는 이미 구현 완료
- API 데이터가 없으면 추정값 사용
- API 데이터가 있으면 자동으로 사용

### 연동 후 동작
```typescript
// frontend/src/pages/Profile/Profile.tsx
const activityData = {
  totalPrayerTime: data.stats.activity.total_prayer_time || data.stats.activity.total_count * 5,
  bibleChaptersRead: data.stats.bible_reading?.chapters_read || 0,
  bibleBooksCompleted: data.stats.bible_reading?.books_completed || [],
  // ...
}
```

## ✅ 체크리스트

### 백엔드 개발자용
- [ ] `users` 테이블에 `total_prayer_time` 컬럼 추가
- [ ] `bible_reading_progress` 테이블 생성
- [ ] 프로필 API 응답에 새 필드 추가
- [ ] 성경 읽기 기록 API 구현
- [ ] 기도 시간 로깅 API 구현 (선택적)
- [ ] 기존 사용자 데이터 마이그레이션
- [ ] API 문서 업데이트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성

### 프론트엔드 개발자용
- [x] 업적 시스템 UI 구현
- [x] API 연동 준비 (선택적 필드)
- [ ] 성경 읽기 기록 UI 추가 (향후)
- [ ] 기도 시간 타이머 추가 (향후)

## 📞 문의사항

백엔드 API 구현 중 질문이나 논의가 필요한 사항:

1. **기도 시간 측정 방법**: 어떤 방식을 선호하시나요?
   - A: 자동 추정 (단어 수 기반)
   - B: 사용자 입력
   - C: 프론트엔드 타이머

2. **성경 책 이름**: 한글/영어 중 어떤 것을 사용하시나요?
   - 한글: "창세기", "출애굽기"
   - 영어: "Genesis", "Exodus"

3. **완독 기준**: 모든 장을 읽어야 하나요, 아니면 일부만 읽어도 되나요?

4. **데이터 보관 기간**: 성경 읽기 기록을 영구 보관하시나요?

## 🎯 예상 개발 시간

- **Phase 1** (기도 시간 추정값): 2-3시간
- **Phase 2** (성경 읽기 기본): 1-2일
- **Phase 3** (정확한 기도 시간): 2-3일

**총 예상 시간**: 3-5일
