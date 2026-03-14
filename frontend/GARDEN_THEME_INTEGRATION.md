# 정원 테마 커스터마이징 백엔드 통합 완료

## 📋 개요
정원 화면의 배경 요소(달/태양 이미지)를 사용자가 커스터마이징할 수 있는 기능이 백엔드 API와 완전히 통합되었습니다.

## ✅ 구현 완료 사항

### 1. API 레이어 구현
**파일**: `frontend/src/api/garden.ts`

- `getGardenTheme()`: 사용자의 정원 테마 설정 조회
- `saveGardenTheme()`: 정원 테마 설정 저장 (프리셋 또는 커스텀)
- `uploadGardenImage()`: 커스텀 이미지 업로드 (달/태양)

**타입 정의**:
```typescript
export type ThemeType = 'preset' | 'custom'
export type PresetName = 'classic' | 'fantasy' | 'space' | 'watercolor'
export type ImageType = 'moon' | 'sun'

export interface GardenTheme {
  theme_type: ThemeType
  preset_name: PresetName | null
  moon_image_url: string | null
  sun_image_url: string | null
}
```

### 2. 정원 꾸미기 모달 업데이트
**파일**: `frontend/src/components/garden/GardenCustomizeModal.tsx`

**주요 기능**:
- 페이지 로드 시 현재 테마 설정 자동 불러오기
- 4가지 프리셋 테마 선택 (클래식, 판타지, 우주, 수채화)
- 커스텀 이미지 업로드 (달/태양 각각)
- 이미지 미리보기 기능
- 파일 크기 검증 (최대 5MB)
- 저장 중 로딩 상태 표시
- 에러 처리 및 사용자 피드백

**새로운 Props**:
```typescript
interface GardenCustomizeModalProps {
  onClose: () => void
  onSave?: () => void  // 저장 성공 시 콜백
}
```

### 3. 정원 나무 컴포넌트 업데이트
**파일**: `frontend/src/components/garden/GrowingTree.tsx`

**주요 변경사항**:
- 컴포넌트 마운트 시 테마 설정 자동 로드
- 커스텀 이미지가 있을 경우 동적으로 배경 이미지 적용
- 프리셋 테마는 기존 CSS 스타일 사용
- 테마 로드 실패 시 기본 테마(classic) 사용

