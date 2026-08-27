import { useState } from 'react'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { HandHeartIcon } from '../../../../components/icons/ActionIcons'
import ThanksAvatar from './ThanksAvatar'
import { THANKS_EMOTIONS, type Thanks } from '../../../../types/thanks'
import './thanks.css'

interface ThanksCardProps {
  thanks: Thanks
  canDelete: boolean
  onAmen: (id: number) => void
  onDelete: (id: number) => void
  variant?: 'card' | 'list' | 'timeline'
  /** 목록 등장 애니메이션 지연 (ms) */
  enterDelay?: number
}

const ThanksCard = ({
  thanks,
  canDelete,
  onAmen,
  onDelete,
  variant = 'card',
  enterDelay = 0,
}: ThanksCardProps) => {
  const { language } = useLanguage()
  const ko = language === 'ko'
  const emotion = thanks.emotion ? THANKS_EMOTIONS[thanks.emotion] : null
  const isList = variant === 'list'

  // 누를 때마다 다시 터지도록 key를 올린다
  const [popKey, setPopKey] = useState(0)

  const handleAmen = () => {
    if (!thanks.is_amened) setPopKey((k) => k + 1)
    onAmen(thanks.id)
  }

  const amenButton = (
    <button
      onClick={handleAmen}
      className="relative shrink-0 flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-full text-[12.5px] font-bold tabular-nums active:scale-95 transition-all"
      style={
        thanks.is_amened
          ? {
              background: 'var(--brand-soft-strong)',
              color: 'var(--brand)',
              border: '1px solid color-mix(in srgb, var(--brand) 45%, transparent)',
            }
          : {
              background: 'var(--surface-inset)',
              color: 'var(--text-muted)',
              border: '1px solid var(--card-border)',
            }
      }
      aria-label={ko ? '함께 감사해요' : 'Give thanks together'}
      title={ko ? '함께 감사해요' : 'Give thanks together'}
    >
      <HandHeartIcon
        size={15}
        filled={thanks.is_amened}
        className={popKey > 0 && thanks.is_amened ? 'thanks-heart-pop' : ''}
      />
      <span>{thanks.amen_count}</span>
      {popKey > 0 && thanks.is_amened && (
        <span
          key={popKey}
          className="thanks-plus-one absolute -top-1 right-2 text-[12px] font-extrabold pointer-events-none"
          style={{ color: 'var(--brand)' }}
        >
          +1
        </span>
      )}
    </button>
  )

  if (variant === 'timeline') {
    const hue = emotion?.hue ?? 'var(--brand)'
    return (
      <article
        className="thanks-card-in thanks-tl-card feed-card relative rounded-2xl"
        style={{ animationDelay: `${enterDelay}ms` }}
      >
        {/* 감정 이모지 타일 */}
        <div
          className="thanks-tl-tile"
          style={{ background: `color-mix(in srgb, ${hue} 12%, var(--surface-container))` }}
          aria-hidden
        >
          {emotion?.emoji ?? '🙏'}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] text-ink-strong leading-[1.6] break-words whitespace-pre-wrap [word-break:keep-all]">
            {thanks.content}
          </p>
          <div className="mt-2 flex items-center gap-1.5 min-w-0">
            <ThanksAvatar name={thanks.display_name} avatarUrl={thanks.avatar_url} size={20} />
            <span className="truncate text-[12px] font-semibold text-ink">{thanks.display_name}</span>
            <span className="text-[12px] text-ink-muted opacity-60">·</span>
            <span className="whitespace-nowrap text-[12px] text-ink-muted">{thanks.time_ago}</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between self-stretch shrink-0 gap-2">
          {canDelete ? (
            <button
              onClick={() => onDelete(thanks.id)}
              className="w-7 h-7 -mt-1 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label={ko ? '삭제' : 'Delete'}
            >
              <span className="material-icons-outlined text-[18px]">more_vert</span>
            </button>
          ) : (
            <span className="h-7" />
          )}
          {amenButton}
        </div>
      </article>
    )
  }

  return (
    <article
      className={`thanks-card-in feed-card relative overflow-hidden rounded-2xl transition-shadow ${
        isList ? 'p-4' : 'p-4 w-64 flex-shrink-0 snap-start'
      }`}
      style={{ animationDelay: `${enterDelay}ms` }}
    >
      {/* 감정 액센트 — 왼쪽 얇은 띠 + 모서리 후광 */}
      {emotion && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: `color-mix(in srgb, ${emotion.hue} 75%, transparent)` }}
          />
          <div
            className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: `color-mix(in srgb, ${emotion.hue} 16%, transparent)` }}
          />
        </>
      )}

      {/* 상단: 감정 배지 + 삭제 */}
      <div className="relative flex items-start justify-between gap-2 mb-2.5 min-h-[26px]">
        {emotion ? (
          <span
            className="inline-flex items-center gap-1.5 h-[26px] pl-1.5 pr-2.5 rounded-full text-[11.5px] font-bold"
            style={{
              background: `color-mix(in srgb, ${emotion.hue} 12%, transparent)`,
              color: emotion.hue,
            }}
          >
            <span className="text-[14px] leading-none">{emotion.emoji}</span>
            {ko ? emotion.label : emotion.labelEn}
          </span>
        ) : (
          <span />
        )}

        {canDelete && (
          <button
            onClick={() => onDelete(thanks.id)}
            className="shrink-0 w-7 h-7 -mt-0.5 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
            aria-label={ko ? '삭제' : 'Delete'}
          >
            <span className="material-icons-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* 본문 */}
      <p
        className={`relative text-[15px] text-ink-strong leading-[1.65] mb-3.5 break-words whitespace-pre-wrap ${
          isList ? '' : 'line-clamp-4'
        }`}
      >
        {thanks.content}
      </p>

      {/* 하단: 작성자 + 함께 감사하기 */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <ThanksAvatar
            name={thanks.display_name}
            avatarUrl={thanks.avatar_url}
            size={24}
          />
          <span className="truncate text-[12px] font-semibold text-ink">
            {thanks.display_name}
          </span>
          <span className="text-[12px] text-ink-muted opacity-60">·</span>
          <span className="whitespace-nowrap text-[12px] text-ink-muted">
            {thanks.time_ago}
          </span>
        </div>

        <button
          onClick={handleAmen}
          className="relative shrink-0 flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-full text-[12.5px] font-bold tabular-nums active:scale-95 transition-all"
          style={
            thanks.is_amened
              ? {
                  background: 'var(--brand-soft-strong)',
                  color: 'var(--brand)',
                  border: '1px solid color-mix(in srgb, var(--brand) 45%, transparent)',
                }
              : {
                  background: 'var(--surface-inset)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--card-border)',
                }
          }
          aria-label={ko ? '함께 감사해요' : 'Give thanks together'}
          title={ko ? '함께 감사해요' : 'Give thanks together'}
        >
          <HandHeartIcon
            size={15}
            filled={thanks.is_amened}
            className={popKey > 0 && thanks.is_amened ? 'thanks-heart-pop' : ''}
          />
          <span>{thanks.amen_count}</span>

          {popKey > 0 && thanks.is_amened && (
            <span
              key={popKey}
              className="thanks-plus-one absolute -top-1 right-2 text-[12px] font-extrabold pointer-events-none"
              style={{ color: 'var(--brand)' }}
            >
              +1
            </span>
          )}
        </button>
      </div>
    </article>
  )
}

export default ThanksCard
