# 무한 스크롤 구현 완료

## 📋 개요
성경 읽기 페이지에서 "20개 구절 더보기" 버튼을 제거하고 **무한 스크롤(Infinite Scroll)** 방식으로 변경하여 자연스러운 읽기 경험을 제공합니다.

## 🔧 구현 내용

### 1. 타입 정의 추가 (`frontend/src/types/bible.ts`)
```typescript
export interface BibleChapterPaginatedResponse {
  book_number: number
  book_name_ko: string
  book_name_en: string
  chapter: number
  verses: BibleVerse[]
  total_verses: number
  current_page: number
  page_size: number
  has_more: boolean
}
```

### 2. API 함수 추가 (`frontend/src/api/bible.ts`)
새로운 페이지네이션 엔드포인트를 호출하는 함수 추가:
```typescript
export const getBibleChapterPaginated = async (
  bookNumber: number, 
  chapter: number, 
  page: number = 1, 
  pageSize: number = 20
): Promise<BibleChapterPaginatedResponse>
```

**엔드포인트:** `GET /api/v1/bible/chapter/{book_number}/{chapter}/paginated?page={page}&page_size={page_size}`

### 3. 무한 스크롤 훅 추가 (`frontend/src/hooks/useBible.ts`)
React Query의 `useInfiniteQuery`를 사용한 무한 스크롤 훅:
```typescript
export const useBibleChapterInfinite = (
  bookNumber: number, 
  chapter: number, 
  enabled: boolean = true
)
```

**주요 기능:**
- 자동 페이지 관리
- `has_more` 플래그로 다음 페이지 존재 여부 확인
- 페이지당 20개 구절 로드
- 캐싱 및 최적화 (1시간 staleTime)

### 4. 컴포넌트 업데이트 (`frontend/src/pages/Bible/BibleStudy.tsx`)

**변경 사항:**
- `useBibleChapter` → `useBibleChapterInfinite`로 변경
- `expandedVerses` 상태 제거 (더 이상 필요 없음)
- Intersection Observer를 사용한 무한 스크롤 구현
- 더보기 버튼 제거

**무한 스크롤 로직:**
```typescript
const observerTarget = useRef<HTMLDivElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    { threshold: 0.1 }
  )
  
  // observer 설정...
}, [hasNextPage, isFetchingNextPage, fetchNextPage])
```

## 🎯 사용자 경험 개선

### 이전 방식
- 처음 5개 구절만 표시
- "20개 구절 더보기" 버튼 클릭 필요
- 읽기 흐름이 끊김

### 새로운 방식
- 처음 20개 구절 자동 로드
- 스크롤하면 자동으로 다음 20개 구절 로드
- 자연스러운 읽기 경험
- 로딩 인디케이터로 상태 표시

## 📱 성능 최적화

1. **페이지네이션**: 한 번에 20개씩만 로드하여 초기 로딩 속도 유지
2. **캐싱**: React Query의 캐싱으로 이미 로드한 데이터 재사용
3. **Intersection Observer**: 효율적인 스크롤 감지
4. **조건부 로딩**: `has_more` 플래그로 불필요한 API 호출 방지

## 🔄 API 요청 흐름

```
1. 사용자가 장 선택
   ↓
2. 첫 페이지 로드 (1-20절)
   GET /api/v1/bible/chapter/43/3/paginated?page=1&page_size=20
   ↓
3. 사용자가 스크롤
   ↓
4. Intersection Observer 감지
   ↓
5. 다음 페이지 자동 로드 (21-40절)
   GET /api/v1/bible/chapter/43/3/paginated?page=2&page_size=20
   ↓
6. has_more가 false일 때까지 반복
```

## ✅ 테스트 체크리스트

- [ ] 장 선택 시 첫 20개 구절 로드 확인
- [ ] 스크롤 시 자동으로 다음 구절 로드 확인
- [ ] 로딩 인디케이터 표시 확인
- [ ] 마지막 구절 도달 시 추가 로드 중단 확인
- [ ] 장 변경 시 스크롤 위치 초기화 확인
- [ ] 네트워크 오류 처리 확인

## 🚀 배포 전 확인사항

1. 백엔드 API 엔드포인트 준비 완료 확인
2. 다양한 장 길이(짧은 장, 긴 장)에서 테스트
3. 모바일 환경에서 스크롤 동작 확인
4. 네트워크 속도가 느린 환경에서 테스트
