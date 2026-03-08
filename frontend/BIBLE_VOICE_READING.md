# 성경 음성 읽기 기능 가이드

## 🎤 개요
성경 구절을 사용자가 직접 음성으로 읽어서 학습 완료를 체크하는 기능입니다.
Web Speech API를 활용하여 음성을 텍스트로 변환하고, 원본 구절과 비교하여 읽음 처리합니다.

## ✅ 구현 완료

### 새로 추가된 파일
1. `components/prayer/VerseReadingButton.tsx` - 구절 읽기 버튼 컴포넌트
2. `hooks/useVerseReading.ts` - 구절 읽기 커스텀 훅
3. `utils/textSimilarity.ts` - 텍스트 유사도 검사 유틸리티
4. `pages/Bible/components/VerseItem.tsx` - 개별 구절 컴포넌트

### 수정된 파일
- `pages/Bible/components/VerseList.tsx` - 읽기 모드 추가
- `pages/Bible/styles/verse-display.css` - 읽기 상태 스타일
- `locales/ko/bible.ts` - 한국어 번역 추가
- `locales/en/bible.ts` - 영어 번역 추가

## 🚀 주요 기능

### 1. 음성 읽기 모드
- 토글 버튼으로 읽기 모드 활성화/비활성화
- 진행률 표시 (읽은 구절 / 전체 구절)
- 진행률 바로 시각적 피드백

### 2. 구절별 음성 읽기
- 각 구절마다 마이크 버튼 표시
- 버튼 클릭 → 음성 인식 시작
- 사용자가 구절을 읽으면 실시간 텍스트 변환
- 원본 구절과 비교하여 유사도 검사

### 3. 텍스트 유사도 검사
- Levenshtein Distance 알고리즘 사용
- 기본 임계값: 75% (조정 가능)
- 띄어쓰기, 구두점 무시
- 정규화된 텍스트로 비교

### 4. 읽음 상태 관리
- 읽음 완료된 구절 표시 (체크 아이콘)
- 읽은 구절은 흐리게 + 취소선 표시
- 읽는 중인 구절은 파란색 하이라이트
- 로컬 상태 관리 (추후 백엔드 연동 예정)

### 5. 실시간 피드백
- 읽는 중: 음성 인식된 텍스트 표시
- 성공: "완벽합니다! 🎉" 등 긍정적 메시지
- 실패: "조금 더 정확하게 읽어주세요" 등 안내 메시지
- 유사도에 따른 차등 피드백

## 🎯 사용 방법

### 기본 사용 흐름
1. 성경 읽기 페이지 접속
2. 책과 장 선택
3. "음성 읽기 모드" 버튼 클릭
4. 각 구절의 마이크 버튼 클릭
5. 구절을 소리내어 읽기
6. 자동으로 검증 및 읽음 처리

### 예시 시나리오
```
사용자: [마이크 버튼 클릭]
시스템: [음성 인식 시작 - 빨간색 애니메이션]
사용자: "태초에 하나님이 천지를 창조하시니라"
시스템: [텍스트 변환 및 비교]
시스템: "완벽합니다! 🎉" [체크 표시, 진행률 업데이트]
```

## 🔧 기술 상세

### 텍스트 유사도 알고리즘

#### Levenshtein Distance
두 문자열 간의 편집 거리를 계산하여 유사도를 측정합니다.

```typescript
// 예시
원본: "태초에 하나님이 천지를 창조하시니라"
읽음: "태초에 하나님이 천지를 창조하시니라"
유사도: 100% → 통과 ✅

원본: "태초에 하나님이 천지를 창조하시니라"
읽음: "태초에 하나님이 천지를 창조하셨습니다"
유사도: 85% → 통과 ✅

원본: "태초에 하나님이 천지를 창조하시니라"
읽음: "처음에 하나님이 세상을 만드셨다"
유사도: 45% → 실패 ❌
```

#### 정규화 과정
```typescript
1. 소문자 변환
2. 특수문자 제거
3. 연속 공백 제거
4. 앞뒤 공백 제거

예: "태초에, 하나님이  천지를 창조하시니라!" 
→ "태초에 하나님이 천지를 창조하시니라"
```

### 유사도 임계값
```typescript
threshold: 0.75 (75%)

- 95% 이상: "완벽합니다! 🎉"
- 85% 이상: "잘 읽으셨습니다! ✨"
- 75% 이상: "통과! 👍"
- 60~75%: "조금 더 정확하게 읽어주세요"
- 40~60%: "구절을 다시 확인하고 읽어주세요"
- 40% 미만: "구절과 일치하지 않습니다"
```

### 음성 인식 설정
```typescript
{
  language: 'ko-KR',
  continuous: false,  // 한 구절씩
  interimResults: true,  // 실시간 결과
  maxAlternatives: 1
}
```

## 🎨 UI/UX

### 읽기 모드 토글
- **비활성**: 회색 배경, "일반 모드"
- **활성**: 파란색 배경, "음성 읽기 모드"
- 진행률 표시 (예: 5 / 31)
- 진행률 바 (그라데이션)

### 구절 상태
1. **일반 상태**
   - 기본 스타일
   - 마이크 버튼 표시

2. **읽는 중**
   - 파란색 배경
   - 왼쪽 파란색 테두리
   - 펄스 애니메이션
   - 읽은 텍스트 실시간 표시

3. **읽음 완료**
   - 흐리게 (opacity: 0.6)
   - 취소선
   - 체크 아이콘
   - 버튼 비활성화

### 피드백 메시지
- **성공**: 초록색 배경, 체크 아이콘
- **실패**: 빨간색 배경, 에러 아이콘
- 3초 후 자동 사라짐

