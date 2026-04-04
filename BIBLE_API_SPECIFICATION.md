# 성경 공부 기능 백엔드 API 명세서

## 개요
프론트엔드에서 성경 공부 기능을 구현했습니다. 아래 4개의 API 엔드포인트를 구현해주세요.

## 데이터베이스 정보
- SourceForge에서 한글 성경 JSON 다운로드 완료 (31,102구절)
- 66권의 성경 책 정보와 모든 구절 Import 완료

---

## API 엔드포인트

### 1. 성경 책 목록 조회

**Endpoint:** `GET /api/v1/bible/books`

**설명:** 66권의 성경 책 목록을 반환합니다.

**인증:** 불필요 (공개 API)

**응답 예시:**
```json
[
  {
    "id": 1,
    "book_name": "창세기",
    "book_name_eng": "Genesis",
    "testament": "OLD",
    "book_order": 1,
    "chapter_count": 50
  },
  {
    "id": 2,
    "book_name": "출애굽기",
    "book_name_eng": "Exodus",
    "testament": "OLD",
    "book_order": 2,
    "chapter_count": 40
  },
  {
    "id": 40,
    "book_name": "마태복음",
    "book_name_eng": "Matthew",
    "testament": "NEW",
    "book_order": 40,
    "chapter_count": 28
  }
]
```

**필드 설명:**
- `id`: 책 고유 ID (정수)
- `book_name`: 한글 책 이름 (문자열)
- `book_name_eng`: 영문 책 이름 (문자열)
- `testament`: 구약/신약 구분 (문자열, "OLD" 또는 "NEW")
- `book_order`: 성경 순서 (정수, 1-66)
- `chapter_count`: 해당 책의 총 장 수 (정수)

---

### 2. 특정 장 읽기

**Endpoint:** `GET /api/v1/bible/chapter/{book}/{chapter}`

**설명:** 특정 책의 특정 장에 있는 모든 구절을 반환합니다.

**인증:** 불필요 (공개 API)

**경로 파라미터:**
- `book`: 책 이름 (예: "창세기", "요한복음") - URL 인코딩 필요
- `chapter`: 장 번호 (정수)

**예시 요청:**
```
GET /api/v1/bible/chapter/요한복음/3
GET /api/v1/bible/chapter/%EC%9A%94%ED%95%9C%EB%B3%B5%EC%9D%8C/3
```

**응답 예시:**
```json
{
  "book_name": "요한복음",
  "book_name_eng": "John",
  "chapter": 3,
  "verses": [
    {
      "id": 26137,
      "book_id": 43,
      "book_name": "요한복음",
      "chapter": 3,
      "verse": 1,
      "text": "그런데 바리새인 중에 니고데모라 하는 사람이 있으니 유대인의 지도자라"
    },
    {
      "id": 26138,
      "book_id": 43,
      "book_name": "요한복음",
      "chapter": 3,
      "verse": 2,
      "text": "그가 밤에 예수께 와서 이르되 랍비여 우리가 당신은 하나님께로부터 오신 선생인 줄 아나이다 하나님이 함께 하시지 아니하시면 당신이 행하시는 이 표적을 아무도 할 수 없음이니이다"
    },
    {
      "id": 26139,
      "book_id": 43,
      "book_name": "요한복음",
      "chapter": 3,
      "verse": 3,
      "text": "예수께서 대답하여 이르시되 진실로 진실로 네게 이르노니 사람이 거듭나지 아니하면 하나님의 나라를 볼 수 없느니라"
    }
  ]
}
```

**필드 설명:**
- `book_name`: 책 이름 (문자열)
- `book_name_eng`: 영문 책 이름 (문자열)
- `chapter`: 장 번호 (정수)
- `verses`: 구절 배열
  - `id`: 구절 고유 ID (정수)
  - `book_id`: 책 ID (정수)
  - `book_name`: 책 이름 (문자열)
  - `chapter`: 장 번호 (정수)
  - `verse`: 절 번호 (정수)
  - `text`: 구절 내용 (문자열)

**에러 응답:**
- 404: 책이나 장을 찾을 수 없음

---

### 3. 특정 구절 조회

**Endpoint:** `GET /api/v1/bible/verse/{book}/{chapter}/{verse}`

**설명:** 특정 책의 특정 장의 특정 절을 반환합니다.

**인증:** 불필요 (공개 API)

**경로 파라미터:**
- `book`: 책 이름 (예: "창세기", "요한복음") - URL 인코딩 필요
- `chapter`: 장 번호 (정수)
- `verse`: 절 번호 (정수)

