# 설교 트랜스크립트 성경 구절 추출 기능

백엔드에서 구현된 설교 트랜스크립트 분석 및 성경 구절 자동 추출 기능을 프론트엔드에 완전히 통합했습니다.

## 🎯 주요 기능

### 1. 관리자 기능
- 설교 등록 후 트랜스크립트 JSON 파일 업로드
- 자동으로 성경 구절 추출 및 저장
- 추출된 구절 개수 실시간 확인

### 2. 사용자 기능
- 설교 상세보기에서 언급된 성경 구절 확인
- 성경 구절 클릭 시 성경 상세보기로 이동
- 타임스탬프 클릭 시 비디오 해당 시간으로 이동

## 📁 구현된 파일

### 타입 정의
- `frontend/src/types/sermon.ts` - BibleReference, TranscriptAnalysisResponse 타입 추가

### API
- `frontend/src/api/sermon.ts` - analyzeTranscript, getSermonBibleReferences API 함수 추가

### 훅
- `frontend/src/hooks/useSermonBibleReferences.ts` - 설교별 성경 구절 목록 조회 훅

### 컴포넌트
- `frontend/src/pages/Sermon/components/SermonForm/TranscriptUploadSection.tsx` - 트랜스크립트 업로드 UI
- `frontend/src/pages/Sermon/components/SermonForm/useTranscriptUpload.ts` - 트랜스크립트 업로드 로직
- `frontend/src/pages/Sermon/components/BibleReferencesSection.tsx` - 성경 구절 표시 컴포넌트
- `frontend/src/pages/Sermon/components/BibleReferencesSection.css` - 스타일
- `frontend/src/pages/Sermon/components/SermonBibleReferencesManager.tsx` - 성경 구절 관리 모달 (관리자용)
- `frontend/src/pages/Sermon/components/SermonBibleReferencesManager.css` - 관리 모달 스타일

### 통합
- `frontend/src/pages/Sermon/components/SermonForm/index.tsx` - 폼에 트랜스크립트 업로드 섹션 추가
- `frontend/src/pages/Sermon/components/SermonForm/useSermonForm.ts` - 트랜스크립트 업로드 훅 통합
- `frontend/src/pages/Sermon/components/SermonDetail.tsx` - 성경 구절 섹션 및 타임스탬프 기능 추가

## 🚀 사용 방법

### 관리자 플로우

1. **설교 등록**
   - 설교 목록 페이지에서 "설교 등록" 버튼 클릭
   - 제목, 목사님, 성경 구절, 날짜, 내용 입력
   - 비디오 URL 입력 (YouTube URL)
   - "등록하기" 버튼 클릭

2. **트랜스크립트 업로드**
   - 설교 등록 후 자동으로 "트랜스크립트 업로드" 섹션이 나타남
   - "JSON 파일 선택" 버튼 클릭
   - 트랜스크립트 JSON 파일 선택
   - 자동으로 성경 구절 추출 및 저장
   - 추출된 구절 개수 확인

3. **기존 설교 수정 시**
   - 설교 상세보기에서 "수정" 버튼 클릭
   - 수정 폼에서 트랜스크립트 업로드 가능

4. **성경 구절 관리 (선택사항)**
   - SermonBibleReferencesManager 컴포넌트를 사용하여 성경 구절 검색 및 관리
   - 추출된 모든 성경 구절을 한눈에 확인
   - 검색 기능으로 특정 구절 빠르게 찾기

### 일반 사용자 플로우

1. **설교 목록에서 설교 선택**
   - 설교 카드 클릭

2. **설교 상세보기**
   - 음성 플레이어 또는 비디오 플레이어로 설교 청취/시청
   - 아래로 스크롤하여 "언급된 성경 구절" 섹션 확인

3. **성경 구절 탐색**
   - 각 성경 구절 카드에서:
     - 성경 책, 장, 절 확인
     - 설교 중 언급된 문맥 확인
     - 성경 본문 미리보기
   - 타임스탬프 버튼 클릭:
     - 🔊 보라색 버튼 (음성 아이콘): 음성 플레이어의 해당 시간으로 이동 및 자동 재생
     - ▶️ 빨간색 버튼 (재생 아이콘): 비디오 플레이어의 해당 시간으로 이동
   - 카드 클릭 → 성경 상세보기 페이지로 이동

### 개발자 사용 예시

#### 설교별 성경 구절 조회 훅 사용
```typescript
import { useSermonBibleReferences } from '../hooks/useSermonBibleReferences'

function MyComponent({ sermonId }: { sermonId: number }) {
  const { data: references, isLoading, error } = useSermonBibleReferences(sermonId)
  
  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>오류 발생</div>
  
  return (
    <div>
      {references?.map(ref => (
        <div key={ref.id}>
          {ref.book_name} {ref.chapter}:{ref.verse}
        </div>
      ))}
    </div>
  )
}
```

#### 성경 구절 관리 모달 사용
```typescript
import { SermonBibleReferencesManager } from './components/SermonBibleReferencesManager'

function AdminPanel() {
  const [showManager, setShowManager] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowManager(true)}>
        성경 구절 관리
      </button>
      
      {showManager && (
        <SermonBibleReferencesManager
          sermonId={123}
          sermonTitle="하나님의 등불은 아직 꺼지지 않았습니다"
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  )
}
```

