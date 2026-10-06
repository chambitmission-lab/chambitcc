import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import BibleVersesModal from '../BibleVersesModal'
import { usePrayerComposer } from './usePrayerComposer'
import { useLanguage } from '../../../../contexts/LanguageContext'
import { useMyGroups } from '../../../../hooks/useGroups'
import { useSpeechRecognition } from '../../../../hooks/useSpeechRecognition'
import { showToast } from '../../../../utils/toast'
import type { PrayerEmotion } from '../../../../types/prayer'
import type { PrayerComposerProps } from './types'
import { PastorIcon, PrayIcon } from '../EmotionIcons'
import { EmotionGlyph } from '../EmotionGlyph'
import { ClosetIcon, DiceIcon, EyeIcon, GlobeIcon, LockIcon } from './composerIcons'
import { GroupGlyph } from '../../../Groups/GroupIcons'
import { VerseSlashPanel } from './VerseSlashPanel'
import { findSlashMatch, useVerseSlash } from './verseSlash'
import '../ThanksThread/thanks.css'

const MAX_LEN = 1000
const TITLE_MAX = 100

/* 헤더 부제 — 열 때마다 바뀌는 한 줄. "이런 것도 기도해도 되나?"를 미리 풀어준다 */
const SUBTITLES = {
  ko: [
    '혼자 들고 있지 않아도 괜찮아요',
    '짧아도 괜찮아요. 하나님은 다 아세요',
    '적는 순간, 이미 기도가 시작돼요',
    '어떤 마음이든 그대로 꺼내놓아도 돼요',
    '무거운 건 여기 내려놓고 가세요',
  ],
  en: [
    'You don’t have to carry it alone',
    'Short is fine — God knows the rest',
    'The moment you write, prayer has begun',
    'Bring your heart just as it is',
    'Set the heavy things down here',
  ],
}

/* 예시 문장 — "아, 이 정도로 써도 되네" 하게 만드는 것들 */
const PLACEHOLDERS = {
  ko: [
    '예: 이번 주 면접이 있어요. 담대한 마음을 주시길…',
    '예: 아버지 수술이 잘 되도록 함께 기도해주세요',
    '예: 요즘 마음이 자꾸 조급해져요. 평안을 구합니다',
    '예: 아이가 새 학교에 잘 적응하게 해주세요',
    '예: 말로 다 못 해도 괜찮아요. 지금 마음 그대로면 돼요',
    '예: 무엇을 구해야 할지 모르겠어요. 그래도 함께해주세요',
  ],
  en: [
    'e.g., I have an interview this week. Praying for courage…',
    'e.g., Please pray for my father’s surgery to go well',
    'e.g., My heart keeps rushing lately. I’m asking for peace',
    'e.g., Help my child settle into the new school',
    'e.g., Words don’t have to be perfect — just as you are',
    'e.g., I don’t know what to ask. Please pray with me anyway',
  ],
}

/* 기도 씨앗 — 첫 문장이 안 떠오를 때 눌러서 시작하는 문장 머리 */
const SEEDS = {
  ko: [
    '하나님, 요즘 ',
    '솔직히 말하면 ',
    '함께 기도해주세요. ',
    '감사하게도 ',
    '두렵지만 ',
    '가족을 위해 ',
    '지혜가 필요해요. ',
    '이 마음을 맡깁니다. ',
    '건강을 위해 ',
  ],
  en: [
    'God, lately ',
    'Honestly, ',
    'Please pray with me. ',
    'Gratefully, ',
    'I’m afraid, but ',
    'For my family, ',
    'I need wisdom. ',
    'I leave this with You. ',
    'For health, ',
  ],
}

/* 마음 타일 — 주간 기도 스토리용 감정 태그에 색과 한 줄 힌트를 입힌다 */
/* 감정 마크는 EmotionGlyph(Phosphor duotone) 로 그린다 — 회색조 얼굴 이모지가
   기도 화면 톤과 겉돌아 아이콘으로 교체(감사 화면과 같은 문법).
   emoji 는 아이콘 매핑이 없을 때의 fallback + 올리기 순간의 축포 입자에만 쓴다. */
const EMOTIONS: Array<{
  key: PrayerEmotion
  emoji: string
  label: string
  labelEn: string
  hue: string
  hint: string
  hintEn: string
}> = [
  { key: 'anxious', emoji: '😟', label: '불안', labelEn: 'Anxious', hue: '#a06ff0', hint: '마음이 자꾸 두근거릴 때', hintEn: 'When your heart won’t settle' },
  { key: 'tired', emoji: '😮‍💨', label: '지침', labelEn: 'Weary', hue: '#7d8fa5', hint: '기댈 곳이 필요한 하루', hintEn: 'A day that needs a place to lean' },
  { key: 'sad', emoji: '😢', label: '슬픔', labelEn: 'Sad', hue: '#4593fc', hint: '눈물이 나도 괜찮아요', hintEn: 'Tears are welcome here' },
  { key: 'lonely', emoji: '🥺', label: '외로움', labelEn: 'Lonely', hue: '#8f7ff2', hint: '혼자라고 느껴지는 요즘', hintEn: 'When it feels like just you' },
  { key: 'angry', emoji: '😠', label: '분노', labelEn: 'Angry', hue: '#ef6f5e', hint: '삭이기 힘든 마음 그대로', hintEn: 'Bring it just as it burns' },
  { key: 'confused', emoji: '😵‍💫', label: '혼란', labelEn: 'Lost', hue: '#2fa8a0', hint: '길이 잘 안 보일 때', hintEn: 'When the road is hard to see' },
  { key: 'hopeful', emoji: '🌱', label: '소망', labelEn: 'Hopeful', hue: '#35b183', hint: '작은 빛을 붙들고 싶을 때', hintEn: 'Holding on to a small light' },
  { key: 'grateful', emoji: '🙏', label: '감사', labelEn: 'Grateful', hue: '#f2a13c', hint: '감사가 스며든 기도', hintEn: 'A prayer soaked in thanks' },
]

