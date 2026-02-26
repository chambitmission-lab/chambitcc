# 성경 공부 기능 구현 완료

## 구현된 기능

### 1. API 연동
- `/api/v1/bible/books` - 성경 책 목록 조회
- `/api/v1/bible/chapter/{book}/{chapter}` - 특정 장 읽기
- `/api/v1/bible/verse/{book}/{chapter}/{verse}` - 특정 구절 조회
- `/api/v1/bible/search?keyword=검색어` - 성경 검색

### 2. 주요 파일

#### API 레이어
- `frontend/src/api/bible.ts` - 성경 API 호출 함수
- `frontend/src/types/bible.ts` - 성경 데이터 타입 정의

#### 훅
- `frontend/src/hooks/useBible.ts` - React Query 기반 성경 데이터 훅
  - `useBibleBooks()` - 책 목록
  - `useBibleChapter()` - 장 읽기
  - `useBibleVerse()` - 구절 조회
  - `useBibleSearch()` - 검색

#### UI 컴포넌트
- `frontend/src/pages/Bible/BibleStudy.tsx` - 메인 성경 공부 페이지
- `frontend/src/pages/Bible/BibleStudy.css` - 스타일링 (다크모드 지원)

#### 라우팅
- `/bible` 경로로 접근 가능
- `frontend/src/App.tsx`에 라우트 추가됨

#### 네비게이션
- 헤더 메뉴에 "성경" 메뉴 추가
- `frontend/src/components/layout/NewHeader/components/NavigationMenu.tsx`

#### 다국어 지원
- 한국어/영어 지원
- `frontend/src/locales/ko/bible.ts`
- `frontend/src/locales/en/bible.ts`
- `frontend/src/locales/ko/navigation.ts`
- `frontend/src/locales/en/navigation.ts`

### 3. 기능 상세

#### 읽기 탭
- 구약/신약 책 목록 표시
- 책 선택 시 해당 책의 모든 장 버튼 표시
- 장 선택 시 해당 장의 모든 구절 표시
- 구절 번호와 내용을 깔끔하게 표시

#### 검색 탭
- 키워드로 성경 전체 검색
- 검색 결과에 책명, 장, 절 정보 표시
- 검색 결과 개수 표시

### 4. UI/UX 특징
- Instagram 스타일 디자인 시스템 적용
- 다크모드 완벽 지원
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 로딩 상태 표시
- 빈 결과 처리

### 5. 성능 최적화
- React Query 캐싱
  - 책 목록: 24시간 캐시
  - 장/구절: 1시간 캐시
  - 검색 결과: 5분 캐시
- 조건부 쿼리 실행 (enabled 옵션)

## 사용 방법

1. 헤더 메뉴에서 "성경" 클릭
2. 읽기 탭:
   - 구약 또는 신약에서 책 선택
   - 장 번호 클릭
   - 구절 읽기
3. 검색 탭:
   - 검색어 입력
   - 검색 버튼 클릭
   - 결과 확인

## 백엔드 요구사항

백엔드에서 다음 API 엔드포인트를 구현해야 합니다:

### GET /api/v1/bible/books
```json
[
  {
    "id": 1,
    "book_name": "창세기",
    "book_name_eng": "Genesis",
    "testament": "OLD",
    "book_order": 1,
    "chapter_count": 50
  }
]
```

### GET /api/v1/bible/chapter/{book}/{chapter}
```json
{
  "book_name": "창세기",
  "book_name_eng": "Genesis",
  "chapter": 1,
  "verses": [
    {
      "id": 1,
      "book_id": 1,
      "book_name": "창세기",
      "chapter": 1,
      "verse": 1,
      "text": "태초에 하나님이 천지를 창조하시니라"
    }
  ]
}
```

### GET /api/v1/bible/verse/{book}/{chapter}/{verse}
```json
{
  "id": 1,
  "book_id": 1,
  "book_name": "창세기",
  "chapter": 1,
  "verse": 1,
  "text": "태초에 하나님이 천지를 창조하시니라"
}
```

### GET /api/v1/bible/search?keyword={keyword}&page={page}&limit={limit}
```json
{
  "total": 100,
  "results": [
    {
      "id": 1,
      "book_id": 1,
      "book_name": "창세기",
      "chapter": 1,
      "verse": 1,
      "text": "태초에 하나님이 천지를 창조하시니라"
    }
  ]
}
```

## 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `/bible` 접속
3. 책 선택 및 읽기 테스트
4. 검색 기능 테스트
5. 다크모드 전환 테스트
6. 모바일 반응형 테스트