## 📋 트랜스크립트 JSON 형식

백엔드가 기대하는 트랜스크립트 JSON 형식:

```json
{
  "segments": [
    {
      "start": 168.5,
      "end": 172.3,
      "text": "오늘 말씀에 사무엘상 3장 3절 상반절에"
    },
    {
      "start": 172.3,
      "end": 176.8,
      "text": "하나님의 등불은 아직 꺼지지 않았습니다"
    }
  ]
}
```

## 🎨 UI/UX 특징

### 트랜스크립트 업로드 섹션
- 글래스모피즘 디자인
- 업로드 진행 상태 표시
- 성공 시 추출된 구절 개수 표시
- 설교 등록 전에는 비활성화

### 성경 구절 섹션
- 그라데이션 배경으로 시각적 구분
- 각 구절을 카드 형태로 표시
- 호버 시 애니메이션 효과
- 타임스탬프 버튼:
  - 🔊 보라색 (음성): 음성 플레이어 제어
  - ▶️ 빨간색 (비디오): 비디오 플레이어 제어
- 성경 본문 미리보기
- 반응형 디자인 (모바일 최적화)

### 오디오/비디오 재생 기능
- 음성 파일이 있는 경우: 타임스탬프 클릭 시 음성 플레이어로 이동 및 자동 재생
- 음성이 없고 비디오만 있는 경우: 비디오 플레이어로 이동
- 자동 스크롤: 해당 플레이어 위치로 부드럽게 이동

## 🔧 기술 스택

- React + TypeScript
- React Query (데이터 페칭 및 캐싱)
- React Router (페이지 네비게이션)
- CSS (커스텀 스타일)

## 📝 API 엔드포인트

### 트랜스크립트 분석
```
POST /api/v1/sermons/{sermon_id}/analyze-transcript
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

file: transcript.json
```

**응답:**
```json
{
  "sermon_id": 123,
  "total_references": 7,
  "references_saved": 7,
  "references": [...]
}
```

### 설교별 성경 구절 목록 조회 (신규)
```
GET /api/v1/sermons/{sermon_id}/bible-references
```

**응답:**
```json
[
  {
    "id": 1,
    "book_number": 9,
    "book_name": "사무엘상",
    "chapter": 3,
    "verse": 3,
    "timestamp": 168.5,
    "segment_text": "오늘 말씀에 사무엘상 3장 3절 상반절에",
    "reference_text": "사무엘상 3장 3절",
    "bible_text": "하나님의 등불은 아직 꺼지지 아니하였으며...",
    "bible_book_name_ko": "사무엘상",
    "bible_book_name_en": "1 Samuel"
  }
]
```

### 설교 상세 조회 (확장)
```
GET /api/v1/sermons/{sermon_id}
```

**응답에 bible_references 필드 포함:**
```json
{
  "id": 123,
  "title": "...",
  "bible_references": [...]
}
```

## ✅ 완료된 작업

- [x] 타입 정의 추가 (BibleReference, TranscriptAnalysisResponse)
- [x] API 함수 구현 (analyzeTranscript, getSermonBibleReferences)
- [x] 설교별 성경 구절 목록 조회 훅 생성
- [x] 트랜스크립트 업로드 컴포넌트 생성
- [x] 트랜스크립트 업로드 훅 생성
- [x] 성경 구절 표시 컴포넌트 생성
- [x] 성경 구절 관리 모달 컴포넌트 생성 (관리자용)
- [x] 설교 폼에 트랜스크립트 업로드 통합
- [x] 설교 상세보기에 성경 구절 섹션 추가
- [x] 설교 상세보기에서 별도 API로 성경 구절 조회 기능
- [x] 타임스탬프 클릭 시 오디오/비디오 이동 기능
- [x] 오디오 우선 재생 (트랜스크립트는 음성 기반)
- [x] 오디오 자동 재생 및 스크롤
- [x] 오디오/비디오 구분 UI (아이콘 및 색상)
- [x] 성경 구절 클릭 시 성경 상세보기 이동
- [x] 트랜스크립트 업로드 후 자동 캐시 갱신
- [x] 검색 기능이 포함된 성경 구절 관리 UI
- [x] 반응형 디자인 적용

## 🎉 결과

완전한 설교 트랜스크립트 성경 구절 추출 및 표시 시스템이 구현되었습니다. 

### 주요 개선사항

1. **별도 API 엔드포인트**: 설교 상세 조회와 독립적으로 성경 구절만 조회 가능
2. **자동 캐시 관리**: 트랜스크립트 업로드 후 자동으로 데이터 새로고침
3. **관리자 도구**: 검색 기능이 포함된 성경 구절 관리 모달
4. **최적화된 로딩**: 설교 상세에 구절이 포함되지 않은 경우에만 별도 API 호출
5. **실시간 피드백**: 업로드 진행 상태 및 결과 표시

관리자는 트랜스크립트를 업로드하여 자동으로 성경 구절을 추출할 수 있고, 사용자는 설교에서 언급된 성경 구절을 쉽게 탐색하고 성경 본문으로 이동할 수 있습니다.
