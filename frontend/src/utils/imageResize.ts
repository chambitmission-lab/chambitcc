/**
 * 업로드 전 클라이언트 리사이즈 유틸.
 * 프로필 사진처럼 작은 정사각 이미지가 필요한 경우 원본(수 MB)을
 * 그대로 올리지 않고 max 변 기준으로 줄여 JPEG Blob으로 변환한다.
 * createImageBitmap의 imageOrientation 옵션으로 EXIF 회전을 보정한다.
 */
export const resizeImageToBlob = async (
  file: File,
  maxSize = 512,
  quality = 0.85,
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

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('이미지 변환에 실패했습니다'))
      },
      'image/jpeg',
      quality,
    )
  })
}
