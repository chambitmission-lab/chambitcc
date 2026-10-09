// 이번 주 말씀과 동행하기 — 본문 읽기 → 설교 듣기 → 한 줄 붙잡기
// 1·2단계는 기기 편의 기록(localStorage), 3단계 '한 줄'만 서버에 남아 지난 편지 위에 손글씨로 다시 보인다.
// 한 줄은 '목사님께 이름 없이 전하기'를 켜면 /pastor 설교의 메아리에 이름 없이 모인다.
// 목사님이 나눔 질문을 공개하면 맨 아래에 함께 나눌 질문이 붙는다.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { Sermon } from '../../../types/sermon'
import { getBibleChapter } from '../../../api/bible'
import { bibleKeys } from '../../../hooks/queryKeys'
import { useAuth } from '../../../hooks/useAuth'
import {
  useDeleteSermonTakeaway,
  useSaveSermonTakeaway,
  useSermonTakeaways,
} from '../../../hooks/useSermonTakeaways'
import { formatReference, parseBibleReference } from '../utils/sermonMeta'
import { primaryMedia, readWalk, writeWalk, type WalkState } from '../utils/sermonLetter'
import type { SermonHeroVariant } from './SermonLetterHero'
import SermonDiscussionBlock from './SermonDiscussionBlock'

interface SermonWalkProps {
  sermon: Sermon
  variant: SermonHeroVariant
  /** 히어로 '본문 읽기'를 누를 때마다 올라간다 — 1단계를 펼친다 */
  passageSignal: number
  onOpen: (media: 'audio' | 'video' | null) => void
}

const TAKEAWAY_MAX = 200

const StepNumber = ({ n, done }: { n: number; done: boolean }) => (
  <span className="sl-step-n" aria-hidden>
    {done ? <span className="material-icons-outlined">check</span> : n}
  </span>
)

