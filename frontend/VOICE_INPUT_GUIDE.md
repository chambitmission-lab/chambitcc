# 음성 입력 기능 가이드

## 🎤 개요
Web Speech API를 사용한 음성-텍스트 변환 기능이 추가되었습니다.
사용자가 말하면 실시간으로 텍스트로 변환되어 입력됩니다.

## ✅ 구현 완료

### 새로 추가된 파일
1. `hooks/useSpeechRecognition.ts` - 음성 인식 커스텀 훅
2. `components/common/VoiceInputButton.tsx` - 마이크 버튼 컴포넌트
3. `pages/Home/components/PrayerComposer/ContentCard.tsx` - 음성 입력 통합

### 수정된 파일
- `locales/ko/prayer.ts` - 한국어 번역 추가
- `locales/en/prayer.ts` - 영어 번역 추가

## 🚀 주요 기능

### 1. 제목 음성 입력
- 🎤 버튼 클릭 → 음성 인식 시작
- 말하면 제목에 텍스트 추가
- 자동으로 중지 (한 문장 인식 후)

### 2. 내용 음성 입력
- 🎤 버튼 클릭 → 음성 인식 시작
- 말하면 내용에 텍스트 추가
- 계속 인식 (다시 클릭하면 중지)

### 3. 실시간 피드백
- 음성 인식 중: 빨간색 애니메이션
- 에러 발생: 에러 메시지 표시
- 텍스트 실시간 추가

## 🎯 사용 방법

### 기본 사용
1. 기도 작성 모달 열기
2. 제목 또는 내용 옆의 🎤 버튼 클릭
3. 마이크 권한 허용
4. 말하기 시작
5. 텍스트가 자동으로 입력됨

### 제목 입력
```
사용자: "가족의 건강을 위한 기도"
→ 제목에 "가족의 건강을 위한 기도" 입력됨
→ 자동 중지
```

### 내용 입력
```
사용자: "사랑하는 가족들이 건강하게 지낼 수 있도록 기도합니다"
→ 내용에 텍스트 추가
→ 계속 인식 중 (다시 클릭하면 중지)
```

## 🌐 브라우저 지원

### 지원되는 브라우저
- ✅ Chrome (Desktop/Mobile)
- ✅ Edge (Desktop/Mobile)
- ✅ Safari (iOS 14.5+)
- ✅ Samsung Internet

### 지원되지 않는 브라우저
- ❌ Firefox (Web Speech API 미지원)
- ❌ 구형 브라우저

지원되지 않는 브라우저에서는 마이크 버튼이 표시되지 않습니다.

## 📱 플랫폼별 특징

### iOS (Safari)
- HTTPS 필수
- 첫 사용 시 마이크 권한 요청
- 백그라운드에서 작동 안 함
- 네트워크 연결 필요

### Android (Chrome)
- HTTPS 필수
- 마이크 권한 요청
- 백그라운드에서도 작동
- 네트워크 연결 필요

### Desktop
- 마이크 권한 요청
- 백그라운드에서도 작동
- 안정적인 인식

## 🔧 기술 상세

### Web Speech API
```typescript
const SpeechRecognition = 
  window.SpeechRecognition || 
  window.webkitSpeechRecognition

const recognition = new SpeechRecognition()
recognition.lang = 'ko-KR'  // 한국어
recognition.continuous = true  // 계속 인식
recognition.interimResults = true  // 중간 결과 표시
```

### 언어 설정
- 한국어: `ko-KR`
- 영어: `en-US`
- 자동 감지: 현재 언어 컨텍스트 사용

### 에러 처리
```typescript
- 'no-speech': 음성이 감지되지 않음
- 'audio-capture': 마이크 사용 불가
- 'not-allowed': 마이크 권한 거부
- 'network': 네트워크 오류
```

## 🎨 UI/UX

### 마이크 버튼 상태
1. **대기 중** (보라색)
   - 클릭하면 음성 인식 시작
   
2. **인식 중** (빨간색 + 애니메이션)
   - 말하는 내용이 텍스트로 변환됨
   - 클릭하면 중지

3. **에러** (에러 메시지 표시)
   - 3초 후 자동으로 사라짐

### 시각적 피드백
- 🎤 아이콘 변화 (mic_none → mic)
- 펄스 애니메이션
- 입력란 펄스 효과
- "음성 인식 중..." 메시지

## 🔐 보안 및 권한

### 마이크 권한
- 첫 사용 시 브라우저가 권한 요청
- 사용자가 허용해야 작동
- 권한 거부 시 에러 메시지 표시

### HTTPS 필수
- Web Speech API는 HTTPS에서만 작동
- localhost는 예외 (개발 환경)
- PWA는 이미 HTTPS 필수

