# 기도 목록 캐싱 가이드

## 개요
React Query(TanStack Query)를 사용하여 기도 목록 API 응답을 캐싱하고 최적화했습니다.

## 주요 개선 사항

### 1. 자동 캐싱
- **staleTime: 2분** - 2분간은 캐시된 데이터를 fresh로 간주하여 재요청하지 않음
- **gcTime: 30분** - 30분간 메모리에 캐시 유지 (이전 cacheTime)
- 사용자가 페이지를 다시 방문하면 즉시 캐시된 데이터 표시

### 2. 백그라운드 리페치
```typescript
// 캐시된 데이터를 먼저 보여주고
// staleTime이 지나면 백그라운드에서 자동으로 최신 데이터 가져옴
const query = useInfiniteQuery({
  queryKey: prayerKeys.list(sort, fingerprint),
  queryFn: ({ pageParam = 1 }) => fetchPrayers(pageParam, 20, sort, fingerprint),
  staleTime: 1000 * 60 * 2, // 2분
})
```

### 3. Optimistic Updates (낙관적 업데이트)
기도했어요 버튼 클릭 시:
1. 즉시 UI 업데이트 (서버 응답 기다리지 않음)
2. 백그라운드에서 API 호출
3. 실패 시 자동 롤백
4. 성공 시 서버 응답으로 정확한 값 업데이트

```typescript
const toggleMutation = useMutation({
  mutationFn: (prayerId: number) => togglePrayer(prayerId, fingerprint),
  onMutate: async (prayerId) => {
    // 즉시 UI 업데이트
    queryClient.setQueryData(...)
  },
  onError: (err, prayerId, context) => {
    // 실패 시 롤백
    queryClient.setQueryData(context.previousData)
  },
})
```

### 4. 무한 스크롤 최적화
- 각 페이지별로 캐싱
- 이미 로드된 페이지는 재요청하지 않음
- 스크롤 시 다음 페이지만 로드

### 5. 중복 요청 제거
- 같은 데이터를 여러 컴포넌트에서 요청해도 한 번만 API 호출
- 모든 컴포넌트가 같은 캐시 공유

## 사용 방법

### 기본 사용
```typescript
import { usePrayersInfinite } from '../../hooks/usePrayersQuery'

const MyComponent = () => {
  const { 
    prayers,        // 모든 기도 목록 (flat array)
    loading,        // 초기 로딩 상태
    error,          // 에러 메시지
    hasMore,        // 더 불러올 데이터가 있는지
    loadMore,       // 다음 페이지 로드
    isFetchingMore, // 추가 로딩 중
    handlePrayerToggle, // 기도했어요 토글
    refresh,        // 수동 새로고침
  } = usePrayersInfinite('popular')

  return (
    <div>
      {prayers.map(prayer => (
        <PrayerCard 
          key={prayer.id} 
          prayer={prayer}
          onToggle={() => handlePrayerToggle(prayer.id)}
        />
      ))}
    </div>
  )
}
```

### 정렬 변경
```typescript
const [sort, setSort] = useState<SortType>('popular')
const prayerHook = usePrayersInfinite(sort)

// 정렬 변경 시 자동으로 새로운 쿼리 실행
const handleSortChange = (newSort: SortType) => {
  setSort(newSort) // 이것만으로 충분!
}
```

### 무한 스크롤 구현
```typescript
const loadMoreRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (!loadMoreRef.current || loading || !hasMore) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isFetchingMore) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )

  observer.observe(loadMoreRef.current)
  return () => observer.disconnect()
}, [loading, hasMore, isFetchingMore])

// JSX
<div ref={loadMoreRef} className="h-10" />
```

## 캐시 전략 설정

### 전역 설정 (config/queryClient.ts)
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5분
      gcTime: 1000 * 60 * 30,         // 30분
      retry: 1,                       // 실패 시 1번 재시도
      refetchOnWindowFocus: false,    // 윈도우 포커스 시 리페치 안함
    },
  },
})
```

### 쿼리별 설정 (hooks/usePrayersQuery.ts)
```typescript
const query = useInfiniteQuery({
  queryKey: prayerKeys.list(sort, fingerprint),
  queryFn: ({ pageParam = 1 }) => fetchPrayers(...),
  staleTime: 1000 * 60 * 2, // 이 쿼리만 2분
  enabled: !!fingerprint,    // fingerprint가 있을 때만 실행
})
```

## 개발자 도구

React Query DevTools가 포함되어 있어 캐시 상태를 실시간으로 확인할 수 있습니다.

- 개발 모드에서 화면 하단에 React Query 아이콘 표시
- 클릭하면 모든 쿼리의 상태, 캐시 데이터, 리페치 타이밍 등 확인 가능
- 수동으로 쿼리 무효화, 리페치 등 테스트 가능

## 성능 개선 효과

### Before (기존 방식)
- 페이지 방문 시마다 API 호출
- 정렬 변경 시 전체 데이터 재로드
- 기도했어요 클릭 시 서버 응답 대기
- 중복 요청 발생 가능

### After (React Query)
- 2분 내 재방문 시 즉시 표시 (API 호출 없음)
- 정렬별로 캐시 유지 (인기순 ↔ 최신순 전환 시 즉시 표시)
- 기도했어요 클릭 시 즉시 UI 반영
- 중복 요청 자동 제거
- 백그라운드에서 자동 업데이트

## 추가 최적화 가능 사항

### 1. Prefetching (선제적 로딩)
```typescript
// 다음 페이지 미리 로드
queryClient.prefetchInfiniteQuery({
  queryKey: prayerKeys.list(sort, fingerprint),
  queryFn: ({ pageParam = 1 }) => fetchPrayers(pageParam + 1, ...),
})
```

### 2. Persistent Cache (영구 캐시)
```typescript
// localStorage에 캐시 저장
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

persistQueryClient({
  queryClient,
  persister,
})
```

### 3. 조건부 리페치
```typescript
// 특정 조건에서만 백그라운드 리페치
refetchOnMount: 'always',      // 마운트 시 항상 리페치
refetchOnReconnect: true,      // 네트워크 재연결 시 리페치
refetchInterval: 1000 * 60,    // 1분마다 자동 리페치
```

## 문제 해결

### 캐시가 업데이트되지 않을 때
```typescript
// 수동으로 캐시 무효화
queryClient.invalidateQueries({ queryKey: prayerKeys.lists() })

// 또는 특정 쿼리만
queryClient.invalidateQueries({ queryKey: prayerKeys.list(sort, fingerprint) })
```

### 캐시 초기화
```typescript
// 모든 캐시 제거
queryClient.clear()

// 특정 쿼리만 제거
queryClient.removeQueries({ queryKey: prayerKeys.lists() })
```

## 참고 자료
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [React Query 캐싱 가이드](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
