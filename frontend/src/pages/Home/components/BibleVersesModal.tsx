import { useEffect, useMemo, useState } from 'react'
import type { BibleVerse, RecommendedVerses } from '../../../types/prayer'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useModalBackButton } from '../../../hooks/useModalBackButton'
import { showToast } from '../../../utils/toast'
import './BibleVersesModal.css'

interface BibleVersesModalProps {
  verses: RecommendedVerses
  onClose: () => void
}

interface VerseCardProps {
  verse: BibleVerse
  index: number
  total: number
  summary: string
}

const VerseCard = ({ verse, index, total, summary }: VerseCardProps) => {
  const handleShare = async () => {
    const body =
      `📖 ${verse.reference}\n\n"${verse.text}"\n\n💡 ${verse.message}\n\n` +
      `— 참빛교회 함께 묵상 (${index + 1}/${total})\n${summary}`
    try {
      if (navigator.share) {
        await navigator.share({ title: verse.reference, text: body })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        showToast('말씀을 복사했어요', 'success')
      } else {
        showToast('이 브라우저는 공유를 지원하지 않아요', 'info')
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
      showToast('공유 중 문제가 발생했어요', 'error')
    }
  }

  return (
    <article className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-card-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-gradient-to-br from-white/[0.05] via-transparent to-white/[0.02]" />

      <div className="relative p-5">
        {/* head: index + reference */}
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-purple-300/40 dark:border-purple-500/35 text-white shadow-[0_4px_14px_rgba(168,85,247,0.35)]"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            }}
          >
            <span className="text-[13px] font-bold tabular-nums">
              {index + 1}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-300">
              SCRIPTURE · {index + 1}/{total}
            </span>
            <h3 className="m-0 text-[17px] font-bold leading-[1.3] tracking-[-0.015em] text-gray-900 dark:text-purple-50">
              {verse.reference}
            </h3>
          </div>
        </div>

        {/* serif blockquote */}
        <blockquote className="relative mb-3 pl-3">
          <span
            className="pointer-events-none absolute -top-1 -left-1 select-none text-[40px] leading-none text-purple-400/40 dark:text-purple-400/35"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            aria-hidden="true"
          >
            “
          </span>
          <p
            className="m-0 text-[15.5px] font-medium leading-[1.75] tracking-[-0.005em] text-gray-800 dark:text-purple-50/95"
            style={{
              fontFamily:
                'Georgia, "Noto Serif KR", "Times New Roman", serif',
              wordBreak: 'keep-all',
            }}
          >
            {verse.text}
          </p>
        </blockquote>

        {/* insight message */}
        <div className="bvm-insight rounded-xl px-3.5 py-3">
          <div className="flex items-start gap-2">
            <span className="material-icons-round flex-shrink-0 text-[18px] text-purple-600 dark:text-purple-300">
              auto_awesome
            </span>
            <p className="m-0 text-[13.5px] leading-[1.7] text-gray-700 dark:text-purple-100/85">
              {verse.message}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="mt-3.5 flex items-center justify-end">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-300/50 dark:border-purple-500/35 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 text-[12px] font-semibold text-purple-700 dark:text-purple-200 transition-all hover:bg-purple-100 dark:hover:bg-purple-500/20"
            aria-label="가족·소그룹에 공유"
          >
            <span className="material-icons-round text-[15px]">ios_share</span>
            공유
          </button>
        </div>
      </div>
    </article>
  )
}

const BibleVersesModal = ({ verses, onClose }: BibleVersesModalProps) => {
  const { t, language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  // 등장 애니메이션
  useEffect(() => {
    const id = window.setTimeout(() => setIsVisible(true), 30)
    return () => window.clearTimeout(id)
  }, [])

  // 브라우저 뒤로가기 → 모달만 닫기
  useModalBackButton(onClose)

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const heroTitle = useMemo(() => {
    if (language === 'en') {
      return `${verses.verses.length} verses for you`
    }
    return `당신을 위한 ${verses.verses.length}개의 말씀`
  }, [language, verses.verses.length])

  const handleShareAll = async () => {
    const lines = verses.verses
      .map(
        (v, i) =>
          `${i + 1}. ${v.reference}\n"${v.text}"\n💡 ${v.message}`,
      )
      .join('\n\n')
    const body = `📖 ${heroTitle}\n\n${verses.summary}\n\n${lines}\n\n— 참빛교회 함께 묵상`
    try {
      if (navigator.share) {
        await navigator.share({ title: heroTitle, text: body })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(body)
        showToast('말씀 묶음을 복사했어요', 'success')
      } else {
        showToast('이 브라우저는 공유를 지원하지 않아요', 'info')
      }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return
      showToast('공유 중 문제가 발생했어요', 'error')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('versesToMeditateOn')}
    >
      <div
        className={`relative w-full sm:max-w-lg max-h-[92vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-card-dark shadow-[0_-16px_60px_rgba(168,85,247,0.2)] sm:shadow-[0_24px_60px_rgba(168,85,247,0.25)] transition-all duration-300 ${
          isVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 sm:translate-y-0 sm:scale-[0.97]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle (mobile) */}
        <div
          aria-hidden="true"
          className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-gray-300/60 dark:bg-white/15 sm:hidden"
        />

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 pt-5 pb-3 bg-white/95 dark:bg-card-dark/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/[0.05]">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-purple-700 dark:text-purple-300">
            <span className="material-icons-round text-[14px]">
              auto_stories
            </span>
            함께 묵상
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShareAll}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/70 hover:border-purple-300 dark:hover:border-purple-500/35 hover:bg-purple-50 dark:hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-200 transition-all"
              aria-label="전체 묶음 공유"
              title="전체 묶음 공유"
            >
              <span className="material-icons-round text-[19px]">
                ios_share
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-white/70 hover:border-purple-300 dark:hover:border-purple-500/35 hover:bg-purple-50 dark:hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-200 transition-all"
              aria-label="닫기"
            >
              <span className="material-icons-round text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[calc(92vh-64px)] px-4 pb-8 pt-4">
          {/* Hero card */}
          <section className="bvm-hero relative mb-5 overflow-hidden rounded-2xl p-5">
            <span aria-hidden="true" className="bvm-hero-accent-line" />

            <div className="relative flex items-start gap-3">
              <div className="bvm-hero-emblem flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full">
                <span className="material-icons-round text-[22px]">
                  auto_stories
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="bvm-hero-label inline-block rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-[0.08em]">
                  TODAY · 함께 묵상
                </span>
                <h2
                  className="bvm-hero-title mt-1.5 text-[20px] font-bold leading-[1.3] tracking-[-0.015em]"
                  style={{ wordBreak: 'keep-all' }}
                >
                  {heroTitle}
                </h2>
              </div>
            </div>

            {verses.summary && (
              <p
                className="bvm-hero-summary relative mt-3.5 mb-0 text-[14px] leading-[1.7]"
                style={{ wordBreak: 'keep-all' }}
              >
                {verses.summary}
              </p>
            )}

            <div className="bvm-hero-divider relative mt-4 flex items-center gap-2 pt-3">
              <span className="bvm-hero-stat-label text-[12px] font-semibold">
                <span
                  className="font-bold tabular-nums text-[14px]"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {verses.verses.length}
                </span>{' '}
                개의 말씀이 준비되어 있어요
              </span>
            </div>
          </section>

          {/* Verse cards */}
          <div className="space-y-3">
            {verses.verses.map((verse, index) => (
              <VerseCard
                key={index}
                verse={verse}
                index={index}
                total={verses.verses.length}
                summary={verses.summary}
              />
            ))}
          </div>

          {/* Footer hint */}
          <p className="mt-6 text-center text-[11.5px] text-gray-400 dark:text-white/40">
            잠시 멈춰서, 한 절씩 천천히 묵상해보세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BibleVersesModal
