# 📖 설교 음성 녹음 및 업로드 기능

## 개요
목사님(관리자)이 설교 음성을 녹음하거나 파일을 업로드하여 설교를 등록하고, 성도들이 설교 목록을 조회하고 음성을 들을 수 있는 기능입니다.

## 주요 기능

### 1. 설교 목록 조회 (모든 사용자)
- 등록된 설교 목록을 카드 형태로 표시
- 제목, 목사님, 성경 구절, 날짜, 조회수 표시
- 음성/영상 여부 아이콘 표시
- 설교 카드 클릭 시 상세 모달 표시

### 2. 설교 상세 보기 (모든 사용자)
- 설교 전체 내용 표시
- 음성 파일 재생 (HTML5 Audio Player)
- 영상 링크 제공 (외부 링크)
- 썸네일 이미지 표시
- **관리자 전용**: 설교 삭제 버튼 (음성 파일도 자동 삭제)

### 3. 설교 등록 (관리자 전용)
- **음성 녹음**: 브라우저에서 직접 음성 녹음
  - 녹음 시작/일시정지/재개/정지
  - 녹음 시간 표시
  - 녹음 완료 후 미리듣기
- **파일 업로드**: 로컬 음성 파일 선택 업로드
  - 지원 형식: MP3, WebM, WAV, OGG, M4A
  - 최대 크기: 100MB
- **음성 파일 관리**:
  - 선택된 파일 삭제 가능
  - 폼 취소 시 업로드된 음성 파일 자동 삭제 (고아 파일 방지)
- 설교 정보 입력
  - 제목, 목사님, 성경 구절, 날짜, 내용 (필수)
  - 비디오 URL, 썸네일 URL (선택)

### 4. 설교 삭제 (관리자 전용)
- 설교 상세 화면에서 삭제 버튼 클릭
- 삭제 확인 모달 표시
- 설교 삭제 시 연결된 음성 파일도 자동 삭제

## 컴포넌트 구조

```
Sermon/
├── Sermon.tsx                    # 메인 페이지
├── components/
│   ├── SermonCard.tsx           # 설교 카드 컴포넌트
│   ├── SermonDetail.tsx         # 설교 상세 모달
│   ├── SermonForm.tsx           # 설교 등록 폼
│   └── AudioRecorder.tsx        # 음성 녹음 컴포넌트
└── README.md
```

## 훅 구조

```
hooks/
├── useSermons.ts                # 설교 데이터 관리
└── useAudioRecorder.ts          # 음성 녹음 로직
```

## API 구조

```
api/
└── sermon.ts                    # 설교 API 함수
    ├── getSermons()            # 설교 목록 조회
    ├── getSermon()             # 설교 상세 조회
    ├── uploadAudio()           # 음성 파일 업로드
    └── createSermon()          # 설교 생성
```

## 타입 정의

```typescript
interface Sermon {
  id: number
  title: string
  pastor: string
  bible_verse: string
  sermon_date: string
  content: string
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  views: number
  is_published: number
  created_at: string
  updated_at: string
}
```

## SOLID 원칙 준수

### 1. Single Responsibility Principle (단일 책임 원칙)
- `AudioRecorder`: 음성 녹음만 담당
- `SermonForm`: 설교 등록 폼만 담당
- `SermonCard`: 설교 카드 표시만 담당
- `SermonDetail`: 설교 상세 표시만 담당

### 2. Open/Closed Principle (개방-폐쇄 원칙)
- 컴포넌트는 props를 통해 확장 가능
- 새로운 기능 추가 시 기존 코드 수정 최소화

### 3. Liskov Substitution Principle (리스코프 치환 원칙)
- 타입 정의를 통한 인터페이스 일관성 유지
- Props 타입 명확히 정의

### 4. Interface Segregation Principle (인터페이스 분리 원칙)
- 각 컴포넌트는 필요한 props만 받음
- 불필요한 의존성 제거

### 5. Dependency Inversion Principle (의존성 역전 원칙)
- 커스텀 훅을 통한 비즈니스 로직 분리
- API 함수 모듈화

## 사용 방법

### 관리자 (목사님)
1. 설교 페이지 접속
2. 우측 상단 "등록" 버튼 클릭
3. 설교 정보 입력
4. 음성 녹음 또는 파일 선택
5. "등록하기" 버튼 클릭

### 성도
1. 설교 페이지 접속
2. 설교 카드 클릭
3. 음성 재생 또는 영상 시청

## 권한 관리
- 관리자 확인: `localStorage.getItem('user_username') === 'admin'`
- 관리자만 설교 등록 가능
- 모든 사용자는 설교 조회 가능

## 디자인 패턴
- 기존 프로젝트의 Instagram 스타일 디자인 유지
- 다크 모드 지원
- 반응형 디자인 (모바일 최적화)
- Material Icons 사용