**적용 방식**:
```tsx
<div 
  className="sun"
  style={
    gardenTheme?.theme_type === 'custom' && gardenTheme.sun_image_url
      ? { 
          backgroundImage: `url(${gardenTheme.sun_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      : undefined
  }
></div>
```

### 4. 정원 페이지 업데이트
**파일**: `frontend/src/pages/Garden/Garden.tsx`

**주요 변경사항**:
- 테마 저장 후 자동 새로고침 기능 추가
- `key` prop을 사용한 컴포넌트 강제 재렌더링
- 모달에 `onSave` 콜백 전달

```tsx
const [themeKey, setThemeKey] = useState(0)

const handleThemeSave = () => {
  setThemeKey(prev => prev + 1)
}

<GrowingTree key={themeKey} versesRead={flowers.length} showInfo />
```

## 🔄 사용자 플로우

### 프리셋 테마 선택
1. 사용자가 "정원 꾸미기" 버튼 클릭
2. 모달에서 현재 테마 설정 자동 로드
3. 4가지 프리셋 중 하나 선택
4. "저장" 버튼 클릭
5. 백엔드 API 호출: `POST /api/v1/garden/theme`
6. 저장 성공 후 정원 화면 자동 새로고침
7. 선택한 테마 즉시 반영

### 커스텀 이미지 업로드
1. 사용자가 "정원 꾸미기" 버튼 클릭
2. 모달에서 현재 테마 설정 자동 로드
3. "달 이미지 선택" 또는 "태양 이미지 선택" 클릭
4. 이미지 파일 선택 (최대 5MB)
5. 미리보기 자동 표시
6. "저장" 버튼 클릭
7. 이미지 업로드: `POST /api/v1/garden/upload-image`
8. 테마 설정 저장: `POST /api/v1/garden/theme`
9. 저장 성공 후 정원 화면 자동 새로고침
10. 업로드한 이미지 즉시 반영

## 🎨 프리셋 테마 목록

| 테마 | 설명 | 달 | 태양 |
|------|------|-----|------|
| 클래식 | 기본 달과 태양 | 🌕 | ☀️ |
| 판타지 | 환상적인 분위기 | 🌙 | 🌟 |
| 우주 | 신비로운 우주 | 🪐 | ⭐ |
| 수채화 | 부드러운 느낌 | 🎨 | 🖌️ |

## 🔒 보안 및 검증

### 클라이언트 측 검증
- 파일 크기: 최대 5MB
- 파일 형식: `image/*` (브라우저 기본 검증)
- 에러 메시지 표시

### 백엔드 API 요구사항
- JWT 인증 필수
- 파일 MIME 타입 검증
- 이미지 최적화 및 리사이징
- CDN 업로드 및 URL 반환

## 📡 API 엔드포인트

### 1. 테마 조회
```
GET /api/v1/garden/theme
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "theme_type": "preset",
    "preset_name": "classic",
    "moon_image_url": null,
    "sun_image_url": null
  }
}
```

### 2. 테마 저장
```
POST /api/v1/garden/theme
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "theme_type": "custom",
  "preset_name": null,
  "moon_image_url": "https://cdn.example.com/moon.png",
  "sun_image_url": "https://cdn.example.com/sun.png"
}

Response:
{
  "success": true,
  "data": { ... }
}
```

### 3. 이미지 업로드
```
POST /api/v1/garden/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- image: File
- image_type: "moon" | "sun"

Response:
{
  "success": true,
  "data": {
    "image_url": "https://cdn.example.com/user-uploads/moon-123.png",
    "image_type": "moon",
    "file_size": 245678,
    "uploaded_at": "2026-03-14T10:00:00Z"
  }
}
```

## 🧪 테스트 시나리오

### 시나리오 1: 프리셋 테마 변경
1. 정원 페이지 접속
2. "정원 꾸미기" 클릭
3. "판타지" 테마 선택
4. "저장" 클릭
5. 확인: 달이 🌙, 태양이 🌟으로 변경됨

### 시나리오 2: 커스텀 이미지 업로드
1. 정원 페이지 접속
2. "정원 꾸미기" 클릭
3. "달 이미지 선택" 클릭하여 이미지 업로드
4. 미리보기 확인
5. "저장" 클릭
6. 확인: 업로드한 이미지가 달로 표시됨

### 시나리오 3: 에러 처리
1. 5MB 이상 파일 업로드 시도
2. 확인: "이미지 크기는 5MB 이하여야 합니다" 에러 메시지 표시
3. 네트워크 오류 시뮬레이션
4. 확인: 적절한 에러 메시지 표시

## 🎯 향후 개선 가능 사항

1. **이미지 편집 기능**
   - 크롭, 회전, 필터 적용
   - 밝기/대비 조정

2. **더 많은 프리셋**
   - 계절별 테마 (봄, 여름, 가을, 겨울)
   - 명절 테마 (크리스마스, 부활절 등)

3. **애니메이션 효과**
   - 테마 변경 시 부드러운 전환 효과
   - 커스텀 이미지 회전/반짝임 효과

4. **공유 기능**
   - 다른 사용자의 테마 구경하기
   - 인기 테마 랭킹

5. **프리미엄 테마**
   - 유료 프리미엄 테마 제공
   - 특별한 애니메이션 효과

## 📝 참고사항

- 커스텀 이미지는 사용자별로 저장됨
- 프리셋 테마는 CSS로 구현되어 있어 빠른 로딩
- 이미지 URL은 CDN을 통해 제공되어 성능 최적화
- 테마 설정은 사용자 계정에 저장되어 기기 간 동기화

## 🐛 알려진 이슈

현재 알려진 이슈 없음

## 📞 문의

테마 기능 관련 문의사항이나 버그 리포트는 개발팀에 전달해주세요.
