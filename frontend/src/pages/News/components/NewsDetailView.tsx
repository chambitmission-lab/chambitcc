// 교회소식 상세 — 제목/본문/사진/첨부파일
// Single Responsibility: 소식 한 건을 읽는 화면(+ 사진 확대 라이트박스)
import { useState } from 'react'
import { useNewsDetail } from '../../../hooks/useNews'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import type { NewsAttachment } from '../../../types/news'

interface NewsDetailViewProps {
  newsId: number
  onBack: () => void
}

const formatDateTime = (value: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const formatSize = (bytes: number | null) => {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

/** 확장자별 색 힌트 — 문서 종류를 아이콘 대신 글자로 구분한다 */
const extensionOf = (attachment: NewsAttachment): string => {
  const name = attachment.filename ?? attachment.url
  const dot = name.lastIndexOf('.')
  return dot === -1 ? 'FILE' : name.slice(dot + 1).toUpperCase().slice(0, 4)
}

const NewsDetailView = ({ newsId, onBack }: NewsDetailViewProps) => {
  const { data: news, isLoading, error } = useNewsDetail(newsId)
  const [zoom, setZoom] = useState<string | null>(null)

  const images = news?.attachments.filter((a) => a.kind === 'image') ?? []
  const files = news?.attachments.filter((a) => a.kind === 'file') ?? []

  return (
    <div className="px-4 pt-3 pb-10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 mb-3 h-9 pl-2 pr-3.5 rounded-full text-[12.5px] font-bold text-gray-600 dark:text-white/70 hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        목록으로
      </button>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-7 w-2/3 rounded-lg bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
        </div>
      ) : error || !news ? (
        <div className="rounded-2xl border border-[var(--card-border)] bg-white/80 dark:bg-card-dark px-6 py-12 text-center">
          <span className="text-3xl block mb-2">🕊️</span>
          <p className="text-[13.5px] font-bold text-ink-strong mb-1">소식을 불러오지 못했어요</p>
          <p className="text-[12px] text-gray-500 dark:text-white/55">
            삭제되었거나 아직 공개되지 않은 글일 수 있어요
          </p>
        </div>
      ) : (
        <article className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-card-dark border border-[var(--card-border)] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.3)]">
          <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-white/[0.02] pointer-events-none" />

          <header className="relative z-10 px-5 pt-5 pb-4 border-b border-gray-200/60 dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {news.is_pinned && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand text-white tracking-[0.04em]">
                  고정
                </span>
              )}
              {news.category && (
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand">
                  {news.category}
                </span>
              )}
              {!news.is_published && (
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-gray-500/15 border border-gray-400/30 text-gray-600 dark:text-white/60">
                  비공개
                </span>
              )}
            </div>

            <h2 className="text-ink-strong text-[19px] font-bold leading-[1.35] tracking-[-0.015em]">
              {news.title}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-gray-500 dark:text-white/50">
              <span className="font-semibold">{news.author || '관리자'}</span>
              <span className="text-gray-300 dark:text-white/20">·</span>
              <span>{formatDateTime(news.published_at)}</span>
              <span className="text-gray-300 dark:text-white/20">·</span>
              <span>조회 {news.views}</span>
            </div>
          </header>

          {/* 본문 사진 — 포스터 한 장짜리가 대부분이라 폭을 꽉 채운다 */}
          {images.length > 0 && (
            <div className="relative z-10 px-5 pt-4 space-y-2.5">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setZoom(image.url)}
                  className="block w-full overflow-hidden rounded-2xl border border-gray-200/70 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03]"
                  aria-label="사진 크게 보기"
                >
                  <img
                    src={image.url}
                    alt={news.title}
                    loading="lazy"
                    className="w-full h-auto object-contain"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="relative z-10 px-5 py-5 text-[14px] leading-[1.75] text-gray-800 dark:text-white/80 whitespace-pre-wrap break-words">
            {news.content}
          </div>

          {/* 첨부파일 — 안내문·신청서를 바로 내려받는 자리 */}
          {files.length > 0 && (
            <div className="relative z-10 px-5 pb-5">
              <p className="text-[11.5px] font-bold text-gray-500 dark:text-white/55 mb-2">
                첨부파일 {files.length}개
              </p>
              <ul className="space-y-1.5">
                {files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--card-border)] bg-gray-50 dark:bg-white/[0.03] hover:border-[var(--brand-soft-strong)] hover:bg-[var(--brand-soft)] transition-colors"
                    >
                      <span className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--brand-soft-strong)] text-brand text-[9.5px] font-bold tracking-[0.02em]">
                        {extensionOf(file)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-semibold text-ink-strong truncate">
                          {file.filename ?? '첨부파일'}
                        </span>
                        <span className="block text-[11px] text-gray-500 dark:text-white/45">
                          {formatSize(file.file_size)}
                        </span>
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gray-400 dark:text-white/40">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}

      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  )
}

/** 사진 확대 — 뒤로가기로도 닫힌다 */
const Lightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useModalBackButton(onClose)
  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <img src={src} alt="" className="max-w-full max-h-full object-contain" />
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export default NewsDetailView
