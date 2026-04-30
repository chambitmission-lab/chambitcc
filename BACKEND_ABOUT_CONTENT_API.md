# 🔌 백엔드 API 요구사항 - 소개 페이지 인라인 편집

## 📋 개요

`/about` 화면을 관리자가 로그인했을 때 ✏️ 버튼으로 텍스트/배경 이미지를
바로 수정할 수 있도록 백엔드에 다음 엔드포인트와 저장소가 필요합니다.

프론트엔드는 이미 다음 위치에서 호출 준비가 되어 있습니다.

- API 클라이언트: `frontend/src/api/aboutContent.ts`
- 훅: `frontend/src/hooks/useAboutContent.ts`
- 타입: `frontend/src/types/aboutContent.ts`
- 화면: `frontend/src/pages/About/About.tsx`
- 편집 컴포넌트: `frontend/src/components/AboutEditor/`

백엔드가 아직 없을 경우, GET은 404/실패 시 자동으로 `{ fields: {}, hero_background_url: null }`로
fallback되어 기존 i18n 번역값이 그대로 노출됩니다.

---

## 🗄️ 데이터 모델

### 1. `about_content` 테이블 (단일 행, JSON 컬럼)

DB는 MySQL이라 generic `JSON` 타입을 사용. 모델은 `migrate_add_about_content.py`로
SQLAlchemy `Base.metadata.create_all`을 통해 생성됨.

```sql
-- 참고용 (실제로는 SQLAlchemy가 자동 생성)
CREATE TABLE about_content (
  id INTEGER PRIMARY KEY,
  fields JSON NOT NULL,
  hero_background_url TEXT NULL,
  updated_at DATETIME,
  CONSTRAINT about_content_singleton CHECK (id = 1)
);

INSERT INTO about_content (id, fields) VALUES (1, '{}');
```

`fields` JSONB 구조:

```json
{
  "aboutChurchName": { "ko": "참빛교회", "en": "Chambit Church" },
  "aboutTagline":    { "ko": "인생은 만남입니다", "en": "Life is about meeting" }
}
```

키는 `frontend/src/locales/ko/about.ts`의 키와 1:1 대응 (예: `aboutWelcome`,
`aboutMainTitle`, `aboutPastorIntro1`, `aboutEducationValue` 등 32개).

### 2. Supabase Storage 버킷

- 버킷명: `about-assets`
- 공개(public) 읽기 정책 + 관리자만 INSERT 정책
- 업로드된 파일은 public URL을 `about_content.hero_background_url`에 저장

---

## 🔌 엔드포인트

### `GET /api/v1/about-content`

- 인증: 불필요 (공개)
- 응답 200:

```json
{
  "fields": {
    "aboutChurchName": { "ko": "참빛교회", "en": "Chambit Church" }
  },
  "hero_background_url": "https://.../about-assets/hero-xxx.jpg",
  "updated_at": "2026-04-30T12:00:00Z"
}
```

- 응답 404: 아직 컨텐츠가 없으면 그대로 404 OK (프론트가 기본값 사용)

### `PUT /api/v1/about-content`

- 인증: **관리자만** (`username == "admin"`, 기존 컬럼 API와 동일 패턴)
- 요청 바디 (부분 업데이트, 둘 다 선택):

```json
{
  "fields": {
    "aboutChurchName": { "ko": "참빛교회", "en": "Chambit Church" }
  },
  "hero_background_url": "https://.../hero-xxx.jpg"
}
```

- 동작: `fields`는 키 단위로 머지(기존 값 유지하면서 보낸 키만 덮어쓰기).
  `hero_background_url`은 `null`을 보내면 초기화.
- 응답 200: 갱신 후의 전체 `AboutContent` 객체 (GET과 동일 형식)

### `POST /api/v1/about-content/upload`

- 인증: **관리자만**
- 요청: `multipart/form-data`, 필드명 `file` (image/*)
- 처리: 파일을 `about-assets` 버킷에 저장 → public URL 생성
- 응답 200:

```json
{ "url": "https://.../about-assets/hero-1714477200-xxx.jpg" }
```

- 검증: 이미지 MIME (`image/jpeg|png|webp`)만 허용, 최대 크기 10MB 권장.
  파일명은 충돌 방지를 위해 `hero-{timestamp}-{random}.{ext}`로 저장.

---

## 🔐 권한

기존 `/api/v1/columns` (목양칼럼)와 동일한 admin 검사 로직을 재사용하면 됩니다.
Bearer 토큰의 사용자명이 `admin`이 아닐 경우 PUT/POST는 403.

---

## ✅ 동작 확인

1. 백엔드 미구현 상태에서도 `/about` 화면은 기존과 동일하게 i18n 번역값으로 표시됨
2. 백엔드 GET이 살아나면 DB 값이 우선 적용되고, 빈 키는 i18n으로 fallback
3. admin 계정으로 로그인하면 각 텍스트 옆에 보라색 ✏️ 버튼이 나타남 →
   클릭 시 한국어/영어 동시 편집 모달 → 저장 시 즉시 화면 반영
4. hero 우상단 🖼️ 버튼으로 배경 이미지를 업로드 → 즉시 hero 배경에 반영
