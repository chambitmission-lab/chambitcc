import { useLanguage } from '../../../contexts/LanguageContext'
import { FEED_TEXT_SCALES, setFeedTextScale, useFeedTextScale, type FeedTextScale } from '../../../utils/feedTextScale'

// 버튼 글자 자체가 단계별로 커져서 "누르면 이만큼 커진다"가 설명 없이 보인다 (포털 글자 크기 문법).
// −/+ 대신 세 칸을 한 번에 펼친 건 몇 번 눌러야 하는지·지금이 몇 단계인지 헤아리지 않게 하려는 것.
const GLYPH_PX: Record<FeedTextScale, number> = { base: 13, large: 16, xlarge: 19 }

/** PC 전용 — 기도 피드 글씨 크기 3단계 (utils/feedTextScale.ts) */
const FeedTextScaleToggle = () => {
  const { language } = useLanguage()
  const scale = useFeedTextScale()
  const names: Record<FeedTextScale, string> =
    language === 'ko'
      ? { base: '보통', large: '크게', xlarge: '아주 크게' }
      : { base: 'Normal', large: 'Large', xlarge: 'Extra large' }

  return (
    <div className="hidden lg:flex items-center gap-2">
      <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
        {language === 'ko' ? '글씨 크기' : 'Text size'}
      </span>
      <div
        role="group"
        aria-label={language === 'ko' ? '기도 글씨 크기' : 'Prayer text size'}
        className="flex items-center gap-0.5 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.06]"
      >
        {FEED_TEXT_SCALES.map((s) => {
          const active = scale === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFeedTextScale(s)}
              aria-pressed={active}
              aria-label={names[s]}
              title={names[s]}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold leading-none transition-colors duration-150 ${
                active
                  ? 'text-brand bg-[var(--surface-container)] shadow-sm dark:bg-white/[0.12]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              style={{ fontSize: GLYPH_PX[s] }}
            >
              {language === 'ko' ? '가' : 'A'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FeedTextScaleToggle
