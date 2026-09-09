# Bible Study Components

이 디렉토리는 SOLID 원칙의 **Single Responsibility Principle (단일 책임 원칙)**을 따라 BibleStudy 페이지를 기능별 컴포넌트로 분리한 것입니다.

## 파일 구조

```
components/
├── index.ts                  # 컴포넌트 export 진입점
├── BibleHeader.tsx           # 페이지 헤더
├── BibleTabs.tsx             # 읽기/검색 탭
├── BookSelector.tsx          # 성경 책 선택 그리드
├── ChapterNavigation.tsx     # 장 네비게이션
├── VerseList.tsx             # 성경 본문 리스트 (무한 스크롤)
└── BibleSearch.tsx           # 검색 기능
```

## 각 컴포넌트의 책임

### 1. BibleHeader.tsx
**책임**: 페이지 헤더 표시
- 타이틀 렌더링
- 아이콘 표시
- 다국어 지원

**Props**: 없음

---

### 2. BibleTabs.tsx
**책임**: 읽기/검색 탭 전환
- 탭 UI 렌더링
- 활성 탭 표시
- 탭 클릭 이벤트 처리

**Props**:
```typescript
interface BibleTabsProps {
  activeTab: 'read' | 'search'
  onTabChange: (tab: 'read' | 'search') => void
}
```

---

### 3. BookSelector.tsx
**책임**: 성경 책 선택 인터페이스
- 구약/신약 책 목록 표시
- 로딩/에러 상태 처리
- 책 선택 이벤트 처리

**Props**:
```typescript
interface BookSelectorProps {
  books: BibleBook[] | undefined
  isLoading: boolean
  error: Error | null
  onBookSelect: (bookId: number, bookName: string) => void
}
```

---

### 4. ChapterNavigation.tsx
**책임**: 장 네비게이션 컨트롤
- 이전/다음 장 버튼
- 장 선택 드롭다운
- 책 정보 헤더
- 뒤로가기 버튼

**Props**:
```typescript
interface ChapterNavigationProps {
  selectedBook: string
  selectedChapter: number
  totalChapters: number
  onChapterChange: (chapter: number) => void
  onBackToBooks: () => void
}
```

---

### 5. VerseList.tsx
**책임**: 성경 본문 표시 및 무한 스크롤
- 구절 리스트 렌더링
- Intersection Observer를 통한 무한 스크롤
- 로딩 상태 표시
- 페이지 끝 표시

**Props**:
```typescript
interface VerseListProps {
  chapterData: InfiniteData<BibleChapterPaginatedResponse> | undefined
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}
```

**특징**:
- Intersection Observer API 사용
- 자동 페이지 로딩
- 디버그 로깅 (개발 모드)

---

### 6. BibleSearch.tsx
**책임**: 성경 검색 기능
- 검색 폼 렌더링
- 검색 쿼리 관리
- 검색 결과 표시
- 빈 결과 상태 처리

**Props**: 없음 (내부 상태 관리)

**특징**:
- 자체 상태 관리 (useState)
- useBibleSearch 훅 사용
- 독립적인 검색 로직

---

### 7. SearchBookCard.tsx
**책임**: 검색 결과의 책 카드 + 장 선택 그리드
- 5열 고정 그리드 (두 줄 = 10장, 십진법 스캔)
- 로그인 시 장별 컨텍스트: 완독 ✓ / 읽는 중 진행바 / 밑줄·메모 점
- 책 헤더 탭 → BookQuickPicker 열기

**Props**: `book`, `bookId`, `onSelectChapter`, `onOpenPicker`

---

### 8. BookQuickPicker.tsx
**책임**: 책 퀵 전환 바텀시트
- 구약/신약 섹션 + 3열 책 그리드
- 현재 책 하이라이트 + 열릴 때 해당 위치로 스크롤
- 뒤로가기 시 시트만 닫기 (useModalBackButton)

**Props**: `books`, `currentBookNumber`, `onPick`, `onClose`

---

### 9. together/ (함께 읽기)
**책임**: 성경 → 묵상 → 사람 → 대화 연결. 같은 장을 읽는 성도 수(실시간)와 절 묵상 나눔.

