// 화면에 들어오고 이미지 로드가 끝나면 서서히 인화되는 폴라로이드.

import { useEffect, useRef, useState } from 'react'
import type { CapsulePhoto } from '../../../types/timeCapsule'


/** 화면에 들어오고 이미지 로드가 끝나면 서서히 인화되는 폴라로이드 */
const DevelopingPolaroid = ({
  photo,
  tilt,
  stamp,
}: {
  photo: CapsulePhoto
  tilt: string
  stamp: string
}) => {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const developed = visible && loaded
  return (
    <figure
      ref={ref}
      className={`capsule-polaroid ${developed ? 'capsule-polaroid--developed' : ''}`}
      style={{ transform: `rotate(${tilt})` }}
    >
      {/* 편지지에 마스킹테이프로 붙여둔 인화지 */}
      <i className="capsule-polaroid__tape" aria-hidden />
      <div className="capsule-polaroid__img-wrap">
        <img
          src={photo.url}
          alt={photo.caption || '캡슐에 동봉된 사진'}
          className="capsule-polaroid__img"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        {stamp && <span className="capsule-polaroid__stamp">{stamp}</span>}
      </div>
      {photo.caption && (
        <figcaption className="capsule-polaroid__caption">{photo.caption}</figcaption>
      )}
    </figure>
  )
}

// ── 같은 화면의 형제 모듈이 쓴다 ──
export { DevelopingPolaroid }
