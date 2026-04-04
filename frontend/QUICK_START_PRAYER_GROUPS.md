# 🚀 소그룹 기도 기능 - 빠른 시작 가이드

## ✅ 체크리스트

### 1. 파일 확인
모든 파일이 생성되었는지 확인하세요:

```bash
# 타입
✅ frontend/src/types/prayer.ts (수정됨)

# API
✅ frontend/src/api/group.ts

# Hooks
✅ frontend/src/hooks/useGroups.ts

# 컴포넌트
✅ frontend/src/components/prayer/GroupFilter.tsx
✅ frontend/src/components/prayer/GroupFilter.css
✅ frontend/src/components/prayer/GroupModals.tsx
✅ frontend/src/components/prayer/GroupModals.css
✅ frontend/src/components/prayer/PrayerComposer.tsx
✅ frontend/src/components/prayer/PrayerComposer.css
✅ frontend/src/components/prayer/PrayerCard.tsx
✅ frontend/src/components/prayer/PrayerCard.css
✅ frontend/src/components/prayer/index.ts

# 페이지
✅ frontend/src/pages/Prayer/PrayerList.tsx
✅ frontend/src/pages/Prayer/PrayerList.css

# 다국어
✅ frontend/src/locales/ko/prayer.ts (수정됨)
✅ frontend/src/locales/en/prayer.ts (수정됨)
```

### 2. 타입 체크
```bash
cd frontend
npx tsc --noEmit
```

### 3. 라우팅 추가

**App.tsx** 또는 라우터 파일에 추가:

```typescript
import PrayerList from './pages/Prayer/PrayerList'

// 라우트 추가
<Route path="/prayers" element={<PrayerList />} />
```

### 4. 네비게이션 추가

```typescript
<Link to="/prayers">
  <span>🙏</span>
  <span>기도 나눔</span>
</Link>
```

### 5. 개발 서버 실행

```bash
cd frontend
npm run dev
```

### 6. 테스트

브라우저에서 `http://localhost:5173/prayers` 접속

#### 테스트 시나리오:

1. **그룹 필터 테스트**
   - "전체 공개" 버튼 클릭
   - "내 그룹" 드롭다운 클릭
   - Mock 그룹 목록 확인 (청년부, 찬양팀, 셀 모임 A)

2. **그룹 생성 테스트**
   - "그룹 만들기" 버튼 클릭
   - 그룹 이름 입력 (예: "테스트 그룹")
   - 아이콘 선택
   - 생성 후 초대 코드 확인
   - 초대 코드 복사 버튼 테스트

3. **그룹 가입 테스트**
   - "그룹 가입하기" 버튼 클릭
   - 초대 코드 입력: `PRAISE2024`
   - 가입 성공 메시지 확인

4. **기도 작성 테스트**
   - "+ 기도 요청하기" 버튼 클릭
   - 공개 범위 선택 (전체 공개 / 특정 그룹)
   - 제목, 내용 입력
   - 제출

5. **정렬 테스트**
   - "인기순" / "최신순" 버튼 클릭
   - 목록 변경 확인

## 🔧 문제 해결

### 타입 에러 발생 시

```bash
# 타입 체크
cd frontend
npx tsc --noEmit

# 특정 파일 체크
npx tsc --noEmit src/pages/Prayer/PrayerList.tsx
```

### Import 에러 발생 시

컴포넌트를 개별 import 대신 index에서 import:

```typescript
// ❌ 개별 import
import GroupFilter from '../../components/prayer/GroupFilter'
import { CreateGroupModal } from '../../components/prayer/GroupModals'

// ✅ index에서 import
import { 
  GroupFilter, 
  CreateGroupModal, 
  JoinGroupModal 
} from '../../components/prayer'
```

### 스타일이 적용 안 될 때

CSS 파일이 import 되었는지 확인:

```typescript
// 각 컴포넌트 파일 상단
import './GroupFilter.css'
import './GroupModals.css'
import './PrayerComposer.css'
import './PrayerCard.css'
```

### Toast 메시지가 안 보일 때

`showToast` 함수가 제대로 구현되어 있는지 확인:

```typescript
// frontend/src/utils/toast.ts
export const showToast = (message: string, type: 'success' | 'error') => {
  // 구현 확인
}
```

## 📦 빌드

프로덕션 빌드:

```bash
cd frontend
npm run build
```

빌드 결과 확인:

```bash
# dist 폴더 생성 확인
ls dist/

# 빌드 미리보기
npm run preview
```

## 🎯 다음 단계

### 백엔드 연동 준비

1. **API 엔드포인트 확인**
   - 백엔드팀에 API 문서 요청
   - Swagger/OpenAPI 스펙 확인

2. **API 함수 교체**
   - `frontend/src/api/group.ts` 열기
   - `// TODO: 백엔드 API 연결` 주석 찾기
   - Mock 코드를 실제 API 호출로 교체

3. **환경 변수 설정**
   ```bash
   # .env.development
   VITE_API_BASE_URL=http://localhost:8000
   
   # .env.production
   VITE_API_BASE_URL=https://api.yourchurch.com
   ```

4. **테스트**
   - 개발 환경에서 실제 API 호출 테스트
   - 에러 처리 확인
   - 로딩 상태 확인

## 📚 참고 문서

- **README.md** - 전체 개요 및 구조
- **INTEGRATION_GUIDE.md** - 상세 통합 가이드
- **PRAYER_GROUPS_SUMMARY.md** - 구현 요약

## 💡 팁

### Mock 데이터 수정

테스트용 Mock 데이터를 수정하려면:

```typescript
// frontend/src/api/group.ts
const mockGroups: PrayerGroup[] = [
  {
    id: 1,
    name: '내 그룹',  // 여기 수정
    description: '설명',
    icon: '🙏',
    // ...
  },
]
```

### 스타일 커스터마이징

색상 변경:

```css
/* GroupFilter.css */
.group-filter-btn.active {
  background: #your-color;  /* 원하는 색상 */
}
```

### 다국어 추가

베트남어 등 다른 언어 추가:

```typescript
// frontend/src/locales/vi/prayer.ts
export const prayer = {
  prayerGroups: 'Nhóm Cầu Nguyện',
  createGroup: 'Tạo Nhóm',
  // ...
}
```

## ✨ 완료!

모든 설정이 완료되었습니다. 이제 `/prayers` 경로에서 소그룹 기도 기능을 사용할 수 있습니다!

문제가 발생하면 브라우저 개발자 도구 콘솔을 확인하세요.

Happy coding! 🙏
