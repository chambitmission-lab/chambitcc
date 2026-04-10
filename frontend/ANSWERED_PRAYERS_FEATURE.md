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
// PrayerList.tsx 또는 AnsweredPrayers.tsx에서
const {
  answerPrayer,
  updatePrayerAnswer,
  cancelPrayerAnswer,
  isAnswering,
} = usePrayersInfinite(sort, groupId, filter, /* isAnswered */ undefined)

// 신규 등록
await answerPrayer(prayer.id, testimony)
// 수정
await updatePrayerAnswer(prayer.id, testimony)
// 취소
await cancelPrayerAnswer(prayer.id)
```

`PrayerList.tsx:handleAnswerSubmit`이 `prayer.is_answered` 여부에 따라
`POST` / `PUT`을 자동으로 분기합니다.

### 2. 응답의 전당 접근
- 홈 화면의 황금빛 배너 클릭
- 상단 메뉴에서 '✨ 응답의 전당' 클릭
- 직접 URL 접근: `/answered-prayers`

응답의 전당 페이지는 `usePrayersInfinite(sort, null, 'all', true)`를 호출해
`GET /api/v1/prayers?is_answered=true`로 백엔드에서 직접 필터링된 목록을 받습니다.

## ✅ 백엔드 연동 (구현 완료)

### API 엔드포인트

#### 1. 응답 등록
```
POST /api/v1/prayers/{prayer_id}/answer
Authorization: Bearer {token}

Request Body:
{
  "testimony": "간증 내용 (1~2000자)"
}

Response 201:
{
  "success": true,
  "message": "응답이 등록되었습니다",
  "data": {
    "id": 123,
    "is_answered": true,
    "testimony": "간증 내용",
    "answered_at": "2026-04-10T01:30:00Z",
    ...
  }
}
```

등록 성공 후 백그라운드에서 `_notify_reactors_of_answer`가 실행되어,
해당 기도에 reaction(🙏 기도하기)을 남긴 사용자들에게 푸시 알림이 발송됩니다.

#### 2. 응답 간증 수정
```
PUT /api/v1/prayers/{prayer_id}/answer
Authorization: Bearer {token}

Request Body:
{
  "testimony": "수정한 간증 내용"
}
```

`answered_at`은 최초 등록 시점이 유지됩니다.

#### 3. 응답된 기도 목록 조회
```
GET /api/v1/prayers?is_answered=true&sort=latest&page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "items": [Prayer[]],
    "page": 1,
    "limit": 20,
    "total": 20
  }
}
```

`is_answered=true`이고 `sort=latest`인 경우 백엔드는 `ORDER BY answered_at DESC`로
정렬해 응답 시각 순으로 노출됩니다.

#### 4. 응답 등록 취소
```
DELETE /api/v1/prayers/{prayer_id}/answer

Response:
{
  "success": true,
  "message": "응답이 취소되었습니다",
  "data": { ...is_answered=false 로 갱신된 prayer }
}
```

`is_answered=false`, `testimony=NULL`, `answered_at=NULL`로 초기화되며
기도 자체는 그대로 유지됩니다.

### 데이터베이스 스키마 (마이그레이션 적용됨)

```sql
ALTER TABLE prayers ADD COLUMN is_answered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE prayers ADD COLUMN testimony TEXT;
ALTER TABLE prayers ADD COLUMN answered_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX ix_prayers_is_answered ON prayers (is_answered);
```

마이그레이션 파일: `backend/alembic/versions/add_answered_fields_to_prayers.py`
(revision: `add_answered_prayers`, down_revision: `add_user_id_idx_prayer`)

### 권한 체크 (백엔드에서 강제)
- **응답 등록/수정/취소**: 기도 작성자만 (`prayer.user_id == current_user.id`)
- **응답 조회**: 모든 사용자
- 작성자가 아닌 사용자가 호출하면 `403 Forbidden` 반환
- 이미 응답된 기도에 다시 등록하면 `409 Conflict` 반환 → 프론트는 자동으로 PUT으로 분기

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

### 백엔드 연동 (완료)
- [x] 응답 등록 API 연동 (`POST /api/v1/prayers/{id}/answer`)
- [x] 응답 간증 수정 API 연동 (`PUT /api/v1/prayers/{id}/answer`)
- [x] 응답 취소 API 연동 (`DELETE /api/v1/prayers/{id}/answer`)
- [x] 응답된 기도 목록 API 연동 (`GET /api/v1/prayers?is_answered=true`)
- [x] 실시간 업데이트 (React Query — answer/cancel mutation의 onSuccess에서 `prayerKeys.lists()` invalidate)
- [x] 푸시 알림 (응답 등록 시 reactor들에게 백그라운드 발송)

## 🎉 기대 효과

1. **시각적 임팩트**: 황금빛 카드로 응답된 기도가 특별하게 보입니다
2. **공동체 격려**: 응답 간증을 통해 서로 힘을 얻습니다
3. **신앙 성장**: 하나님의 응답을 기록하고 나눕니다
4. **참여 유도**: 응답의 전당을 채우고 싶은 동기 부여

## 📞 문의

백엔드 API 연동이나 추가 기능이 필요하시면 말씀해주세요!
