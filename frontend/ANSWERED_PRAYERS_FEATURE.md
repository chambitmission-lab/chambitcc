# ✨ 응답의 전당 (Answered Prayers Hall) 기능

## 📋 개요

'응답의 전당'은 기도 요청이 응답되었을 때 간증을 나누고, 응답된 기도들을 아름다운 황금빛 카드로 시각화하여 보여주는 기능입니다.

## 🎯 주요 기능

### 1. 응답 등록
- 내가 작성한 기도에 '응답' 버튼이 표시됩니다
- 응답 버튼을 누르면 간증 작성 모달이 열립니다
- 간증 내용을 작성하고 등록하면 기도가 '응답됨' 상태로 변경됩니다

### 2. 황금빛 카드 변환
- 응답된 기도는 일반 카드에서 황금빛으로 빛나는 특별한 카드로 변합니다
- 반짝이는 애니메이션 효과가 적용됩니다
- '✨ 응답됨' 배지가 표시됩니다

### 3. 응답의 전당 페이지
- 응답된 기도만 모아서 볼 수 있는 전용 페이지
- 황금빛 배경과 특별한 디자인
- 인기순/최신순 정렬 가능

### 4. 간증 표시
- 응답된 기도 카드에 간증 내용이 표시됩니다
- 간증 섹션은 별도의 스타일로 강조됩니다

## 📁 구현된 파일

### 컴포넌트
- `frontend/src/components/prayer/PrayerCard.tsx` - 응답 버튼 및 황금빛 스타일 추가
- `frontend/src/components/prayer/PrayerCard.css` - 황금빛 카드 스타일
- `frontend/src/components/prayer/AnswerModal.tsx` - 간증 작성 모달
- `frontend/src/components/prayer/AnswerModal.css` - 모달 스타일

### 페이지
- `frontend/src/pages/Prayer/AnsweredPrayers.tsx` - 응답의 전당 페이지
- `frontend/src/pages/Prayer/AnsweredPrayers.css` - 페이지 스타일
- `frontend/src/pages/Prayer/PrayerList.tsx` - 응답 기능 통합

### 홈 화면
- `frontend/src/pages/Home/components/AnsweredPrayersBanner.tsx` - 홈 배너
- `frontend/src/pages/Home/components/AnsweredPrayersBanner.css` - 배너 스타일
- `frontend/src/pages/Home/NewHome.tsx` - 배너 추가

### 타입 및 유틸
- `frontend/src/types/prayer.ts` - Prayer 타입에 응답 관련 필드 추가
- `frontend/src/utils/mockAnsweredPrayers.ts` - 테스트용 Mock 데이터

### 라우팅 및 네비게이션
- `frontend/src/App.tsx` - `/answered-prayers` 라우트 추가
- `frontend/src/components/layout/NewHeader/components/NavigationMenu.tsx` - 메뉴 추가

## 🎨 디자인 특징

### 황금빛 카드
- 그라데이션 배경: `#ffd700` → `#ffed4e` → `#ffd700`
- 반짝이는 애니메이션 (shimmer effect)
- 황금빛 그림자 효과
- 호버 시 더욱 강조되는 효과

### 응답의 전당 페이지
- 황금빛 배경 그라데이션
- 떠다니는 이모지 장식 (✨, 🎉)
- 반투명 카드 스타일 (backdrop-blur)
- 부드러운 애니메이션

### 간증 섹션
- 흰색 배경에 황금빛 좌측 테두리
- 🎉 아이콘과 '간증' 라벨
- 읽기 쉬운 레이아웃

## 🔧 사용 방법

### 1. 응답 등록하기
```typescript
// PrayerList.tsx에서
const handleAnswerToggle = (prayerId: number) => {
  const prayer = prayers.find(p => p.id === prayerId)
  if (prayer) {
    setSelectedPrayer(prayer)
    setShowAnswerModal(true)
  }
}

const handleAnswerSubmit = (testimony: string) => {
  // TODO: 백엔드 API 호출
  // POST /api/prayers/{prayerId}/answer
  // Body: { testimony: string }
}
```

### 2. 응답의 전당 접근
- 홈 화면의 황금빛 배너 클릭
- 상단 메뉴에서 '✨ 응답의 전당' 클릭
- 직접 URL 접근: `/answered-prayers`

### 3. 테스트용 Mock 데이터
```typescript
import { mockAnsweredPrayers } from '../utils/mockAnsweredPrayers'

// 테스트 시 사용
const testPrayers = [...mockAnsweredPrayers, ...realPrayers]
```

## 🚀 백엔드 연동 필요 사항

### API 엔드포인트

#### 1. 응답 등록
```
POST /api/prayers/{prayer_id}/answer
Authorization: Bearer {token}

Request Body:
{
  "testimony": "간증 내용 (최대 500자)"
}

Response:
{
  "success": true,
  "message": "응답이 등록되었습니다",
  "data": {
    "id": 123,
    "is_answered": true,
    "testimony": "간증 내용",
    "answered_at": "2024-03-12T10:30:00Z"
  }
}
```

#### 2. 응답된 기도 목록 조회
```
GET /api/prayers?is_answered=true&sort=latest&page=1&limit=20
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "items": [Prayer[]],
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

#### 3. 응답 취소 (선택사항)
```
DELETE /api/prayers/{prayer_id}/answer
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "응답이 취소되었습니다"
}
```

### 데이터베이스 스키마 추가

```sql
-- prayers 테이블에 컬럼 추가
ALTER TABLE prayers ADD COLUMN is_answered BOOLEAN DEFAULT FALSE;
ALTER TABLE prayers ADD COLUMN testimony TEXT;
ALTER TABLE prayers ADD COLUMN answered_at TIMESTAMP;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_prayers_is_answered ON prayers(is_answered);
CREATE INDEX idx_prayers_answered_at ON prayers(answered_at DESC);
```

### 권한 체크
- 응답 등록: 기도 작성자만 가능 (`is_owner = true`)
- 응답 조회: 모든 사용자 가능
- 응답 수정/삭제: 기도 작성자만 가능

## 📱 반응형 디자인

- 모바일 최적화 (max-width: 640px)
- 터치 친화적인 버튼 크기
- 부드러운 스크롤 애니메이션
- 다크모드 지원 준비

## ✅ 체크리스트

### 완료된 항목
- [x] Prayer 타입에 응답 관련 필드 추가
- [x] PrayerCard에 응답 버튼 추가
- [x] 황금빛 카드 스타일 구현
- [x] 간증 작성 모달 구현
- [x] 응답의 전당 페이지 구현
- [x] 홈 화면 배너 추가
- [x] 네비게이션 메뉴 추가
- [x] 라우팅 설정
- [x] Mock 데이터 생성

### 백엔드 연동 필요
- [ ] 응답 등록 API 연동
- [ ] 응답된 기도 목록 API 연동
- [ ] 응답 취소 API 연동 (선택)
- [ ] 실시간 업데이트 (React Query 무효화)

## 🎉 기대 효과

1. **시각적 임팩트**: 황금빛 카드로 응답된 기도가 특별하게 보입니다
2. **공동체 격려**: 응답 간증을 통해 서로 힘을 얻습니다
3. **신앙 성장**: 하나님의 응답을 기록하고 나눕니다
4. **참여 유도**: 응답의 전당을 채우고 싶은 동기 부여

## 📞 문의

백엔드 API 연동이나 추가 기능이 필요하시면 말씀해주세요!
