import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateTypingRelay } from '../../../../hooks/useBibleTyping'
import { useBibleBooks } from '../../../../hooks/useBible'
import type { TypingRelaySummary } from '../../../../api/bibleTyping'
import { showToast } from '../../../../utils/toast'

// 함께 나눠 쓰기 좋은 장 — 한 번에 고르는 칩
const RELAY_PICKS: { book: number; chapter: number; label: string }[] = [
  { book: 19, chapter: 23, label: '시편 23편' },
  { book: 46, chapter: 13, label: '고린도전서 13장' },
  { book: 40, chapter: 5, label: '마태복음 5장' },
  { book: 45, chapter: 8, label: '로마서 8장' },
  { book: 43, chapter: 15, label: '요한복음 15장' },
  { book: 19, chapter: 103, label: '시편 103편' },
]

const RelayCreateSheet = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate()
  const { data: books } = useBibleBooks()
  const create = useCreateTypingRelay()
  const [book, setBook] = useState(19)
  const [chapter, setChapter] = useState(23)
  const [title, setTitle] = useState('')
  const picked = books?.find((b) => b.book_number === book)
  const chapters = useMemo(() => Array.from({ length: picked?.chapter_count ?? 1 }, (_, i) => i + 1), [picked])

  const submit = () =>
    create.mutate(
      { book_number: book, chapter, title: title.trim() || undefined },
      {
        onSuccess: (r) => {
          onClose()
          navigate(`/bible/typing/relay/${r.id}?new=1`)
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '릴레이를 만들지 못했어요', 'error'),
      },
    )

  return (
    <div className="bt-summary" role="dialog" aria-modal="true" aria-labelledby="bt-relay-new" onClick={onClose}>
      <div className="bt-summary__card bt-relay-new" onClick={(e) => e.stopPropagation()}>
        <p className="bt-summary__eyebrow">릴레이 필사</p>
        <h2 id="bt-relay-new" className="bt-summary__title">
          한 장을 함께 나눠 써요
        </h2>
        <p className="bt-relay-new__desc">초대한 사람들이 이 장을 쓰면 한 칸씩 채워져요. 누가 어느 절을 채웠는지 함께 보여요.</p>
        <div className="bt-quick bt-quick--wrap">
          {RELAY_PICKS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`bt-chip${book === p.book && chapter === p.chapter ? ' is-on' : ''}`}
              onClick={() => {
                setBook(p.book)
                setChapter(p.chapter)
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="bt-relay-new__row">
          <label className="bt-field">
            <span>책</span>
            <select
              value={book}
              onChange={(e) => {
                setBook(Number(e.target.value))
                setChapter(1)
              }}
            >
              {(books ?? []).map((b) => (
                <option key={b.book_number} value={b.book_number}>
                  {b.book_name_ko}
                </option>
              ))}
            </select>
          </label>
          <label className="bt-field bt-field--narrow">
            <span>{book === 19 ? '편' : '장'}</span>
            <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
              {chapters.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="bt-field">
          <span>이름 (선택)</span>
          <input
            value={title}
            maxLength={80}
            placeholder={`${picked?.book_name_ko ?? ''} ${chapter}${book === 19 ? '편' : '장'} 릴레이`}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="bt-summary__actions">
          <button type="button" className="bt-btn bt-btn--primary bt-btn--block" disabled={create.isPending} onClick={submit}>
            {create.isPending ? '만드는 중…' : '만들고 초대하기'}
          </button>
          <button type="button" className="bt-btn bt-btn--ghost bt-btn--block" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

/** 릴레이 필사 — 내가 참여한 방 목록 + 만들기. 목록은 허브 묶음(useTypingHome)에서 받아 내려온다 */
const RelayCard = ({ relays }: { relays?: TypingRelaySummary[] }) => {
  const [creating, setCreating] = useState(false)

  return (
    <section className="bt-section" aria-labelledby="bt-relay-title">
      <h2 id="bt-relay-title" className="bt-section__title">
        릴레이 필사
      </h2>
      <div className="bt-card bt-relays">
        {relays && relays.length > 0 ? (
          <ul className="bt-relays__list">
            {relays.map((r) => (
              <li key={r.id}>
                <Link to={`/bible/typing/relay/${r.id}`} className={`bt-relays__item${r.completed ? ' is-done' : ''}`}>
                  <span className="bt-relays__top">
                    <span className="bt-relays__name">{r.title}</span>
                    {r.completed ? (
                      <span className="bt-badge bt-badge--best">완성</span>
                    ) : (
                      <span className="bt-relays__count">
                        {r.done}/{r.total}
                      </span>
                    )}
                  </span>
                  <span className="bt-relays__bar" aria-hidden>
                    <span style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }} />
                  </span>
                  <span className="bt-relays__meta">
                    {r.members}명 함께 · 내가 {r.my_verses}절
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="bt-relays__empty">소그룹·가족과 한 장을 나눠 써 보세요. 다 채우면 함께 완성을 축하해요.</p>
        )}
        <button type="button" className="bt-btn bt-btn--block bt-relays__new" onClick={() => setCreating(true)}>
          <span className="material-icons-round" aria-hidden>
            add
          </span>
          릴레이 만들기
        </button>
      </div>
      {creating && <RelayCreateSheet onClose={() => setCreating(false)} />}
    </section>
  )
}

export default RelayCard
