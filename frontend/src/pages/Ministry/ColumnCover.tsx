// 편지 표지 사진 — 틀은 언제나 꽉 채우되, 틀 비율을 사진 비율에 맞춰 잘림을 최소로 한다.
// 고정 16:9 + object-cover 였을 때는 정사각에 가까운 사진이 위아래 절반 가까이 잘려
// "확대된 것처럼" 보였다. 틀을 사진 비율(4:3~2:1 안)로 잡으면 흔한 사진은 거의 그대로 들어간다.
// 남는 자리를 흐린 배경으로 메우는 방식은 양옆이 비어 보여 어색하다는 검증으로 쓰지 않는다.

import { useCallback, useState } from 'react'

const MIN_RATIO = 4 / 3
const MAX_RATIO = 2
const FALLBACK_RATIO = 16 / 9

const ColumnCover = ({ src }: { src: string }) => {
  const [loaded, setLoaded] = useState<{ src: string; ratio: number } | null>(null)
  // 표지를 바꾸면(편집기 미리보기) 이전 사진의 비율이 남지 않게 src 로 묶어 둔다
  const natural = loaded?.src === src ? loaded.ratio : null

  const measure = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return
      setLoaded((prev) => (prev?.src === src ? prev : { src, ratio: img.naturalWidth / img.naturalHeight }))
    },
    [src],
  )

  const ratio = natural ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, natural)) : FALLBACK_RATIO

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl mb-7 bg-gray-100 dark:bg-white/[0.06]"
      style={{ aspectRatio: String(ratio) }}
    >
      <img
        // 캐시된 사진은 onLoad 가 mount 전에 끝나 있을 수 있어 ref 에서도 잰다
        ref={measure}
        src={src}
        alt=""
        decoding="async"
        onLoad={(e) => measure(e.currentTarget)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          natural ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

export default ColumnCover
