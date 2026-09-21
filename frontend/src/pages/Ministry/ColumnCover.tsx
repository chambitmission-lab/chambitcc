// 편지 표지 사진 — 어떤 크기·비율의 사진이 와도 잘리거나 뭉개지지 않게 틀이 사진에 맞춘다.
// 고정 16:9 + object-cover 였을 때는 작은 정사각 사진(예: 304×313)이 2배로 늘어나 흐려지고
// 위아래 절반이 잘렸다. 지금은 ① 틀 비율을 사진 비율에 맞추되 4:3~2:1 안으로만 두고
// ② 사진은 원본 크기 이상으로 키우지 않으며 ③ 남는 자리는 같은 사진의 흐린 배경으로 채운다.

import { useCallback, useState } from 'react'

const MIN_RATIO = 4 / 3
const MAX_RATIO = 2
const FALLBACK_RATIO = 16 / 9

interface NaturalSize {
  width: number
  height: number
}

const ColumnCover = ({ src }: { src: string }) => {
  const [loaded, setLoaded] = useState<{ src: string; size: NaturalSize } | null>(null)
  // 표지를 바꾸면(편집기 미리보기) 이전 사진의 치수가 남지 않게 src 로 묶어 둔다
  const size = loaded?.src === src ? loaded.size : null

  const measure = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || !img.complete || !img.naturalWidth) return
      setLoaded((prev) =>
        prev?.src === src ? prev : { src, size: { width: img.naturalWidth, height: img.naturalHeight } },
      )
    },
    [src],
  )

  const ratio = size
    ? Math.min(MAX_RATIO, Math.max(MIN_RATIO, size.width / size.height))
    : FALLBACK_RATIO

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl mb-7 bg-gray-100 dark:bg-white/[0.06]"
      // 작은 사진이면 틀 높이도 사진 높이에서 멈춘다 — 빈 틀 한가운데 사진이 떠 있지 않게
      style={{ aspectRatio: String(ratio), maxHeight: size ? `${size.height}px` : undefined }}
    >
      {size && (
        <>
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl"
          />
          <div className="absolute inset-0 bg-white/20 dark:bg-black/30"></div>
        </>
      )}
      <img
        // 캐시된 사진은 onLoad 가 mount 전에 끝나 있을 수 있어 ref 에서도 잰다
        ref={measure}
        src={src}
        alt=""
        decoding="async"
        onLoad={(e) => measure(e.currentTarget)}
        className={`absolute inset-0 m-auto w-full h-full object-contain transition-opacity duration-300 ${
          size ? 'opacity-100' : 'opacity-0'
        }`}
        style={size ? { maxWidth: `${size.width}px`, maxHeight: `${size.height}px` } : undefined}
      />
    </div>
  )
}

export default ColumnCover