### 프라이버시
- 음성 데이터는 Google 서버로 전송 (Chrome)
- Apple 서버로 전송 (Safari)
- 로컬 저장 안 됨
- 텍스트만 앱에 저장

## 🧪 테스트 방법

### 로컬 테스트
```bash
cd frontend
npm run dev
# http://localhost:5173 접속
```

### 모바일 테스트
1. 같은 네트워크에서 모바일 접속
2. 또는 HTTPS로 배포 후 테스트

### 권한 테스트
1. 마이크 버튼 클릭
2. 권한 허용
3. "테스트" 말하기
4. 텍스트 입력 확인

## 🐛 문제 해결

### "마이크 버튼이 안 보여요"
→ 브라우저가 Web Speech API를 지원하지 않음
→ Chrome 또는 Safari 사용

### "마이크 권한이 거부되었습니다"
→ 브라우저 설정에서 마이크 권한 허용
→ Chrome: 설정 > 개인정보 및 보안 > 사이트 설정 > 마이크

### "음성이 인식되지 않아요"
→ 마이크가 제대로 연결되었는지 확인
→ 조용한 환경에서 테스트
→ 명확하게 말하기

### "HTTPS가 아니라서 작동 안 해요"
→ 로컬 개발: localhost 사용 (자동 허용)
→ 배포: HTTPS 설정 필수

### "네트워크 오류가 발생해요"
→ 인터넷 연결 확인
→ 방화벽 설정 확인

## 📊 성능 최적화

### 메모리 관리
- 컴포넌트 언마운트 시 자동 정리
- 음성 인식 중지 시 리소스 해제

### 네트워크
- 음성 데이터는 실시간 스트리밍
- 텍스트만 앱에 저장 (용량 작음)

### 배터리
- 음성 인식은 배터리 소모가 큼
- 사용 후 자동 중지 권장

## 🎯 사용 팁

### 효과적인 음성 입력
1. **명확하게 말하기**
   - 또박또박 발음
   - 적당한 속도

2. **조용한 환경**
   - 배경 소음 최소화
   - 마이크에 가까이

3. **문장 단위로 말하기**
   - 자연스러운 문장
   - 쉼표, 마침표는 자동 추가 안 됨

4. **수정하기**
   - 잘못 인식되면 직접 수정
   - 또는 지우고 다시 말하기

### 제목 vs 내용
- **제목**: 짧게 한 문장 (자동 중지)
- **내용**: 길게 여러 문장 (수동 중지)

## 🔄 업데이트 계획

### 향후 개선 사항
- [ ] 오프라인 음성 인식 (Web Speech API 제한)
- [ ] 구두점 자동 추가
- [ ] 음성 명령 (예: "줄바꿈", "지우기")
- [ ] 다국어 자동 감지
- [ ] 음성 인식 정확도 향상

## 📝 코드 예시

### 기본 사용
```typescript
import { useSpeechRecognition } from './hooks/useSpeechRecognition'

const MyComponent = () => {
  const voice = useSpeechRecognition({
    onResult: (transcript) => {
      console.log('인식된 텍스트:', transcript)
    },
    onError: (error) => {
      console.error('에러:', error)
    },
    language: 'ko-KR',
    continuous: true,
  })

  return (
    <button onClick={voice.toggleListening}>
      {voice.isListening ? '중지' : '시작'}
    </button>
  )
}
```

### 커스터마이징
```typescript
// 영어 인식
const englishVoice = useSpeechRecognition({
  language: 'en-US',
  continuous: false,
})

// 한 문장만 인식
const singleVoice = useSpeechRecognition({
  continuous: false,
})
```

## 🌟 장점

1. **무료**: 브라우저 내장 API
2. **빠름**: 실시간 변환
3. **정확함**: Google/Apple 음성 인식 엔진
4. **쉬움**: 백엔드 수정 불필요
5. **접근성**: 타이핑 어려운 사용자 지원

## ⚠️ 제한사항

1. **브라우저 의존**: Firefox 미지원
2. **네트워크 필요**: 오프라인 불가
3. **HTTPS 필수**: 보안 연결 필요
4. **프라이버시**: 음성 데이터 외부 전송
5. **정확도**: 배경 소음에 민감

## 📞 지원

문제가 있으면:
1. 브라우저 콘솔 확인
2. 마이크 권한 확인
3. HTTPS 연결 확인
4. 네트워크 연결 확인

## 🎉 완료!

음성 입력 기능이 완전히 구현되었습니다.
사용자는 이제 말로 기도 제목과 내용을 입력할 수 있습니다!