const SermonWalk = ({ sermon, variant, passageSignal, onOpen }: SermonWalkProps) => {
  const parsed = useMemo(() => parseBibleReference(sermon.bible_verse), [sermon.bible_verse])
  const [walk, setWalk] = useState<WalkState>(() => readWalk(sermon.id))
  const [passageOpen, setPassageOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  // 목사님께 이름 없이 전하기 — 새 한 줄은 켠 채로 시작, 고쳐 쓸 땐 저장된 값에서
  const [share, setShare] = useState(true)

  // 히어로 '본문 읽기' 신호가 바뀌면 1단계를 펼친다 (렌더 중 조정 — 설교가 바뀌면 부모가 key 로 새로 그린다)
  const [seenSignal, setSeenSignal] = useState(passageSignal)
  if (passageSignal !== seenSignal) {
    setSeenSignal(passageSignal)
    setPassageOpen(true)
  }

  const mark = (patch: Partial<WalkState>) => {
    setWalk((prev) => {
      const next = { ...prev, ...patch }
      writeWalk(sermon.id, next)
      return next
    })
  }

  // 본문 — 장 전체를 받아 범위만 자른다(성경 화면과 같은 캐시 칸)
  const bookNumber = parsed?.bookNumber ?? null
  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: bibleKeys.chapter(bookNumber ?? 0, parsed?.chapter ?? 0),
    queryFn: () => getBibleChapter(bookNumber!, parsed!.chapter),
    enabled: passageOpen && bookNumber != null,
    staleTime: Infinity,
  })
  const passage = useMemo(() => {
    if (!chapter || !parsed) return []
    const from = parsed.verse ?? 1
    const to = parsed.verseEnd ?? (parsed.verse ?? Number.MAX_SAFE_INTEGER)
    return chapter.verses.filter((v) => v.verse >= from && v.verse <= to && v.merged_into == null)
  }, [chapter, parsed])
  const verseCount = parsed?.verse != null ? (parsed.verseEnd ?? parsed.verse) - parsed.verse + 1 : null

  // 한 줄 붙잡기
  const { requireAuth } = useAuth()
  const { loggedIn, bySermon } = useSermonTakeaways()
  const saved = bySermon.get(sermon.id)
  const save = useSaveSermonTakeaway()
  const remove = useDeleteSermonTakeaway()
  const showInput = loggedIn && (!saved || editing)

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    save.mutate({ sermonId: sermon.id, text, shared: share }, { onSuccess: () => { setEditing(false); setDraft('') } })
  }

  const media = primaryMedia(sermon)
  const doneCount = [walk.read, walk.watch, !!saved].filter(Boolean).length

  return (
    <section id="sermon-walk" className="sl-walk feed-card scroll-mt-20">
      <header className="sl-walk-head">
        <b>이번 주 말씀과 동행하기</b>
        <span>{doneCount} / 3</span>
      </header>

      {/* 1. 본문 읽기 */}
      {parsed?.bookNumber != null && (
        <div className={`sl-step${walk.read ? ' is-done' : ''}`}>
          <StepNumber n={1} done={walk.read} />
          <div className="sl-step-body">
            <p className="sl-step-title">
              본문 읽기{verseCount ? <small>{verseCount}절</small> : null}
            </p>
            <p className="sl-step-desc">설교 전에, 혹은 다시 한번 — 오늘의 말씀을 눈으로 먼저</p>
            <div className="sl-step-actions">
              <button type="button" className="sl-btn" onClick={() => setPassageOpen((o) => !o)}>
                <span className="material-icons-outlined">menu_book</span>
                {passageOpen ? '접기' : `${formatReference(parsed)} 펼치기`}
              </button>
            </div>
            {passageOpen && (
              <div className="sl-passage">
                {chapterLoading ? (
                  <p className="sl-passage-loading">본문을 펼치는 중…</p>
                ) : (
                  <p>
                    {passage.map((v) => (
                      <span key={v.id}>
                        <sup>{v.verse_label || v.verse}</sup>
                        {v.text}{' '}
                      </span>
                    ))}
                  </p>
                )}
                <div className="sl-step-actions">
                  {!walk.read && (
                    <button
                      type="button"
                      className="sl-btn sl-btn--solid"
                      onClick={() => {
                        mark({ read: true })
                        setPassageOpen(false)
                      }}
                    >
                      <span className="material-icons-outlined">check</span>다 읽었어요
                    </button>
                  )}
                  <Link
                    className="sl-btn sl-btn--plain"
                    to={`/bible/${parsed.bookNumber}/${parsed.chapter}${parsed.verse ? `?verse=${parsed.verse}` : ''}`}
                  >
                    성경에서 이어 읽기
                    <span className="material-icons-outlined">arrow_forward</span>
                  </Link>
                  {/* 마음에 남은 절을 골라 카드로 — 한 주 동안 단톡방·프로필로 말씀이 이어지게 */}
                  <Link
                    className="sl-btn sl-btn--plain"
                    to="/bible/photo-verse"
                    state={{ sermonPassage: { ref: sermon.bible_verse, title: sermon.title } }}
                  >
                    말씀 카드로 담기
                    <span className="material-icons-outlined">photo_filter</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 설교 듣기 */}
      <div className={`sl-step${walk.watch ? ' is-done' : ''}`}>
        <StepNumber n={parsed?.bookNumber != null ? 2 : 1} done={walk.watch} />
        <div className="sl-step-body">
          <p className="sl-step-title">
            설교 듣기<small>{sermon.pastor}</small>
          </p>
          {variant === 'video' && media && (
            <p className="sl-step-desc">위 영상으로 들으셨다면 표시해 두세요</p>
          )}
          <div className="sl-step-actions">
            {variant === 'video' && media ? (
              <button
                type="button"
                className={`sl-btn${walk.watch ? ' sl-btn--solid' : ''}`}
                onClick={() => mark({ watch: !walk.watch })}
                aria-pressed={walk.watch}
              >
                <span className="material-icons-outlined">check</span>들었어요
              </button>
            ) : (
              <button
                type="button"
                className="sl-btn"
                onClick={() => {
                  mark({ watch: true })
                  onOpen(media)
                }}
              >
                <span className="material-icons-outlined">
                  {media === 'video' ? 'play_arrow' : media === 'audio' ? 'headphones' : 'menu_book'}
                </span>
                {media === 'video' ? '설교 영상 보기' : media === 'audio' ? '음성으로 듣기' : '설교 전문 읽기'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. 한 줄 붙잡기 */}
      <div className={`sl-step${saved ? ' is-done' : ''}`}>
        <StepNumber n={parsed?.bookNumber != null ? 3 : 2} done={!!saved} />
        <div className="sl-step-body">
          <p className="sl-step-title">한 줄 붙잡기</p>
          <p className="sl-step-desc">말씀 중 마음에 남은 한 문장을 적어 두면, 지난 편지 위에 손글씨로 남아요</p>

          {!loggedIn && (
            <div className="sl-step-actions">
              <button type="button" className="sl-btn" onClick={() => requireAuth(() => {})}>
                <span className="material-icons-outlined">edit</span>로그인하고 붙잡기
              </button>
            </div>
          )}

          {loggedIn && saved && !editing && (
            <div className="sl-kept">
              <p className="sl-pen">{saved.text}</p>
              <p className="sl-share-note">
                <span className="material-icons-outlined" aria-hidden>
                  {saved.shared ? 'mark_email_read' : 'lock'}
                </span>
                {saved.shared ? '목사님께 이름 없이 전했어요' : '나만 보는 한 줄이에요'}
              </p>
              <div className="sl-step-actions">
                <button
                  type="button"
                  className="sl-btn sl-btn--plain"
                  onClick={() => {
                    setDraft(saved.text)
                    setShare(saved.shared)
                    setEditing(true)
                  }}
                >
                  고쳐 쓰기
                </button>
                <button
                  type="button"
                  className="sl-btn sl-btn--plain"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(sermon.id)}
                >
                  지우기
                </button>
              </div>
            </div>
          )}

          {showInput && (
            <>
              <textarea
                className="sl-input"
                value={draft}
                maxLength={TAKEAWAY_MAX}
                rows={2}
                placeholder="오늘 마음에 남은 한 문장을 적어 보세요"
                onChange={(e) => setDraft(e.target.value)}
              />
              <label className="sl-share">
                <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
                <span>
                  목사님께 이름 없이 전하기
                  <small>이름 없이 한 줄만 전해져요. 설교 준비와 함께 나눌 질문에 쓰여요</small>
                </span>
              </label>
              <div className="sl-step-actions">
                <button
                  type="button"
                  className="sl-btn sl-btn--solid"
                  disabled={!draft.trim() || save.isPending}
                  onClick={submit}
                >
                  <span className="material-icons-outlined">edit</span>
                  {save.isPending ? '붙잡는 중…' : '붙잡기'}
                </button>
                {editing && (
                  <button type="button" className="sl-btn sl-btn--plain" onClick={() => setEditing(false)}>
                    취소
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <SermonDiscussionBlock sermon={sermon} />
    </section>
  )
}

export default SermonWalk
