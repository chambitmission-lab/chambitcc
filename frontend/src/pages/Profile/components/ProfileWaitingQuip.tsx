import { useEffect, useState } from 'react'
import { useLanguage } from '../../../contexts/LanguageContext'
import { nextWaitingQuip, PROFILE_WAITING_QUIPS, PROFILE_QUIP_STORAGE_KEY } from '../../../utils/waitingQuips'
import './ProfileWaitingQuip.css'

/* 프로필 첫 진입 대기 — 스켈레톤 위에 떠 있는 작은 쪽지.
 * 홈 묵상 카드(WaitingQuipLoader)와 같은 성경 속 "기다림" 한 줄 유머의 프로필용 풀(utils/waitingQuips)을 쓴다.
 * 캐시가 있어 400ms 안에 본문이 오면 문구가 드러나기 전에 끝나고(CSS animation-delay),
 * 콜드 로드가 길어지면 몇 초마다 다음 농담으로 넘어가 같은 문장을 멍하니 보고 있지 않게 한다.
 * 클릭은 통과(pointer-events: none) — 상단 바의 뒤로가기·로그아웃은 그대로 눌린다. */

const ROTATE_MS = 4500
const pickQuip = () => nextWaitingQuip(PROFILE_WAITING_QUIPS, PROFILE_QUIP_STORAGE_KEY)

const ProfileWaitingQuip = () => {
  const { language } = useLanguage()
  const [quip, setQuip] = useState(pickQuip)
  const isKo = language === 'ko'

  useEffect(() => {
    const id = window.setInterval(() => setQuip(pickQuip()), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="pwq" aria-hidden>
      <div className="pwq-card">
        <div className="pwq-head">
          <span className="pwq-label">{isKo ? '잠깐만요' : 'Just a moment'}</span>
          <span className="pwq-sub">{isKo ? '프로필을 펼치는 중' : 'Opening your profile'}</span>
        </div>
        {/* key 로 문구가 바뀔 때마다 다시 마운트 → 살짝 올라오며 교체 */}
        <div className="pwq-body" key={quip.refKo}>
          <p className="pwq-text">{isKo ? quip.ko : quip.en}</p>
          <span className="pwq-ref">— {isKo ? quip.refKo : quip.refEn}</span>
        </div>
        <span className="pwq-dots">
          <i />
          <i />
          <i />
        </span>
      </div>
    </div>
  )
}

export default ProfileWaitingQuip
