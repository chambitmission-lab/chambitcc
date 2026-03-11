# 🔌 백엔드 API 연동 가이드

## ✅ 백엔드에서 구현된 API

백엔드에서 다음 API들이 확장되었습니다:

1. `GET /api/v1/profile/stats` - 확장된 통계 반환
2. `GET /api/v1/profile/detail` - 전체 프로필 정보에 새 통계 포함
3. `POST /api/v1/prayers/{prayer_id}/pray` - 기도 시간 파라미터 추가

## 📊 프론트엔드 연동 상태

### ✅ 완료된 작업

#### 1. 프로필 API 연동 준비
**파일**: `frontend/src/types/profile.ts`

```typescript
export interface ProfileStats {
  activity: {
    total_prayer_time?: number  // ✅ 선택적 필드로 추가됨
  }
  bible_reading?: {              // ✅ 선택적 필드로 추가됨
    chapters_read: number
    books_completed: string[]
  }
}
```

**동작 방식**:
- API에서 데이터가 있으면 사용
- 없으면 추정값 사용 (하위 호환성)

#### 2. 기도 시간 파라미터 추가
**파일**: `frontend/src/api/prayer/prayerActionApi.ts`

```typescript
export const addPrayer = async (
  prayerId: number,
  prayerDurationMinutes?: number  // ✅ 선택적 파라미터 추가
): Promise<{ success: boolean; message: string }>
```

**파일**: `frontend/src/hooks/usePrayerToggle.ts`

```typescript
const togglePrayer = async (
  prayerId: number, 
  isPrayed: boolean, 
  durationMinutes?: number  // ✅ 기도 시간 전달 가능
)
```

#### 3. 기도 시간 추적 훅
**파일**: `frontend/src/hooks/usePrayerTimer.ts`

```typescript
const { startTimer, stopTimer, elapsedMinutes, isRunning } = usePrayerTimer()

// 기도 시작
startTimer()

// 기도 완료 (경과 시간 반환)
const minutes = stopTimer()
togglePrayer(prayerId, false, minutes)
```

### 🔄 자동 연동 흐름

#### Profile 페이지
**파일**: `frontend/src/pages/Profile/Profile.tsx`

```typescript
const activityData = useMemo<UserActivityData | null>(() => {
  if (!data) return null
  
  return {
    // ✅ API 데이터 우선, 없으면 추정값
    totalPrayerTime: data.stats.activity.total_prayer_time 
      || data.stats.activity.total_count * 5,
    
    // ✅ API 데이터 우선, 없으면 0
    bibleChaptersRead: data.stats.bible_reading?.chapters_read || 0,
    bibleBooksCompleted: data.stats.bible_reading?.books_completed || [],
    
    // 기존 데이터
    totalPrayerCount: data.stats.activity.total_count,
    streakDays: data.stats.activity.streak_days,
    repliesCount: data.stats.content.my_replies,
    prayingForCount: data.stats.content.praying_for,
  }
}, [data])
```

## 🎯 백엔드 API 응답 예시

### 1. 프로필 통계 API

**요청**:
```
GET /api/v1/profile/stats
Authorization: Bearer <token>
```

**응답** (확장된 버전):
```json
{
  "user_id": 1,
  "username": "user123",
  "full_name": "홍길동",
  "activity": {
    "this_week_count": 5,
    "total_count": 30,
    "streak_days": 7,
    "total_prayer_time": 150  // ⭐ 새로 추가된 필드
  },
  "content": {
    "my_prayers": 10,
    "praying_for": 15,
    "my_replies": 25
  },
  "bible_reading": {  // ⭐ 새로 추가된 필드
    "chapters_read": 50,
    "books_completed": ["창세기", "출애굽기"]
  }
}
```

### 2. 기도하기 API

**요청** (기도 시간 포함):
```
POST /api/v1/prayers/123/pray
Authorization: Bearer <token>
Content-Type: application/json

{
  "prayer_duration_minutes": 5  // ⭐ 선택적 파라미터
}
```

**요청** (기도 시간 없음 - 기존 방식):
```
POST /api/v1/prayers/123/pray
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**응답**:
```json
{
  "success": true,
  "message": "기도했습니다"
}
```

## 🧪 테스트 방법

### 1. 프로필 API 테스트

#### 백엔드에서 데이터 제공 시
```bash
# API 호출
curl -X GET "http://localhost:8000/api/v1/profile/stats" \
  -H "Authorization: Bearer <token>"

# 프론트엔드에서 확인
# 1. 프로필 페이지 접속
# 2. 브라우저 개발자 도구 > Network 탭
# 3. profile/stats 또는 profile/detail 응답 확인
# 4. total_prayer_time, bible_reading 필드 확인
```

#### 백엔드에서 데이터 미제공 시
```typescript
// 프론트엔드는 자동으로 추정값 사용
totalPrayerTime: total_count * 5  // 기도 1회당 5분 추정
bibleChaptersRead: 0
bibleBooksCompleted: []
```

### 2. 기도 시간 추적 테스트

#### 방법 A: 수동으로 시간 전달
```typescript
// 기도 버튼 클릭 시 5분으로 고정
togglePrayer(prayerId, false, 5)
```

#### 방법 B: 타이머 사용 (향후 구현)
```typescript
const { startTimer, stopTimer } = usePrayerTimer()

