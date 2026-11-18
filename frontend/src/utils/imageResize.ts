/**
 * 업로드 전 클라이언트 리사이즈 유틸.
 * 프로필 사진처럼 작은 정사각 이미지가 필요한 경우 원본(수 MB)을
 * 그대로 올리지 않고 max 변 기준으로 줄여 JPEG(또는 WebP) Blob으로 변환한다.
 * createImageBitmap의 imageOrientation 옵션으로 EXIF 회전을 보정한다.
 */
export const resizeImageToBlob = async (
  file: File,
  maxSize = 512,
  quality = 0.85,
  /** true 면 WebP 로 만든다(같은 화질에서 JPEG 보다 25~35% 작다). 못 만드는 브라우저는 JPEG */
  preferWebp = false,
): Promise<Blob> => {
  const bitmap = await createImageBitmap(file, {
    // 지원 브라우저에서 EXIF 방향 자동 보정 (미지원이면 옵션 무시됨)
    imageOrientation: 'from-image',
  } as ImageBitmapOptions)

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('이미지 처리를 지원하지 않는 브라우저입니다')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

  if (preferWebp) {
    // WebP 인코딩을 못 하는 브라우저(Safari)는 조용히 PNG 를 돌려준다 —
    // 용량이 오히려 커지므로 결과 타입을 확인하고, 아니면 JPEG 로 다시 만든다
    const webp = await encode('image/webp')
    if (webp && webp.type === 'image/webp') return webp
  }

  const jpeg = await encode('image/jpeg')
  if (!jpeg) throw new Error('이미지 변환에 실패했습니다')
  return jpeg
}

/** 업로드 파일 이름에 붙일 확장자 — 서버가 파일명 확장자를 저장 키에 그대로 쓴다 */
export const blobExtension = (blob: Blob): string =>
  blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
