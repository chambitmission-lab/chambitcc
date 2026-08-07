import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../../../types/event'
import { CATEGORY_VISUAL } from '../utils/categoryConfig'
import { formatDDay, formatEventTime, formatEventDateLabel } from '../utils/dateGrouping'
import { useLanguage } from '../../../contexts/LanguageContext'
import { translations } from '../../../locales'

interface EventHeroCardProps {
  event: Event
}

const EventHeroCard = ({ event }: EventHeroCardProps) => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = translations[language]
  const v = CATEGORY_VISUAL[event.category]
  const dday = formatDDay(event.start_datetime)
  const time = formatEventTime(event.start_datetime)
  const dateLabel = formatEventDateLabel(event.start_datetime)

  // 배경 로드 전엔 그라데이션만 보이다가 부드럽게 페이드인 (팝인 방지)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  useEffect(() => {
    // 캐시 히트 시 onLoad가 이미 지나갔을 수 있어 complete로 보정
    setImgLoaded(imgRef.current?.complete ?? false)
  }, [v.bg])

  return (
    <button
      type="button"
      onClick={() => navigate(`/events/${event.id}`)}
      className="mx-4 mb-4 w-[calc(100%-2rem)] text-left group block"
    >
      <div
        className={[
          'relative overflow-hidden rounded-3xl p-5',
          'bg-gradient-to-br',
          v.gradient,
          'shadow-[0_18px_44px_-18px_var(--brand-glow)]',
          // 다크: 브랜드 글로우 절제 + 1px 빛줄로 카드 경계만 살림
          'dark:border dark:border-white/10',
          'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_36px_-20px_rgba(0,0,0,0.8)]',
          'transition-transform duration-200 group-active:scale-[0.99]',
        ].join(' ')}
      >
        {/* 카테고리 배경 일러스트 — 우측 배치, 좌측은 그라데이션 여백 */}
        <img
          ref={imgRef}
          src={v.bg}
          alt=""
          aria-hidden="true"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setImgLoaded(true)}
          className={[
            'absolute inset-0 w-full h-full object-cover object-right pointer-events-none',
            'transition-opacity duration-500',
            imgLoaded ? 'opacity-100' : 'opacity-0',
            // 다크: 광량·채도를 한 단계 눌러 어두운 배경과 톤 맞춤
            'dark:brightness-[0.86] dark:saturate-[0.92]',
          ].join(' ')}
        />
        {/* 좌측·하단 스크림 — 텍스트 가독성 확보 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(20,45,120,0.42) 0%, rgba(20,45,120,0.16) 42%, rgba(20,45,120,0) 68%), linear-gradient(0deg, rgba(15,32,90,0.35) 0%, rgba(15,32,90,0) 45%)',
          }}
        />
        {/* 다크 전용 비네트 — 가장자리를 배경 쪽으로 가라앉혀 카드가 따로 놀지 않게 */}
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{
            background:
              'radial-gradient(135% 135% at 30% 20%, rgba(8,14,36,0) 45%, rgba(8,14,36,0.4) 100%)',
          }}
        />
        {/* 미세 광택 — 카드 합의안 동일 패턴 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.14) 100%)',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-white/25 backdrop-blur-sm text-white text-[12px] font-bold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {dday}
            </span>
            <span className="inline-flex items-center px-2.5 h-7 rounded-full bg-black/20 text-white text-[12px] font-semibold">
              <span className="mr-1">{v.emoji}</span>
              {t.categories[event.category]}
            </span>
          </div>

          <h2 className="text-white text-[22px] font-bold leading-[1.25] tracking-[-0.015em] mb-3 line-clamp-2">
            {event.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90 text-[13px] font-medium">
            <span className="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dateLabel} · {time}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1 max-w-[55%] truncate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-3 text-white/90 text-[12.5px] font-medium">
              <span className="inline-flex items-center gap-1">
                👥 <span>{event.attendance_count}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                👁️ <span>{event.views}</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-white text-[13px] font-bold">
              자세히 보기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default EventHeroCard
