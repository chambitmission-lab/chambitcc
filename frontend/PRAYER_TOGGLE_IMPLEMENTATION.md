# 기도 토글 기능 구현 문서

## 개요
백엔드 API 스펙에 맞춰 기도 추가/취소 기능을 구현했습니다. SOLID 원칙을 준수하여 유지보수가 용이하고 확장 가능한 구조로 설계했습니다.

## 구현된 기능

### 1. API 레이어 (`frontend/src/api/prayer.ts`)

#### `addPrayer(prayerId, fingerprint)`
- **엔드포인트**: `POST /api/v1/prayers/{prayer_id}/pray`
- **요청**: `{ fingerprint: string }`
- **응답**: `{ success: boolean, message: string }`
- **에러**: 중복 기도 시 에러 메시지 반환

#### `removePrayer(prayerId)`
- **엔드포인트**: `DELETE /api/v1/prayers/{prayer_id}/pray`
- **응답**: `{ success: boolean, message: string }`

### 2. 커스텀 훅 (`frontend/src/hooks/usePrayerToggle.ts`)

**Single Responsibility Principle**: 기도 토글 로직만 담당

**주요 기능**:
- 기도 추가/취소 API 호출
- Optimistic Update로 즉각적인 UI 반응
- 에러 시 자동 롤백
- 성공/에러 토스트 메시지 표시

**인터페이스**:
```typescript
interface UsePrayerToggleOptions {
  fingerprint: string
  sort?: SortType
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

interface PrayerToggleResult {
  togglePrayer: (prayerId: number, isPrayed: boolean) => void
  isToggling: boolean
}
```

### 3. 통합 훅 업데이트 (`frontend/src/hooks/usePrayersQuery.ts`)

**Dependency Inversion Principle**: 추상화된 인터페이스에 의존

- `usePrayersInfinite`: 무한 스크롤 기도 목록에서 토글 기능 사용
- `usePrayerDetail`: 기도 상세 페이지에서 토글 기능 사용

**Open/Closed Principle**: 기존 인터페이스를 유지하면서 새로운 구현 적용

### 4. 토스트 알림 (`frontend/src/utils/toast.ts`)

**Single Responsibility Principle**: 알림 표시만 담당

**기능**:
- 성공/에러 메시지 표시
- 자동 애니메이션 (슬라이드 업)
- 3초 후 자동 제거
- 중복 토스트 방지

### 5. UI 컴포넌트 업데이트

#### `NewHome.tsx`
- 기도 토글 핸들러에 에러 처리 추가
- 토스트 메시지 통합

#### `PrayerDetail.tsx`
- 자동으로 새로운 API 사용 (훅 업데이트로 인해)

## SOLID 원칙 준수

### 1. Single Responsibility Principle (단일 책임 원칙)
- `addPrayer`: 기도 추가만 담당
- `removePrayer`: 기도 취소만 담당
- `usePrayerToggle`: 기도 토글 로직만 담당
- `showToast`: 알림 표시만 담당

### 2. Open/Closed Principle (개방-폐쇄 원칙)
- 기존 `usePrayersInfinite`, `usePrayerDetail` 인터페이스 유지
- 내부 구현만 변경하여 확장

### 3. Liskov Substitution Principle (리스코프 치환 원칙)
- `handlePrayerToggle` 함수는 기존과 동일한 시그니처 유지
- 컴포넌트는 변경 없이 동작

### 4. Interface Segregation Principle (인터페이스 분리 원칙)
- `usePrayerToggle`은 필요한 메서드만 노출
- 옵셔널 콜백으로 유연성 제공

### 5. Dependency Inversion Principle (의존성 역전 원칙)
- 컴포넌트는 구체적인 API가 아닌 훅의 추상화된 인터페이스에 의존
- 훅 내부에서 API 호출 처리

## 사용 예시

### 기도 목록에서 사용
```typescript
const { prayers, handlePrayerToggle, isToggling } = usePrayersInfinite('popular')

<button onClick={() => handlePrayerToggle(prayer.id)}>
  {prayer.is_prayed ? '기도중' : '기도하기'}
</button>
```

### 기도 상세에서 사용
```typescript
const { prayer, handlePrayerToggle, isToggling } = usePrayerDetail(prayerId)

<button onClick={handlePrayerToggle} disabled={isToggling}>
  {prayer.is_prayed ? '기도중' : '기도하기'}
</button>
```

## 에러 처리

1. **중복 기도**: 백엔드에서 "이미 기도하셨습니다" 메시지 반환
2. **네트워크 에러**: 자동 롤백 및 에러 토스트 표시
3. **Optimistic Update**: 즉각적인 UI 반응 후 서버 응답으로 확정

## 테스트 시나리오

1. ✅ 기도하기 버튼 클릭 → 성공 메시지 표시
2. ✅ 기도 취소 버튼 클릭 → 취소 메시지 표시
3. ✅ 중복 기도 시도 → 에러 메시지 표시
4. ✅ 네트워크 에러 → 자동 롤백 및 에러 메시지
5. ✅ Optimistic Update → 즉각적인 UI 반응

## 향후 개선 사항

1. 기도 취소 확인 다이얼로그 추가
2. 기도 통계 실시간 업데이트
3. 기도 알림 기능 추가
4. 기도 히스토리 조회 기능
