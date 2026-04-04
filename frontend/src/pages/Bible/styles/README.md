# Bible Study Styles

이 디렉토리는 SOLID 원칙의 **Single Responsibility Principle (단일 책임 원칙)**을 따라 BibleStudy 컴포넌트의 스타일을 기능별로 분리한 것입니다.

## 파일 구조

```
styles/
├── layout.css              # 레이아웃 및 컨테이너
├── book-selector.css       # 성경 책 선택 그리드
├── chapter-navigation.css  # 장 네비게이션 컨트롤
├── verse-display.css       # 성경 본문 표시
├── search.css              # 검색 기능
└── common.css              # 공통 컴포넌트 (로딩 등)
```

## 각 파일의 책임

### 1. layout.css
- 페이지 컨테이너
- 헤더 및 타이틀
- 탭 네비게이션
- 전체 레이아웃 구조

### 2. book-selector.css
- 구약/신약 책 목록 그리드
- 책 선택 버튼
- 책 정보 헤더
- 뒤로가기 버튼

### 3. chapter-navigation.css
- 이전/다음 장 버튼
- 장 선택 드롭다운
- 장 선택 그리드 (선택적)

### 4. verse-display.css
- 성경 구절 표시
- 구절 번호 및 텍스트
- 호버 효과
- 더보기 버튼

### 5. search.css
- 검색 폼
- 검색 결과 표시
- 검색 결과 구절 카드
- 빈 결과 상태

### 6. common.css
- 로딩 스피너
- 애니메이션
- 재사용 가능한 공통 요소

## 사용 방법

메인 `BibleStudy.css` 파일에서 모든 하위 스타일을 import합니다:

```css
@import './styles/layout.css';
@import './styles/book-selector.css';
@import './styles/chapter-navigation.css';
@import './styles/verse-display.css';
@import './styles/search.css';
@import './styles/common.css';
```

## 장점

1. **유지보수성**: 각 기능의 스타일을 독립적으로 수정 가능
2. **가독성**: 파일 크기가 작아져서 코드 이해가 쉬움
3. **재사용성**: 필요한 스타일만 선택적으로 import 가능
4. **협업**: 여러 개발자가 동시에 다른 파일 작업 가능
5. **테스트**: 각 기능별로 독립적인 테스트 가능

## BEM 네이밍 규칙

모든 클래스는 BEM (Block Element Modifier) 규칙을 따릅니다:

- **Block**: `.bible-verse-item`
- **Element**: `.bible-verse-number`, `.bible-verse-text`
- **Modifier**: `.bible-verse-item--search`

이를 통해 다른 페이지의 스타일과 충돌을 방지합니다.