**예시 요청:**
```
GET /api/v1/bible/verse/요한복음/3/16
```

**응답 예시:**
```json
{
  "id": 26152,
  "book_id": 43,
  "book_name": "요한복음",
  "chapter": 3,
  "verse": 16,
  "text": "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라"
}
```

**에러 응답:**
- 404: 구절을 찾을 수 없음

---

### 4. 성경 검색

**Endpoint:** `GET /api/v1/bible/search`

**설명:** 키워드로 성경 전체를 검색합니다.

**인증:** 불필요 (공개 API)

**쿼리 파라미터:**
- `keyword`: 검색 키워드 (필수, 문자열)
- `page`: 페이지 번호 (선택, 기본값: 1)
- `limit`: 페이지당 결과 수 (선택, 기본값: 20)

**예시 요청:**
```
GET /api/v1/bible/search?keyword=사랑&page=1&limit=20
```

**응답 예시:**
```json
{
  "total": 156,
  "results": [
    {
      "id": 26152,
      "book_id": 43,
      "book_name": "요한복음",
      "chapter": 3,
      "verse": 16,
      "text": "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라"
    },
    {
      "id": 28234,
      "book_id": 45,
      "book_name": "로마서",
      "chapter": 5,
      "verse": 8,
      "text": "우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라"
    }
  ]
}
```

**필드 설명:**
- `total`: 전체 검색 결과 수 (정수)
- `results`: 현재 페이지의 검색 결과 배열
  - 각 항목은 구절 정보와 동일

**검색 요구사항:**
- 구절 내용(`text` 필드)에서 키워드를 포함하는 모든 구절 검색
- 대소문자 구분 없이 검색
- 부분 일치 검색 지원 (LIKE '%keyword%')
- 결과는 성경 순서대로 정렬 (book_order, chapter, verse 순)

---

## 구현 참고사항

### CORS 설정
프론트엔드에서 API를 호출할 수 있도록 CORS 설정이 필요합니다.

### 성능 최적화
1. 책 목록 조회는 자주 호출되므로 캐싱 권장
2. 검색 기능은 인덱스 설정 권장 (text 필드에 Full-Text Index)
3. 페이지네이션 구현으로 대량 데이터 처리

### 에러 처리
```json
{
  "error": "Not Found",
  "message": "해당 책을 찾을 수 없습니다"
}
```

### 데이터베이스 스키마 예시

**books 테이블:**
```sql
CREATE TABLE bible_books (
    id INT PRIMARY KEY,
    book_name VARCHAR(50) NOT NULL,
    book_name_eng VARCHAR(50) NOT NULL,
    testament ENUM('OLD', 'NEW') NOT NULL,
    book_order INT NOT NULL,
    chapter_count INT NOT NULL,
    INDEX idx_testament (testament),
    INDEX idx_book_order (book_order)
);
```

**verses 테이블:**
```sql
CREATE TABLE bible_verses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT NOT NULL,
    book_name VARCHAR(50) NOT NULL,
    chapter INT NOT NULL,
    verse INT NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES bible_books(id),
    INDEX idx_book_chapter (book_id, chapter),
    INDEX idx_search (book_id, chapter, verse),
    FULLTEXT INDEX idx_text (text)
);
```

---

## 테스트 방법

API 구현 후 다음 순서로 테스트해주세요:

1. **책 목록 조회**
   ```bash
   curl http://localhost:8000/api/v1/bible/books
   ```

2. **장 읽기**
   ```bash
   curl http://localhost:8000/api/v1/bible/chapter/창세기/1
   ```

3. **구절 조회**
   ```bash
   curl http://localhost:8000/api/v1/bible/verse/요한복음/3/16
   ```

4. **검색**
   ```bash
   curl "http://localhost:8000/api/v1/bible/search?keyword=사랑&page=1&limit=10"
   ```

---

## 프론트엔드 연동

API 구현이 완료되면 프론트엔드에서 다음 파일을 수정해주세요:

**파일:** `frontend/src/api/bible.ts`

```typescript
// 이 값을 false로 변경
const USE_MOCK_DATA = false
```

이렇게 하면 실제 백엔드 API를 호출하게 됩니다.

---

## 질문이나 문제가 있으면

- API 응답 형식이 명세와 다른 경우
- 추가 필드가 필요한 경우
- 성능 이슈가 있는 경우

프론트엔드 팀에 연락주세요. 함께 조정하겠습니다.