```
together/
├── ChapterPresencePill.tsx    # "지금 N명이 이 장을 함께" / "오늘 N명의 성도가 읽었어요" (장 상단)
├── VerseTogetherChip.tsx      # 절 아래 칩: "N명이 함께 읽는 중" · "묵상 N" (둘 다 0이면 안 그림)
├── ReflectionLiveBanner.tsx   # 같은 장 성도가 방금 남긴 묵상 배너 (readingTogetherBus 구독)
├── VerseReflectionSheet.tsx   # 묵상 나눔 하단 시트 (목록에 하나, 칩·액션 메뉴·배너가 연다)
├── ReflectionCard.tsx         # 묵상 한 장 + 공감/댓글/수정/삭제
├── ReflectionReplies.tsx      # 댓글 목록 + 한 줄 작성 (펼칠 때만 조회)
└── RtAvatar.tsx               # 작성자 아바타
```

**데이터 흐름** (레이어별 책임):
- `hooks/useReadingLine.ts` — 스크롤 위치 → 3초 이상 머문 절 번호 (측정만)
- `hooks/useReadingTogether.ts` — 하트비트(25초·절 바뀔 때·탭 복귀·SSE 재연결) + SSE `reading_presence`/`verse_reflection` → React Query 캐시
- `hooks/useVerseReflections.ts` — 묵상 CRUD·공감·댓글 뮤테이션과 캐시 패치
- `data/presenceSharing.ts` — "함께 읽기" 설정 저장/전파 (읽기 설정 Aa)
- `utils/readingTogetherBus.ts` — 순간 알림(배너)용 이벤트 버스. 캐시가 아니라 사건이라 분리
- `utils/notificationStream.on(event, handler)` — 스트림 확장점. 새 실시간 기능은 매니저를 고치지 않고 핸들러만 등록

**주의**
- 서버 카운트에는 내가 포함돼 있다 → 표시할 땐 `VerseList.liveOthersAt` 이 내 자리에서 1을 뺀다
- 묵상 본문은 로그인 필수, 절별 개수 요약은 비로그인도 조회 가능
- CSS 는 `styles/reading-together.css`, 접두사 `rt-` 필수

---

## 사용 방법

### 개별 import
```typescript
import BibleHeader from './components/BibleHeader'
import BibleTabs from './components/BibleTabs'
```

### 통합 import (권장)
```typescript
import {
  BibleHeader,
  BibleTabs,
  BookSelector,
  ChapterNavigation,
  VerseList,
  BibleSearch
} from './components'
```

---

## 개선 효과

### Before (분리 전)
- 단일 파일: 400+ 줄
- 10개 이상의 state
- 복잡한 JSX 구조
- 테스트 불가능
- 협업 어려움

### After (분리 후)
- 메인 파일: ~80 줄
- 각 컴포넌트: 50-150 줄
- 명확한 책임 분리
- 단위 테스트 가능
- 독립적인 개발 가능

---

## SOLID 원칙 적용

### 1. Single Responsibility Principle (SRP)
각 컴포넌트가 하나의 명확한 책임만 가짐

### 2. Open/Closed Principle (OCP)
Props를 통한 확장 가능, 수정 불필요

### 3. Liskov Substitution Principle (LSP)
컴포넌트 교체 가능

### 4. Interface Segregation Principle (ISP)
필요한 Props만 전달

### 5. Dependency Inversion Principle (DIP)
Props와 훅을 통한 의존성 주입

---

## 테스트 전략

각 컴포넌트는 독립적으로 테스트 가능:

```typescript
// BibleTabs.test.tsx
describe('BibleTabs', () => {
  it('should call onTabChange when tab is clicked', () => {
    const mockOnTabChange = jest.fn()
    render(<BibleTabs activeTab="read" onTabChange={mockOnTabChange} />)
    // ... test logic
  })
})
```

---

## 향후 개선 사항

1. **메모이제이션**: React.memo로 불필요한 리렌더링 방지
2. **에러 바운더리**: 각 컴포넌트에 에러 처리 추가
3. **Storybook**: 컴포넌트 문서화 및 시각적 테스트
4. **접근성**: ARIA 속성 추가
5. **성능 최적화**: useMemo, useCallback 적용
