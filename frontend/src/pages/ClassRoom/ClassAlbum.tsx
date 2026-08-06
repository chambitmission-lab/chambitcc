// 우리반 앨범 (/classes/:classId/album) — 사진 글만 모아 그리드로
// 카톡과 달리 기간 만료 없이 원본 화질 그대로 남는다
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useClassPosts } from '../../hooks/useClassRoom'
import { Shell } from './classUi'

const ClassAlbum = () => {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const id = Number(classId)

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useClassPosts(id, 'photo')

  // 글 단위 → 사진 단위로 펼친다 (설명은 라이트박스 캡션으로)
  const photos = useMemo(() => {
    const posts = data?.pages.flatMap((p) => p.items) ?? []
    return posts.flatMap((post) =>
      post.photos.map((url) => ({
        url,
        caption: post.content || post.title || '',
        date: post.created_at,
      })),
    )
  }, [data])

  const [viewer, setViewer] = useState<number | null>(null)

  return (
    <Shell onBack={() => navigate(`/classes/${id}`)} title="📷 우리반 앨범">
      {isLoading ? (
        <div className="grid grid-cols-3 gap-1 p-1 pt-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100/70 dark:bg-white/[0.04] animate-pulse rounded-sm" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20 px-6">
          <span className="text-4xl block mb-3">📷</span>
          <p className="text-[13px] text-gray-500 dark:text-white/55 leading-[1.7]">
            아직 사진이 없어요.
            <br />
            선생님이 올린 활동 사진이 여기에 차곡차곡 모여요.
          </p>
        </div>
      ) : (
        <>
          <p className="px-4 pt-4 text-[11.5px] text-gray-400 dark:text-white/40">
            사진 {photos.length}장 · 기간 만료 없이 원본 화질로 보관돼요
          </p>
          <div className="grid grid-cols-3 gap-1 p-1 pt-2">
            {photos.map((p, i) => (
              <button
                key={`${p.url}-${i}`}
                type="button"
                onClick={() => setViewer(i)}
                className="aspect-square overflow-hidden bg-gray-100 dark:bg-white/[0.05] rounded-sm active:opacity-80 transition-opacity"
              >
                <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-5 py-2.5 rounded-full bg-[var(--brand-soft)] text-brand text-[13px] font-bold disabled:opacity-50"
              >
                {isFetchingNextPage ? '불러오는 중...' : '지난 사진 더보기'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 라이트박스 */}
      {viewer !== null && photos[viewer] && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setViewer(null)}
        >
          <img
            src={photos[viewer].url}
            alt=""
            className="max-w-full max-h-[74vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {photos[viewer].caption && (
            <p className="max-w-[90%] text-center text-white/80 text-[12.5px] mt-3 line-clamp-2">
              {photos[viewer].caption}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={viewer === 0}
              onClick={() => setViewer((v) => (v ?? 0) - 1)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-bold disabled:opacity-30"
            >
              이전
            </button>
            <span className="text-white/70 text-[12px] font-semibold tabular-nums">
              {viewer + 1} / {photos.length}
            </span>
            <button
              type="button"
              disabled={viewer === photos.length - 1}
              onClick={() => setViewer((v) => (v ?? 0) + 1)}
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-bold disabled:opacity-30"
            >
              다음
            </button>
            <a
              href={photos[viewer].url}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-full bg-white/15 text-white text-[13px] font-bold"
            >
              원본
            </a>
          </div>
          <button
            type="button"
            onClick={() => setViewer(null)}
            aria-label="닫기"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </Shell>
  )
}

export default ClassAlbum