// 기도 시작
startTimer()

// 기도 완료
const minutes = stopTimer()
togglePrayer(prayerId, false, minutes)
```

## 📝 백엔드 개발자를 위한 체크리스트

### Phase 1: 기본 연동 (즉시 가능)
- [ ] `ProfileStats` 스키마에 `total_prayer_time` 필드 추가
- [ ] `ProfileStats` 스키마에 `bible_reading` 필드 추가
- [ ] `/api/v1/profile/stats` 응답에 새 필드 포함
- [ ] `/api/v1/profile/detail` 응답에 새 필드 포함
- [ ] 기존 사용자는 `total_prayer_time = total_count * 5`로 초기화

### Phase 2: 기도 시간 추적
- [ ] `POST /api/v1/prayers/{id}/pray` 요청 바디에 `prayer_duration_minutes` 파라미터 추가
- [ ] 파라미터가 있으면 `user.total_prayer_time`에 누적
- [ ] 파라미터가 없으면 기본값 5분 사용 (하위 호환성)

### Phase 3: 성경 읽기 (향후)
- [ ] `bible_reading_progress` 테이블 생성
- [ ] `POST /api/v1/bible/reading/mark` API 구현
- [ ] `GET /api/v1/bible/reading/progress` API 구현
- [ ] 프로필 API에 성경 읽기 통계 포함

## 🔧 백엔드 구현 예시

### Python/FastAPI 예시

```python
# schemas/profile.py
from pydantic import BaseModel
from typing import Optional, List

class BibleReadingStats(BaseModel):
    chapters_read: int
    books_completed: List[str]

class ActivityStats(BaseModel):
    this_week_count: int
    total_count: int
    streak_days: int
    total_prayer_time: Optional[int] = None  # ⭐ 새 필드

class ProfileStats(BaseModel):
    user_id: int
    username: str
    full_name: str
    activity: ActivityStats
    content: ContentStats
    bible_reading: Optional[BibleReadingStats] = None  # ⭐ 새 필드

# endpoints/profile.py
@router.get("/stats", response_model=ProfileStats)
async def get_profile_stats(current_user: User = Depends(get_current_user)):
    # 기존 로직...
    
    # ⭐ 기도 시간 추가
    activity_stats = ActivityStats(
        this_week_count=this_week_count,
        total_count=total_count,
        streak_days=streak_days,
        total_prayer_time=current_user.total_prayer_time  # DB에서 가져오기
    )
    
    # ⭐ 성경 읽기 통계 추가
    bible_reading = None
    if hasattr(current_user, 'bible_reading_progress'):
        chapters_read = len(current_user.bible_reading_progress)
        books_completed = calculate_completed_books(current_user.id)
        bible_reading = BibleReadingStats(
            chapters_read=chapters_read,
            books_completed=books_completed
        )
    
    return ProfileStats(
        user_id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        activity=activity_stats,
        content=content_stats,
        bible_reading=bible_reading
    )

# endpoints/prayer.py
@router.post("/prayers/{prayer_id}/pray")
async def add_prayer(
    prayer_id: int,
    prayer_duration_minutes: Optional[int] = None,  # ⭐ 새 파라미터
    current_user: User = Depends(get_current_user)
):
    # 기존 기도 추가 로직...
    
    # ⭐ 기도 시간 누적
    duration = prayer_duration_minutes or 5  # 기본값 5분
    current_user.total_prayer_time += duration
    db.commit()
    
    return {"success": True, "message": "기도했습니다"}
```

## 🎉 완료 후 확인사항

### 프론트엔드에서 확인
1. 프로필 페이지 접속
2. "신앙의 온도" 섹션에서 포인트 확인
3. 프로필 아바타 글로우 색상 확인
4. 업적 뱃지 해금 여부 확인

### 백엔드에서 확인
1. API 응답에 새 필드 포함 확인
2. 기도 시 `total_prayer_time` 증가 확인
3. 데이터베이스에 값 저장 확인

## 🐛 문제 해결

### 프로필 글로우가 변하지 않음
- 백엔드 API 응답 확인
- `total_prayer_time` 필드 존재 여부 확인
- 브라우저 캐시 삭제 후 재시도

### 기도 시간이 누적되지 않음
- API 요청 바디에 `prayer_duration_minutes` 포함 확인
- 백엔드 로그 확인
- 데이터베이스 `total_prayer_time` 컬럼 확인

### 성경 읽기 데이터가 표시되지 않음
- 백엔드에서 `bible_reading` 필드 제공 확인
- 프론트엔드는 없으면 0으로 표시 (정상)

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 > Network 탭에서 API 응답 확인
2. 백엔드 로그 확인
3. 프론트엔드 콘솔 에러 확인

## 🎯 다음 단계

1. ✅ 백엔드 API 확장 완료
2. ✅ 프론트엔드 연동 준비 완료
3. ⏳ 백엔드 배포 및 테스트
4. ⏳ 프로덕션 환경 확인
5. ⏳ 사용자 피드백 수집
