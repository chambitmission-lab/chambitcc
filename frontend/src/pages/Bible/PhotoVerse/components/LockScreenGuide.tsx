import { useNowMs } from '../../../../hooks/useNowMs'

interface LockScreenGuideProps {
  language: 'ko' | 'en'
}

/**
 * 잠금화면 미리보기 — 캔버스 위에 시계·날짜·하단 버튼을 겹쳐 '내 폰에서 이렇게 보인다'를 보여준다.
 * 화면용 겹침일 뿐 저장본에는 들어가지 않는다. 위치는 canvas/frames.ts 의 LOCK_SAFE 와 맞춘 것.
 */
const LockScreenGuide = ({ language }: LockScreenGuideProps) => {
  const now = new Date(useNowMs())
  const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`
  const date = now.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
  return (
    <div className="pv-lock-guide" aria-hidden="true">
      <span className="pv-lock-guide__date">{date}</span>
      <span className="pv-lock-guide__time">{time}</span>
      <span className="pv-lock-guide__widgets">
        <span />
        <span />
      </span>
      <span className="pv-lock-guide__btn pv-lock-guide__btn--left">
        <span className="material-icons-round">flashlight_on</span>
      </span>
      <span className="pv-lock-guide__btn pv-lock-guide__btn--right">
        <span className="material-icons-round">photo_camera</span>
      </span>
      <span className="pv-lock-guide__home" />
    </div>
  )
}

export default LockScreenGuide
