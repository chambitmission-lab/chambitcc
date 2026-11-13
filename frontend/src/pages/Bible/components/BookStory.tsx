import { genreStyle } from '../../../components/bible/bookGenre'
import { actIndexOf, type BookStoryline, type StoryAct } from '../data/bookStorylines'
import { useBookStoryline } from '../hooks/useBookStoryline'
import './BookStory.css'

/**
 * 책 줄거리 지도 (bstory- 접두사).
 *
 * 초심자는 50장을 한 장씩 따로 읽다가 "그래서 창세기가 무슨 이야기였지?"에서 길을 잃는다.
 * 책 한 권을 4~6개의 막으로 묶어 세 곳에서 보여 준다.
 *  - 장 머리말(ChapterHead) : 막 진행선 "지금 여기" — 누르면 BookStoryMap(막 전체 지도).
 *  - BookStoryEnd   : 막의 마지막 장 끝 "막 정리", 책 마지막 장 끝 "한 권 돌아보기".
 *
 * 데이터(data/bookStorylines)가 없는 책은 조용히 렌더하지 않는다.
 */

const rangeLabel = (act: StoryAct) => (act.from === act.to ? `${act.from}장` : `${act.from}–${act.to}장`)

/** 막 전체 지도 — 장 머리말의 줄거리 띠를 누르면 펼쳐진다. 장면 칩으로 그 장에 바로 간다 */
export const BookStoryMap = ({
  story,
  chapter,
  onJump,
}: {
  story: BookStoryline
  chapter: number
  onJump: (chapter: number) => void
}) => {
  const nowIdx = actIndexOf(story.acts, chapter)
  const unit = story.unit ?? '막'
  const single = story.acts.length === 1
  return (
    <div className="bstory__body">
      <p className="bstory__q">
        <span>이 책이 답하는 질문</span>
        {story.question}
      </p>
      <ol className="bstory__acts">
        {story.acts.map((act, i) => (
          <li key={act.from} className={`bstory__act${i === nowIdx ? ' is-now' : ''}`}>
            <div className="bstory__act-head">
              {!single && <span className="bstory__act-no">{i + 1}{unit}</span>}
              <span className="bstory__act-range">{rangeLabel(act)}</span>
              {i === nowIdx && !single && <span className="bstory__here">지금 여기</span>}
            </div>
            <p className="bstory__act-title">{act.title}</p>
            <p className="bstory__act-line">{act.line}</p>
            <div className="bstory__scenes">
              {act.scenes.map((scene) => (
                <button key={`${scene.ch}-${scene.label}`} type="button" className="bstory__scene" onClick={() => onJump(scene.ch)}>
                  <b>{scene.ch}장</b>
                  {scene.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

interface EndProps {
  bookNumber: number
  bookName: string
  chapter: number
  totalChapters: number
  /** 다음 책 이름 — 있으면 "다음 책으로" 다리를 보여 준다 */
  nextBookName?: string | null
}

/** 장 끝 — 막의 마지막 장이면 "막 정리", 책의 마지막 장이면 "한 권 돌아보기" */
export const BookStoryEnd = ({ bookNumber, bookName, chapter, totalChapters, nextBookName }: EndProps) => {
  const { story } = useBookStoryline(bookNumber)
  if (!story) return null
  const idx = story.acts.findIndex((a) => a.to === chapter)
  if (idx < 0) return null
  const act = story.acts[idx]
  const unit = story.unit ?? '막'

  if (chapter >= totalChapters) {
    return (
      <section className="bstory-end bstory-end--book" style={genreStyle(bookNumber)} aria-label={`${bookName} 돌아보기`}>
        <span className="bstory-end__eyebrow">{bookName} 돌아보기</span>
        <h3 className="bstory-end__title">{story.thread}</h3>
        <ol className="bstory-end__acts">
          {story.acts.map((a, i) => (
            <li key={a.from}>
              <span className="bstory-end__act-tag">
                {story.acts.length > 1 ? `${i + 1}${unit} · ` : ''}
                {a.name}
                <small>{rangeLabel(a)}</small>
              </span>
              <p>{a.line}</p>
            </li>
          ))}
        </ol>
        <div className="bstory-end__note">
          <span>{story.christLabel ?? '예수님께로 이어지는 선'}</span>
          <p>{story.christ}</p>
        </div>
        {nextBookName && (
          <div className="bstory-end__note bstory-end__note--next">
            <span>다음 책 · {nextBookName}</span>
            <p>{story.bridge}</p>
          </div>
        )}
      </section>
    )
  }

  const next = story.acts[idx + 1]
  return (
    <section className="bstory-end" style={genreStyle(bookNumber)} aria-label={`${bookName} ${idx + 1}${unit} 정리`}>
      <span className="bstory-end__eyebrow">
        {idx + 1}{unit}{unit === '막' ? '을' : '를'} 마쳤어요 · {rangeLabel(act)}
      </span>
      <h3 className="bstory-end__title">{act.title}</h3>
      <ol className="bstory-end__wrap">
        {act.wrap.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      {next && act.next && (
        <div className="bstory-end__note bstory-end__note--next">
          <span>
            다음 · {idx + 2}{unit} {next.name} ({rangeLabel(next)})
          </span>
          <p>{act.next}</p>
        </div>
      )}
    </section>
  )
}