const BURST_EMOJIS = ['🙏', '🕊️', '✨', '💛', '🌱', '💗', '☁️', '🌟']

const pickRandom = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

const pickSeeds = (pool: string[], count = 3): string[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

interface BurstPiece {
  emoji: string
  style: CSSProperties
}

const makeBurst = (accent: string): BurstPiece[] =>
  Array.from({ length: 14 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4
    const distance = 90 + Math.random() * 110
    return {
      emoji: i % 3 === 0 ? accent : pickRandom(BURST_EMOJIS),
      style: {
        '--bx': `${Math.cos(angle) * distance}px`,
        '--by': `${Math.sin(angle) * distance - 40}px`,
        '--bs': `${0.9 + Math.random() * 0.8}`,
        '--br': `${Math.round((Math.random() - 0.5) * 120)}deg`,
        animationDelay: `${i * 18}ms`,
      } as CSSProperties,
    }
  })

const PrayerComposer = ({ onClose, onSuccess, sort = 'popular', groupId }: PrayerComposerProps) => {
  const { t, language } = useLanguage()
  const ko = language === 'ko'
  const {
    title,
    content,
    isAnonymous,
    isPrivate,
    sharedWithPastor,
    selectedGroupId,
    emotion,
    error,
    recommendedVerses,
    showVersesModal,
    celebrating,
    createdPrayerId,
    isCreating,
    isLoggedIn,
    displayName,
    avatarUrl,
    setTitle,
    setContent,
    setIsAnonymous,
    setIsPrivate,
    setSharedWithPastor,
    setSelectedGroupId,
    setEmotion,
    handleSubmit,
    handleVersesModalClose,
  } = usePrayerComposer({ onClose, onSuccess, sort, groupId })

  const { data: groupsData } = useMyGroups()
  const groups = groupsData?.data.items || []

  const [showTitle, setShowTitle] = useState(false)
  const [seeds, setSeeds] = useState(() => pickSeeds(SEEDS[ko ? 'ko' : 'en']))
  const [rolling, setRolling] = useState(false)
  const [burst, setBurst] = useState<BurstPiece[] | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceActiveRef = useRef(false)

  // 열릴 때 한 번만 뽑는다 — 타이핑 중에 문구가 바뀌면 정신없다
  const subtitle = useMemo(() => pickRandom(SUBTITLES[ko ? 'ko' : 'en']), [ko])
  const placeholder = useMemo(() => pickRandom(PLACEHOLDERS[ko ? 'ko' : 'en']), [ko])

  const meta = emotion ? EMOTIONS.find((e) => e.key === emotion) ?? null : null
  const accent = meta?.hue ?? 'var(--brand)'

  // 음성 입력 — 제목·본문 각각. 한쪽을 켜면 다른 쪽은 끈다 (마이크는 하나)
  // 인식 언어는 앱 언어를 따라간다 — 영어 모드에서 한국어 고정이면 엉뚱한 한글이 찍힌다
  const voiceLang = ko ? 'ko-KR' : 'en-US'
  const contentVoice = useSpeechRecognition({
    onResult: (transcript: string) => setContent(transcript),
    onError: (msg: string) => showToast(msg, 'error'),
    language: voiceLang,
    continuous: true,
  })
  const titleVoice = useSpeechRecognition({
    onResult: (transcript: string) => setTitle(transcript.slice(0, TITLE_MAX)),
    onError: (msg: string) => showToast(msg, 'error'),
    language: voiceLang,
    continuous: true,
  })

  const toggleVoice = () => {
    if (contentVoice.isListening) {
      contentVoice.stopListening()
      voiceActiveRef.current = false
    } else {
      if (titleVoice.isListening) titleVoice.stopListening()
      voiceActiveRef.current = true
      contentVoice.startListening(content)
    }
  }

  const toggleTitleVoice = () => {
    if (titleVoice.isListening) {
      titleVoice.stopListening()
    } else {
      if (contentVoice.isListening) {
        contentVoice.stopListening()
        voiceActiveRef.current = false
      }
      titleVoice.startListening(title)
    }
  }

  const handleManualContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (voiceActiveRef.current && contentVoice.isListening) return
    setContent(e.target.value.slice(0, MAX_LEN))
    setCaret(e.target.selectionStart ?? e.target.value.length)
  }

  // ── "/말씀" 넣기 — `/창 1:1` 을 치면 아래에 구절 미리보기, Enter·탭으로 본문에 넣는다 ──
  const [caret, setCaret] = useState(0)
  const [slashDismissedAt, setSlashDismissedAt] = useState<number | null>(null)
  const slashMatch = useMemo(() => {
    if (contentVoice.isListening) return null
    const m = findSlashMatch(content, caret)
    return m && m.start !== slashDismissedAt ? m : null
  }, [content, caret, slashDismissedAt, contentVoice.isListening])
  const slash = useVerseSlash(slashMatch?.query ?? null)

  const syncCaret = (e: React.SyntheticEvent<HTMLTextAreaElement>) =>
    setCaret(e.currentTarget.selectionStart ?? 0)

  const insertSlashVerse = () => {
    if (!slashMatch || slash?.kind !== 'ready') return
    const head = content.slice(0, slashMatch.start)
    const tail = content.slice(caret)
    const piece = tail.startsWith(' ') || tail.startsWith('\n') ? slash.insert : `${slash.insert} `
    if (head.length + piece.length + tail.length > MAX_LEN) {
      showToast(ko ? '글자 수가 넘쳐서 말씀을 넣지 못했어요' : 'Too long to insert this verse', 'error')
      return
    }
    const next = head + piece + tail
    const pos = head.length + piece.length
    setContent(next)
    setCaret(pos)
    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(pos, pos)
    })
  }

  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashMatch || e.nativeEvent.isComposing) return
    if (e.key === 'Escape') {
      // 모달 닫기(Esc)보다 말씀 찾기 닫기가 먼저
      e.preventDefault()
      e.stopPropagation()
      setSlashDismissedAt(slashMatch.start)
    } else if (e.key === 'Enter' && !e.shiftKey && slash?.kind === 'ready') {
      e.preventDefault()
      insertSlashVerse()
    }
  }

  // 도구줄 "말씀 넣기" — 커서 자리에 '/' 를 넣어 같은 흐름을 연다(한글 자판에서 '/' 찾기 번거로움)
  const startVerseSlash = () => {
    const el = textareaRef.current
    const at = el ? el.selectionStart ?? content.length : content.length
    const before = content.slice(0, at)
    const lead = before && !/\s$/.test(before) ? ' ' : ''
    const piece = `${lead}/`
    if (content.length + piece.length > MAX_LEN) return
    const pos = at + piece.length
    setContent(before + piece + content.slice(at))
    setCaret(pos)
    setSlashDismissedAt(null)
    requestAnimationFrame(() => {
      const node = textareaRef.current
      if (!node) return
      node.focus()
      node.setSelectionRange(pos, pos)
    })
  }

  const handleManualTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (titleVoice.isListening) return
    setTitle(e.target.value.slice(0, TITLE_MAX))
  }

  // 등록 성공 → 폭죽 + 토스트 (닫기는 훅이 780ms 뒤에 처리)
  useEffect(() => {
    if (!celebrating) return
    if (contentVoice.isListening) contentVoice.stopListening()
    if (titleVoice.isListening) titleVoice.stopListening()
    setBurst(makeBurst(meta?.emoji ?? '🙏'))
    showToast(
      isPrivate
        ? t('privatePrayerSaved')
        : ko ? '기도제목을 나눴어요 🙏' : 'Your prayer is shared 🙏',
      'success',
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrating])

  const rollSeeds = () => {
    setSeeds(pickSeeds(SEEDS[ko ? 'ko' : 'en']))
    setRolling(true)
    window.setTimeout(() => setRolling(false), 500)
  }

  const applySeed = (seed: string) => {
    const base = content.trim() ? `${content.trimEnd()} ${seed}` : seed
    setContent(base.slice(0, MAX_LEN))
    textareaRef.current?.focus()
  }

  const handleRemoveTitle = () => {
    if (titleVoice.isListening) titleVoice.stopListening()
    setTitle('')
    setShowTitle(false)
  }

  const ratio = Math.min(1, content.length / MAX_LEN)
  const nearLimit = MAX_LEN - content.length <= 50
  const canSubmit = content.trim().length > 0 && !isCreating && !celebrating

  const RING_R = 9
  const RING_C = 2 * Math.PI * RING_R

  const anonymousName = t('anonymousDisplayName')
  const previewName = isAnonymous ? anonymousName : displayName
  // 정말 나만 보는 기도 — '목사님과 함께'는 isPrivate 이면서도 읽는 사람(목사님)이 있다
  const onlyMe = isPrivate && !sharedWithPastor

  return (
    <>
      {/* 성경 구절 모달 */}
      {showVersesModal && recommendedVerses && (
        <BibleVersesModal
          verses={recommendedVerses}
          authorName={displayName}
          prayerId={createdPrayerId ?? undefined}
          onClose={handleVersesModalClose}
        />
      )}

      {/* 작성 중 실수로 닫히지 않도록 배경 클릭으로는 닫지 않는다(X·다음에·뒤로가기만) */}
      {/* PC(lg+)에선 노안 성도를 위해 화면을 거의 다 쓰는 큰 작성 화면으로 펼친다 —
          글씨·버튼·타일을 키우고, 작성 칸이 남는 높이를 전부 차지한다. 모바일은 그대로 */}
      <div className="thanks-backdrop fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] sm:p-4 lg:p-6 overflow-hidden">
        <div
          className="thanks-sheet relative w-full sm:max-w-[440px] lg:max-w-[1320px] lg:w-[calc(94vw/var(--az,1))] max-h-[92vh] lg:max-h-none lg:h-[calc(92vh/var(--az,1))] lg:flex lg:flex-col overflow-y-auto overflow-x-hidden rounded-t-[28px] sm:rounded-[24px] border border-[var(--card-border)] bg-[var(--surface-container)] shadow-[0_-18px_50px_rgba(0,0,0,0.30)] sm:shadow-[var(--card-shadow)]"
          role="dialog"
          aria-modal="true"
        >
          {/* 손잡이 — 시트라는 걸 알려주는 표시 */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--text-muted)', opacity: 0.35 }}
            />
          </div>

          {/* 헤더 */}
          <div className="px-5 lg:px-10 pt-2.5 lg:pt-7 pb-3 lg:pb-5 flex items-start justify-between gap-3 lg:shrink-0">
            <div className="min-w-0">
              <h2 className="text-[19px] lg:text-[28px] font-extrabold tracking-[-0.02em] text-ink-strong">
                {ko ? '기도제목 나누기' : 'Share a prayer request'}
              </h2>
              <p className="mt-0.5 lg:mt-1.5 text-[12.5px] lg:text-[16px] leading-snug text-ink-muted">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={ko ? '닫기' : 'Close'}
              className="shrink-0 w-9 h-9 lg:w-12 lg:h-12 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
            >
              <span className="material-icons-outlined text-[22px] lg:text-[30px]">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="lg:flex-1 lg:flex lg:flex-col">
            {/* PC에선 좌(미리보기·설정) / 우(작성) 2단으로 펼친다. 우측 작성 칸은 높이를 끝까지 채운다 */}
            <div className="lg:flex-1 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:px-10 lg:pt-1 lg:items-stretch">
              <div className="lg:min-w-0">
                {/* 미리보기 — 지금 쓰는 게 피드에 어떻게 보일지 실시간으로 */}
                <div className="px-5 lg:px-0">
                  <div
                    className="relative overflow-hidden rounded-2xl border p-4 lg:p-6 transition-colors duration-300"
                    style={{
                      borderColor: meta
                        ? `color-mix(in srgb, ${accent} 32%, transparent)`
                        : 'var(--card-border)',
                      background: meta
                        ? `color-mix(in srgb, ${accent} 8%, var(--surface-inset))`
                        : 'var(--surface-inset)',
                    }}
                  >
                    <span className="absolute right-3 top-3 lg:right-5 lg:top-4 text-[9.5px] lg:text-[13px] font-bold tracking-[0.1em] text-ink-muted">
                      {ko ? '미리보기' : 'PREVIEW'}
                    </span>

                    <div className="flex items-start gap-3 lg:gap-4">
                      <div
                        className="shrink-0 w-11 h-11 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-[22px] transition-all duration-300 lg:[&_svg]:w-[28px] lg:[&_svg]:h-[28px]"
                        style={{
                          background: meta
                            ? `color-mix(in srgb, ${accent} 18%, transparent)`
                            : 'var(--surface-container-high)',
                          boxShadow: meta
                            ? `0 6px 16px color-mix(in srgb, ${accent} 22%, transparent)`
                            : 'none',
                        }}
                      >
                        {meta ? (
                          <span
                            key={emotion}
                            className="thanks-swap inline-flex leading-none"
                            style={{ color: accent }}
                          >
                            <EmotionGlyph emotion={meta.key} fallback={meta.emoji} size={22} />
                          </span>
                        ) : (
                          <span className="thanks-nudge inline-flex leading-none text-ink-muted opacity-45">
                            <PrayIcon size={22} />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        {title.trim() && (
                          <p className="text-[14.5px] lg:text-[18px] font-bold leading-snug text-ink-strong break-words line-clamp-1 mb-0.5">
                            {title}
                          </p>
                        )}
                        {content.trim() ? (
                          <p className="text-[14.5px] lg:text-[17px] leading-[1.6] text-ink-strong break-words whitespace-pre-wrap line-clamp-3">
                            {content}
                          </p>
                        ) : (
                          <p className="text-[14px] lg:text-[17px] leading-[1.6] text-ink-muted">
                            {ko ? '여기에 오늘의 기도가 담겨요' : 'Your prayer will show up here'}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] lg:text-[14.5px] text-ink-muted lg:[&>span:first-child]:w-7 lg:[&>span:first-child]:h-7 lg:[&>img]:w-7 lg:[&>img]:h-7">
                          {onlyMe ? (
                            <>
                              <span
                                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--brand-soft-strong)', color: 'var(--brand)' }}
                              >
                                <LockIcon size={12} />
                              </span>
                              <span key="private" className="thanks-swap truncate font-semibold text-brand">
                                {t('privatePrayerPreviewName')}
                              </span>
                              <span className="opacity-60">·</span>
                              <span>{ko ? '방금' : 'just now'}</span>
                            </>
                          ) : isAnonymous || !avatarUrl ? (
                            <span
                              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[12px]"
                              style={{
                                background: isAnonymous
                                  ? 'var(--surface-container-high)'
                                  : 'var(--brand)',
                                color: isAnonymous ? 'var(--text-muted)' : 'var(--on-brand)',
                                fontWeight: 700,
                                fontSize: isAnonymous ? '12px' : '10px',
                              }}
                            >
                              {isAnonymous ? <ClosetIcon size={12} /> : previewName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <img
                              src={avatarUrl}
                              alt=""
                              className="shrink-0 w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          {!onlyMe && (
                            <>
                              <span key={previewName} className="thanks-swap truncate font-semibold">
                                {previewName}
                              </span>
                              <span className="opacity-60">·</span>
                              <span>{ko ? '방금' : 'just now'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 공개 범위 — 전체 공개 / 나만 보기 / 목사님과 함께 / 소그룹. 하나만 고른다 */}
                  <div className="mt-3 lg:mt-7 flex items-center justify-between">
                    <span className="text-[11.5px] lg:text-[17px] font-bold text-ink-strong">{t('prayerVisibilityLabel')}</span>
                  </div>
                  <div className="mt-1.5 lg:mt-3 flex flex-wrap items-center gap-1.5 lg:gap-2.5 lg:[&>button]:px-5 lg:[&>button]:py-3 lg:[&>button]:text-[16px] lg:[&>button]:gap-2 lg:[&_svg]:w-[19px] lg:[&_svg]:h-[19px]">
                    {[
                      { key: 'public', Icon: GlobeIcon, label: t('prayerVisibilityPublic'), active: !isPrivate && selectedGroupId === null, onClick: () => { setIsPrivate(false); setSelectedGroupId(null) } },
                      { key: 'private', Icon: LockIcon, label: t('prayerVisibilityPrivate'), active: onlyMe, onClick: () => setIsPrivate(true), tooltip: t('privateChipTooltip') },
                      { key: 'pastor', Icon: PastorIcon, label: t('prayerVisibilityPastor'), active: sharedWithPastor, onClick: setSharedWithPastor, tooltip: t('pastorChipTooltip'), lockBadge: true },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={opt.onClick}
                        aria-pressed={opt.active}
                        title={opt.tooltip}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all active:scale-95 ${
                          opt.active
                            ? 'border-transparent bg-brand text-[var(--on-brand)] shadow-[0_4px_12px_var(--brand-glow)]'
                            : 'text-ink-muted hover:text-brand'
                        }`}
                        style={
                          opt.active
                            ? undefined
                            : opt.tooltip
                              // 비밀 칩(나만 보기·목사님과 함께) — 고르기 전에도 은은한 브랜드 테두리로 구분
                              ? { borderColor: 'color-mix(in srgb, var(--brand) 30%, var(--card-border))', background: 'color-mix(in srgb, var(--brand) 5%, var(--surface-inset))' }
                              : { borderColor: 'var(--card-border)', background: 'var(--surface-inset)' }
                        }
                      >
                        {opt.lockBadge ? (
                          // 목사님 아이콘 + 작은 자물쇠 — 목사님만 읽는 비밀 기도라는 표시
                          <span className="relative inline-flex">
                            <opt.Icon size={14} />
                            <span
                              className="absolute -right-1.5 -bottom-1 w-[11px] h-[11px] lg:w-[13px] lg:h-[13px] rounded-full flex items-center justify-center lg:[&_svg]:!w-[9px] lg:[&_svg]:!h-[9px]"
                              style={{
                                background: opt.active ? 'var(--on-brand)' : 'var(--brand)',
                                color: opt.active ? 'var(--brand)' : 'var(--on-brand)',
                              }}
                            >
                              <LockIcon size={7} />
                            </span>
                          </span>
                        ) : (
                          <opt.Icon size={14} />
                        )}
                        <span className={opt.lockBadge ? 'ml-0.5' : undefined}>{opt.label}</span>
                      </button>
                    ))}

                    {groups.map((group) => {
                      const active = selectedGroupId === group.id
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setSelectedGroupId(active ? null : group.id)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all active:scale-95 ${
                            active
                              ? 'border-transparent bg-brand text-[var(--on-brand)] shadow-[0_4px_12px_var(--brand-glow)]'
                              : 'text-ink-muted hover:text-brand'
                          }`}
                          style={
                            active
                              ? undefined
                              : { borderColor: 'var(--card-border)', background: 'var(--surface-inset)' }
                          }
                        >
                          <GroupGlyph emoji={group.icon} size={14} className="shrink-0" />
                          {group.name}
                        </button>
                      )
                    })}

                    {/* 골방 기도자(익명) — 남에게 보이는 기도일 때만 의미가 있다 (목사님께도 가릴 수 있다) */}
                    {isLoggedIn && !onlyMe && (
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        aria-pressed={isAnonymous}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed text-[12px] font-semibold transition-all active:scale-95 ${
                          isAnonymous ? 'text-brand border-brand' : 'text-ink-muted hover:text-brand'
                        }`}
                        style={{
                          borderColor: isAnonymous ? undefined : 'var(--card-border)',
                          background: isAnonymous ? 'var(--brand-soft)' : 'var(--surface-inset)',
                        }}
                      >
                        {isAnonymous ? <ClosetIcon size={14} /> : <EyeIcon size={14} />}
                        {t('prayerComposerAnonymous')}
                      </button>
                    )}
                  </div>

                  <p
                    key={sharedWithPastor ? (isAnonymous ? 'pastor-anon' : 'pastor-real') : isPrivate ? 'private' : selectedGroupId ? 'group' : isAnonymous ? 'anon' : 'real'}
                    className="thanks-swap mt-1.5 lg:mt-3 text-[11px] lg:text-[14.5px] leading-snug"
                    style={{ color: isPrivate ? 'var(--brand)' : 'var(--text-muted)' }}
                  >
                    {sharedWithPastor
                      ? isAnonymous
                        ? t('pastorPrayerNoticeAnonymous')
                        : t('pastorPrayerNoticeRealName')
                      : isPrivate
                      ? t('privatePrayerNotice')
                      : selectedGroupId
                        ? ko
                          ? '이 소그룹에만 보여요'
                          : 'Visible to this group only'
                        : isAnonymous
                          ? t('anonymousNotice')
                          : t('realNameNotice')}
                  </p>

                  {/* 비밀 기도 안내 — 공개로 두고 있을 때만. 은밀한 기도제목이 있는 성도가 '목사님과 함께'를 바로 찾도록 */}
                  {!isPrivate && (
                    <button
                      type="button"
                      onClick={setSharedWithPastor}
                      className="mt-2 lg:mt-3.5 w-full flex items-start gap-2 lg:gap-3 rounded-xl px-3 py-2 lg:px-4 lg:py-3 text-left transition-colors hover:bg-[var(--brand-soft)]"
                      style={{ background: 'color-mix(in srgb, var(--brand) 6%, var(--surface-inset))' }}
                    >
                      <span className="shrink-0 mt-px inline-flex text-brand lg:[&_svg]:w-[18px] lg:[&_svg]:h-[18px]">
                        <LockIcon size={13} />
                      </span>
                      <span className="text-[11px] lg:text-[14.5px] leading-snug text-ink-muted">
                        {t('secretPrayerHintBefore')}
                        <b className="font-bold text-brand">{t('prayerVisibilityPastor')}</b>
                        {t('secretPrayerHintAfter')}
                      </span>
                    </button>
                  )}
                </div>

                {/* 오늘의 마음 */}
                <div className="px-5 lg:px-0 pt-4 lg:pt-8">
                  <div className="flex items-baseline justify-between mb-2.5 lg:mb-3.5">
                    <label className="text-[12.5px] lg:text-[17px] font-bold tracking-[-0.01em] text-ink-strong">
                      {ko ? '지금 마음은 어떠세요?' : 'How is your heart?'}
                    </label>
                    <span className="text-[11px] lg:text-[14px] text-ink-muted">
                      {ko ? '골라도 되고 안 골라도 돼요' : 'optional'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 lg:gap-3">
                    {EMOTIONS.map((item) => {
                      const active = emotion === item.key
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setEmotion(active ? null : item.key)}
                          aria-pressed={active}
                          className="group flex flex-col items-center gap-1 lg:gap-2 py-2.5 lg:py-4 rounded-2xl border transition-all active:scale-95 lg:[&_svg]:w-[34px] lg:[&_svg]:h-[34px]"
                          style={
                            active
                              ? {
                                  borderColor: `color-mix(in srgb, ${item.hue} 55%, transparent)`,
                                  background: `color-mix(in srgb, ${item.hue} 14%, transparent)`,
                                  boxShadow: `0 6px 16px color-mix(in srgb, ${item.hue} 22%, transparent)`,
                                }
                              : {
                                  borderColor: 'var(--card-border)',
                                  background: 'var(--surface-inset)',
                                }
                          }
                        >
                          <span
                            className={`inline-flex leading-none transition-all ${
                              active ? 'thanks-pop' : 'opacity-55 group-hover:opacity-100'
                            }`}
                            style={{ color: active ? item.hue : 'var(--text-muted)' }}
                          >
                            <EmotionGlyph emotion={item.key} fallback={item.emoji} size={24} />
                          </span>
                          <span
                            className="text-[10.5px] lg:text-[15.5px] font-bold"
                            style={{ color: active ? item.hue : 'var(--text-muted)' }}
                          >
                            {ko ? item.label : item.labelEn}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <p
                    key={emotion ?? 'none'}
                    className="thanks-swap mt-2 lg:mt-3 text-[12px] lg:text-[15px] leading-snug"
                    style={{ color: meta ? accent : 'var(--text-muted)' }}
                  >
                    {meta
                      ? ko
                        ? meta.hint
                        : meta.hintEn
                      : ko
                        ? '골라두면 주간 기도 스토리에 마음의 흐름이 담겨요'
                        : 'Pick one — it shapes your weekly prayer story'}
                  </p>
                </div>
              </div>

              <div className="lg:min-w-0 lg:flex lg:flex-col">
                {/* 기도 내용 — PC에선 남는 높이를 전부 채운다 */}
                <div className="px-5 lg:px-0 pt-4 lg:pt-0 lg:flex-1 lg:flex lg:flex-col">
                  <div
                    className="rounded-2xl border px-4 pt-3.5 pb-2.5 lg:px-7 lg:pt-5 lg:pb-4 lg:flex-1 lg:flex lg:flex-col transition-colors focus-within:border-brand lg:focus-within:shadow-[0_0_0_3px_var(--brand-soft)]"
                    style={{ background: 'var(--surface-inset)', borderColor: 'var(--card-border)' }}
                  >
                    {/* 제목은 선택 — 기본은 숨기고 칩으로 필요할 때만 펼친다 */}
                    {showTitle ? (
                      <div className="flex items-center gap-1.5 mb-2 pb-2 lg:mb-3 lg:pb-3 border-b border-[var(--card-border)] lg:[&>button]:w-10 lg:[&>button]:h-10 lg:[&_.material-icons-outlined]:text-[22px]">
                        <input
                          type="text"
                          value={title}
                          onChange={handleManualTitleChange}
                          placeholder={t('prayerComposerTitlePlaceholder')}
                          maxLength={TITLE_MAX}
                          autoFocus
                          className={`flex-1 min-w-0 bg-transparent outline-none text-[15.5px] lg:text-[21px] font-bold tracking-[-0.015em] text-ink-strong placeholder:text-[13px] lg:placeholder:text-[17px] placeholder:font-normal placeholder:text-ink-muted ${
                            titleVoice.isListening ? 'animate-pulse' : ''
                          }`}
                        />
                        {titleVoice.isSupported && (
                          <button
                            type="button"
                            onClick={toggleTitleVoice}
                            aria-label={
                              titleVoice.isListening ? t('stopVoiceInput') : t('startVoiceInput')
                            }
                            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                              titleVoice.isListening
                                ? 'text-red-500 bg-red-500/10 animate-pulse'
                                : 'text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)]'
                            }`}
                          >
                            <span className="material-icons-outlined text-[16px]">
                              {titleVoice.isListening ? 'stop_circle' : 'mic'}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveTitle}
                          aria-label={t('prayerComposerRemoveTitle')}
                          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                        >
                          <span className="material-icons-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowTitle(true)}
                        className="self-start inline-flex items-center gap-0.5 lg:gap-1 mb-1 lg:mb-2 -ml-1 lg:-ml-2 px-2 py-1 lg:px-3 lg:py-2 rounded-full text-[11.5px] lg:text-[15.5px] font-semibold text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors"
                      >
                        <span className="material-icons-outlined text-[13px] lg:text-[19px]">add</span>
                        {t('prayerComposerAddTitle')} {t('prayerComposerTitleOptional')}
                      </button>
                    )}

                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleManualContentChange}
                      onKeyDown={handleContentKeyDown}
                      onSelect={syncCaret}
                      onClick={syncCaret}
                      rows={4}
                      maxLength={MAX_LEN}
                      placeholder={placeholder}
                      className={`w-full bg-transparent resize-none outline-none text-[15px] lg:text-[20px] leading-[1.65] lg:leading-[1.8] text-ink-strong placeholder:text-[13.5px] lg:placeholder:text-[17px] placeholder:text-ink-muted lg:flex-1 lg:min-h-[260px] ${
                        contentVoice.isListening ? 'animate-pulse' : ''
                      }`}
                    />

                    {slash && (
                      <VerseSlashPanel
                        state={slash}
                        ko={ko}
                        onInsert={insertSlashVerse}
                        onDismiss={() => slashMatch && setSlashDismissedAt(slashMatch.start)}
                      />
                    )}

                    <div className="flex items-center justify-between pt-1 lg:pt-3">
                      <div className="flex items-center gap-0.5 lg:gap-2 -ml-1">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={startVerseSlash}
                        title={ko ? '본문에 / 를 치고 창 1:1 처럼 적어도 돼요' : 'Or type / then a reference like 창 1:1'}
                        className="inline-flex items-center gap-1 lg:gap-1.5 px-2 py-1 lg:px-4 lg:py-2.5 rounded-full text-[11.5px] lg:text-[16px] font-semibold transition-colors lg:border lg:border-[var(--card-border)] text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)]"
                      >
                        <span className="material-icons-outlined text-[15px] lg:text-[21px]">menu_book</span>
                        {ko ? '말씀 넣기' : 'Add verse'}
                      </button>
                      {contentVoice.isSupported ? (
                        <button
                          type="button"
                          onClick={toggleVoice}
                          className={`inline-flex items-center gap-1 lg:gap-1.5 px-2 py-1 lg:px-4 lg:py-2.5 rounded-full text-[11.5px] lg:text-[16px] font-semibold transition-colors lg:border lg:border-[var(--card-border)] ${
                            contentVoice.isListening
                              ? 'text-red-500 bg-red-500/10 animate-pulse'
                              : 'text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)]'
                          }`}
                        >
                          <span className="material-icons-outlined text-[15px] lg:text-[21px]">
                            {contentVoice.isListening ? 'stop_circle' : 'mic'}
                          </span>
                          {contentVoice.isListening
                            ? ko
                              ? '듣고 있어요…'
                              : 'Listening…'
                            : ko
                              ? '말로 하기'
                              : 'Speak'}
                        </button>
                      ) : (
                        <span className="hidden sm:inline text-[11.5px] lg:text-[15px] text-ink-muted">
                          {ko ? '길게 써도, 한 줄만 써도 돼요' : 'Long or short — both are fine'}
                        </span>
                      )}
                      </div>
                      <div className="flex items-center gap-1.5 lg:gap-2 lg:[&>svg]:w-7 lg:[&>svg]:h-7">
                        <span
                          className="text-[11px] lg:text-[14.5px] font-bold tabular-nums"
                          style={{ color: nearLimit ? 'var(--amber)' : 'var(--text-muted)' }}
                        >
                          {content.length}/{MAX_LEN}
                        </span>
                        <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
                          <circle
                            cx="11"
                            cy="11"
                            r={RING_R}
                            fill="none"
                            strokeWidth="2.5"
                            stroke="var(--card-border)"
                          />
                          <circle
                            cx="11"
                            cy="11"
                            r={RING_R}
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            stroke={nearLimit ? 'var(--amber-icon)' : 'var(--brand)'}
                            strokeDasharray={RING_C}
                            strokeDashoffset={RING_C * (1 - ratio)}
                            style={{ transition: 'stroke-dashoffset 0.2s ease-out' }}
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 기도 씨앗 — 첫 문장 도우미 */}
                <div className="px-5 lg:px-0 pt-4 lg:pt-6 lg:shrink-0">
                  <div className="flex items-center justify-between mb-2 lg:mb-3">
                    <span className="text-[12px] lg:text-[17px] font-bold text-ink-strong">
                      {ko ? '막막할 땐, 이렇게 시작해봐요' : 'Stuck? Start like this'}
                    </span>
                    <button
                      type="button"
                      onClick={rollSeeds}
                      className="flex items-center gap-1 lg:gap-1.5 px-2 py-1 lg:px-3.5 lg:py-2 rounded-full text-[11.5px] lg:text-[15px] font-semibold text-ink-muted hover:text-brand hover:bg-[var(--brand-soft)] transition-colors lg:[&_svg]:w-[19px] lg:[&_svg]:h-[19px]"
                    >
                      <span className={rolling ? 'thanks-roll inline-flex' : 'inline-flex'}>
                        <DiceIcon size={14} />
                      </span>
                      {ko ? '다른 문장' : 'Shuffle'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 lg:gap-2.5">
                    {seeds.map((seed) => (
                      <button
                        key={seed}
                        type="button"
                        onClick={() => applySeed(seed)}
                        className="px-3 py-1.5 lg:px-5 lg:py-3 rounded-full border border-dashed text-[12.5px] lg:text-[16.5px] text-ink hover:text-brand hover:border-brand active:scale-95 transition-all"
                        style={{ borderColor: 'var(--card-border)', background: 'transparent' }}
                      >
                        {seed.trim()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 에러 */}
            {error && (
              <div className="px-5 lg:px-10 pt-3 lg:pt-5">
                <div className="p-3 lg:p-4 rounded-xl bg-red-500/10 border border-red-500/25">
                  <p className="text-[12.5px] lg:text-[16px] leading-snug text-red-500">{error}</p>
                </div>
              </div>
            )}

            {/* 액션 */}
            <div
              className="sticky bottom-0 mt-5 lg:mt-7 px-5 lg:px-10 pt-3 lg:pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-6 flex gap-2 lg:gap-3 lg:justify-end border-t border-[var(--card-border)]"
              style={{ background: 'var(--surface-container)' }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isCreating}
                className="px-5 py-3 lg:px-8 lg:py-4 rounded-2xl text-[14px] lg:text-[17px] font-semibold text-ink border border-[var(--card-border)] hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
              >
                {ko ? '다음에' : 'Later'}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 lg:flex-none lg:min-w-[340px] lg:px-12 py-3 lg:py-4 rounded-2xl bg-brand text-[var(--on-brand)] text-[15px] lg:text-[19px] font-extrabold tracking-[-0.01em] shadow-[0_8px_20px_var(--brand-glow)] hover:bg-brand-dim active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-1.5 lg:gap-2 lg:[&_svg]:w-[22px] lg:[&_svg]:h-[22px]"
              >
                <span className="inline-flex leading-none">
                  {meta ? (
                    <EmotionGlyph emotion={meta.key} fallback={meta.emoji} size={17} />
                  ) : (
                    <PrayIcon size={17} />
                  )}
                </span>
                {sharedWithPastor
                  ? isCreating || celebrating
                    ? t('pastorPrayerSubmitting')
                    : t('pastorPrayerSubmit')
                  : isPrivate
                  ? isCreating || celebrating
                    ? t('privatePrayerSubmitting')
                    : t('privatePrayerSubmit')
                  : isCreating || celebrating
                    ? ko
                      ? '나누는 중…'
                      : 'Sharing…'
                    : ko
                      ? '기도 나누기'
                      : 'Share prayer'}
              </button>
            </div>
          </form>
        </div>

        {/* 등록 성공 — 이모지 폭죽 */}
        {burst && (
          <div className="thanks-burst pointer-events-none fixed inset-0 z-[120] flex items-center justify-center">
            {burst.map((piece, i) => (
              <span
                key={i}
                className="thanks-burst-piece absolute text-[26px]"
                style={piece.style}
              >
                {piece.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default PrayerComposer
