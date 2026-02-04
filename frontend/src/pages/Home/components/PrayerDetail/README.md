# PrayerDetail 컴포넌트

기도 요청 상세 페이지를 SOLID 원칙에 따라 분리한 컴포넌트입니다.

## 구조

```
PrayerDetail/
├── index.tsx                    # 메인 컨테이너 (데이터 페칭, 상태 관리)
├── PrayerDetailModal.tsx        # 모달 래퍼
├── PrayerDetailHeader.tsx       # 헤더 (닫기, 삭제 버튼)
├── PrayerAuthorInfo.tsx         # 작성자 정보
├── PrayerContent.tsx            # 기도 내용 (번역 포함)
├── PrayerActions.tsx            # 기도하기, 댓글 버튼
├── PrayerStats.tsx              # 통계 정보
├── OwnerBadge.tsx               # 작성자 배지
├── RepliesSection.tsx           # 댓글 섹션
├── LoadingState.tsx             # 로딩 상태
├── ErrorState.tsx               # 에러 상태
├── DeleteConfirmModal.tsx       # 삭제 확인 모달
├── useTranslation.ts            # 번역 로직 훅
├── usePrayerDelete.ts           # 삭제 로직 훅
└── README.md                    # 이 파일
```

## SOLID 원칙 적용

### 1. Single Responsibility Principle (단일 책임 원칙)
- 각 컴포넌트는 하나의 명확한 책임만 가집니다
- `PrayerAuthorInfo`: 작성자 정보만 표시
- `PrayerActions`: 액션 버튼만 관리
- `useTranslation`: 번역 로직만 처리

### 2. Open/Closed Principle (개방/폐쇄 원칙)
- 컴포넌트는 확장에는 열려있고 수정에는 닫혀있습니다
- Props를 통해 동작을 커스터마이징 가능

### 3. Liskov Substitution Principle (리스코프 치환 원칙)
- 각 컴포넌트는 독립적으로 교체 가능합니다

### 4. Interface Segregation Principle (인터페이스 분리 원칙)
- 각 컴포넌트는 필요한 props만 받습니다
- 불필요한 의존성이 없습니다

### 5. Dependency Inversion Principle (의존성 역전 원칙)
- 컴포넌트는 구체적인 구현이 아닌 추상화(Props)에 의존합니다
- 커스텀 훅을 통해 비즈니스 로직을 분리

## 사용 예시

```tsx
import PrayerDetail from './components/PrayerDetail'

<PrayerDetail
  prayerId={123}
  initialData={prayerData}
  onClose={() => setShowDetail(false)}
  onDelete={() => refetchPrayers()}
/>
```

## 장점

1. **테스트 용이성**: 각 컴포넌트를 독립적으로 테스트 가능
2. **재사용성**: 개별 컴포넌트를 다른 곳에서도 사용 가능
3. **유지보수성**: 특정 기능 수정 시 해당 파일만 수정
4. **가독성**: 각 파일이 명확한 목적을 가짐
5. **협업**: 여러 개발자가 동시에 다른 부분 작업 가능