## 📊 상태 관리

### 로컬 상태 (현재)
```typescript
const [readingMode, setReadingMode] = useState(false)
const [currentReadingVerseId, setCurrentReadingVerseId] = useState<number | null>(null)
const [readVerses, setReadVerses] = useState<Set<number>>(new Set())
```

### 백엔드 연동 (예정)
```typescript
// TODO: API 호출
const handleReadSuccess = async (verseId: number, similarity: number) => {
  // 로컬 상태 업데이트
  setReadVerses(prev => new Set([...prev, verseId]))
  
  // 백엔드 API 호출
  await markVerseAsRead({
    verseId,
    similarity,
    timestamp: new Date().toISOString()
  })
}
```

## 🔌 백엔드 API 요구사항

### 1. 구절 읽음 처리
```typescript
POST /api/v1/bible/verses/{verseId}/read

Request:
{
  "similarity": 0.95,
  "timestamp": "2024-03-07T10:30:00Z"
}

Response:
{
  "success": true,
  "verse_id": 1,
  "read_at": "2024-03-07T10:30:00Z"
}
```

### 2. 읽은 구절 조회
```typescript
GET /api/v1/bible/verses/read?book_id=1&chapter=1

Response:
{
  "read_verses": [
    {
      "verse_id": 1,
      "similarity": 0.95,
      "read_at": "2024-03-07T10:30:00Z"
    },
    {
      "verse_id": 2,
      "similarity": 0.88,
      "read_at": "2024-03-07T10:31:00Z"
    }
  ]
}
```

### 3. 읽기 진행률 조회
```typescript
GET /api/v1/bible/reading-progress?book_id=1

Response:
{
  "book_id": 1,
  "book_name": "창세기",
  "total_verses": 1533,
  "read_verses": 150,
  "progress": 9.78,
  "chapters": [
    {
      "chapter": 1,
      "total_verses": 31,
      "read_verses": 31,
      "progress": 100
    },
    {
      "chapter": 2,
      "total_verses": 25,
      "read_verses": 15,
      "progress": 60
    }
  ]
}
```

### 4. 읽음 취소
```typescript
DELETE /api/v1/bible/verses/{verseId}/read

Response:
{
  "success": true,
  "verse_id": 1
}
```

## 🌐 브라우저 지원

### 지원되는 브라우저
- ✅ Chrome (Desktop/Mobile)
- ✅ Edge (Desktop/Mobile)
- ✅ Safari (iOS 14.5+)
- ✅ Samsung Internet

### 지원되지 않는 브라우저
- ❌ Firefox (Web Speech API 미지원)

## 📱 플랫폼별 특징

### iOS (Safari)
- HTTPS 필수
- 마이크 권한 요청
- 네트워크 연결 필요
- 한 번에 한 구절씩 인식

### Android (Chrome)
- HTTPS 필수
- 마이크 권한 요청
- 네트워크 연결 필요
- 안정적인 인식

### Desktop
- 마이크 권한 요청
- 안정적인 인식
- 빠른 처리

## 🎯 사용 팁

### 효과적인 읽기
1. **명확하게 발음**
   - 또박또박 읽기
   - 적당한 속도 유지

2. **조용한 환경**
   - 배경 소음 최소화
   - 마이크에 가까이

3. **정확한 읽기**
   - 원본 구절 그대로 읽기
   - 단어 추가/생략 주의

4. **재시도**
   - 실패 시 다시 시도
   - 구절 확인 후 재도전

## 🔄 향후 개선 사항

### 단기 (백엔드 연동)
- [ ] 읽음 상태 서버 저장
- [ ] 읽은 구절 불러오기
- [ ] 진행률 통계
- [ ] 읽기 기록 조회

### 중기 (기능 개선)
- [ ] 읽기 속도 측정
- [ ] 발음 정확도 피드백
- [ ] 읽기 시간 기록
- [ ] 일일 목표 설정

### 장기 (고급 기능)
- [ ] 음성 녹음 저장
- [ ] 읽기 통계 대시보드
- [ ] 읽기 챌린지
- [ ] 소셜 공유 기능

## 🐛 문제 해결

### "마이크 버튼이 안 보여요"
→ 브라우저가 Web Speech API를 지원하지 않음
→ Chrome 또는 Safari 사용

### "음성이 인식되지 않아요"
→ 마이크 권한 확인
→ 조용한 환경에서 테스트
→ 명확하게 발음

### "계속 실패해요"
→ 구절을 정확히 읽었는지 확인
→ 단어 추가/생략 없이 읽기
→ 임계값 조정 가능 (개발자 옵션)

### "읽음 처리가 안 돼요"
→ 유사도가 75% 미만
→ 더 정확하게 읽어보기
→ 네트워크 연결 확인

## 📊 성능 최적화

### 메모리 관리
- 컴포넌트 언마운트 시 자동 정리
- 음성 인식 중지 시 리소스 해제
- Set 자료구조로 효율적 상태 관리

### 네트워크
- 음성 데이터는 실시간 스트리밍
- 텍스트만 저장 (용량 작음)
- 백엔드 API 호출 최소화

### 렌더링
- 구절별 컴포넌트 분리
- 상태 변경 최소화
- CSS 애니메이션 활용

## 🎉 완료!

성경 음성 읽기 기능이 프론트엔드에 완전히 구현되었습니다!

### 다음 단계
1. 백엔드 API 개발
2. API 연동
3. 테스트 및 피드백
4. 배포

사용자는 이제 성경 구절을 직접 읽어서 학습 완료를 체크할 수 있습니다! 🎤📖
