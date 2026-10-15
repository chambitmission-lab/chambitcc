import { useState } from 'react'
import { GLOSSARY_TYPE_LABEL, type GlossaryEntry } from '../data/bibleGlossary'
import { useDeleteGlossaryLine, useGlossaryLines, useSaveGlossaryLine } from '../../../hooks/useBibleTyping'
import type { GlossaryLineBucket } from '../../../api/bibleTyping'
import { showToast } from '../../../utils/toast'

/**
 * 필사 카드 아래 '이 절에서 알아두면 좋은 말' — 사전 표제어 칩 + 펼치는 풀이.
 *
 * 본문 위 점선 밑줄(TypingPad marks)과 짝이다: 칩을 누르거나 밑줄 단어를 누르면 같은 풀이가 열리고,
 * 본문의 그 단어가 형광펜처럼 칠해진다(activeMark). 풀이 아래엔 성도들이 표제어에 남긴 한 줄이 붙는다.
 * 릴레이 방이면 viewers 로 "누가 봤어요"를 칩·풀이에 함께 보여준다.
 */

const TYPE_ICON: Record<GlossaryEntry['type'], string> = {
  person: 'person',
  place: 'place',
  title: 'workspace_premium',
  term: 'menu_book',
  archaic: 'spellcheck',
  loanword: 'translate',
}

export interface GlossaryViewer {
  user_id: number
  name: string
  hue: number
}

interface Props {
  entries: GlossaryEntry[]
  active: string | null
  onToggle: (term: string) => void
  /** 한 줄을 남길 때 어느 절에서 남겼는지 */
  where: { book_number: number; chapter: number; verse_id: number }
  loggedIn: boolean
  /** 릴레이 방 — 표제어별로 풀이를 열어 본 친구(나 제외) */
  viewersOf?: (term: string) => GlossaryViewer[]
}

const names = (vs: GlossaryViewer[]) =>
  vs.length <= 2 ? vs.map((v) => v.name).join('·') : `${vs[0].name}·${vs[1].name} 외 ${vs.length - 2}명`

const GlossPanel = ({
  entry,
  where,
  loggedIn,
  viewers,
  bucket,
}: {
  entry: GlossaryEntry
  where: Props['where']
  loggedIn: boolean
  viewers: GlossaryViewer[]
  bucket: GlossaryLineBucket | undefined
}) => {
  const save = useSaveGlossaryLine()
  const remove = useDeleteGlossaryLine()
  const [showAll, setShowAll] = useState(false)
  const [draft, setDraft] = useState('')
  const [writing, setWriting] = useState(false)
  const mine = bucket?.lines.find((l) => l.mine) ?? null
  const others = bucket?.lines.filter((l) => !l.mine) ?? []
  const shown = showAll ? others : others.slice(0, 1)

  const submit = () => {
    const text = draft.trim()
    if (text.length < 2) return
    save.mutate(
      { term: entry.name, message: text, ...where },
      {
        onSuccess: () => {
          setWriting(false)
          setDraft('')
          showToast('한 줄을 남겼어요', 'success')
        },
        onError: (e) => showToast(e instanceof Error ? e.message : '한 줄을 남기지 못했어요', 'error'),
      },
    )
  }

  return (
    <div className="bt-gloss__panel" role="region" aria-label={`${entry.name} 풀이`}>
      <p className="bt-gloss__desc">
        <span className="bt-gloss__type">{GLOSSARY_TYPE_LABEL[entry.type]}</span>
        <b>{entry.name}</b> — {entry.desc}
      </p>
      <p className="bt-gloss__ref">
        <span className="material-icons-round" aria-hidden>
          auto_stories
        </span>
        대표 구절 {entry.first}
      </p>
      {viewers.length > 0 && <p className="bt-gloss__seen">이 방에서 {names(viewers)}님도 봤어요</p>}

      {loggedIn && (
        <div className="bt-gloss__lines">
          {shown.map((l) => (
            <div key={l.id} className="bt-gloss__line">
              <span className="bt-gloss__av" aria-hidden>
                {l.avatar_url ? <img src={l.avatar_url} alt="" loading="lazy" /> : l.name.slice(0, 1)}
              </span>
              <span className="bt-gloss__msg">
                <b>{l.name}</b>의 한 줄 <q>{l.message}</q>
              </span>
            </div>
          ))}
          {others.length > 1 && (
            <button type="button" className="bt-gloss__more" onClick={() => setShowAll((v) => !v)}>
              {showAll ? '접기' : `+${others.length - 1}개 더 보기`}
            </button>
          )}
          {mine && !writing && (
            <div className="bt-gloss__line is-mine">
              <span className="bt-gloss__av" aria-hidden>
                나
              </span>
              <span className="bt-gloss__msg">
                <b>내 한 줄</b> <q>{mine.message}</q>
              </span>
              <span className="bt-gloss__mine-actions">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(mine.message)
                    setWriting(true)
                  }}
                >
                  고치기
                </button>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(mine.id, { onError: () => showToast('지우지 못했어요', 'error') })}
                >
                  지우기
                </button>
              </span>
            </div>
          )}
          {!mine && !writing && (
            <button type="button" className="bt-gloss__write" onClick={() => setWriting(true)}>
              <span className="material-icons-round" aria-hidden>
                edit
              </span>
              {others.length ? '나도 한 줄 남기기' : '아직 남긴 한 줄이 없어요 · 첫 번째로 남겨 보세요'}
            </button>
          )}
          {writing && (
            <form
              className="bt-gloss__form"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={80}
                autoFocus
                placeholder={`'${entry.name}'을 쓰며 든 생각 한 줄`}
                aria-label="한 줄 남기기"
              />
              <button type="submit" className="bt-btn bt-btn--primary" disabled={save.isPending || draft.trim().length < 2}>
                남기기
              </button>
              <button type="button" className="bt-btn bt-btn--ghost" onClick={() => setWriting(false)}>
                취소
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

const TypingGlossary = ({ entries, active, onToggle, where, loggedIn, viewersOf }: Props) => {
  const terms = entries.map((e) => e.name)
  const { data: lines } = useGlossaryLines(loggedIn ? terms : [])
  const entry = entries.find((e) => e.name === active) ?? null
  if (entries.length === 0) return null

  return (
    <section className="bt-gloss" aria-label="이 절에서 알아두면 좋은 말">
      <div className="bt-gloss__head">
        <span className="material-icons-round" aria-hidden>
          menu_book
        </span>
        <span>이 절에서 알아두면 좋은 말</span>
        <em>{viewersOf ? '누르면 풀이 · 방 친구에게도 보여요' : '누르면 풀이'}</em>
      </div>
      <div className="bt-gloss__chips">
        {entries.map((e) => {
          const vs = viewersOf?.(e.name) ?? []
          const count = lines?.[e.name]?.count ?? 0
          return (
            <button
              key={e.name}
              type="button"
              className={`bt-gloss__chip${active === e.name ? ' is-on' : ''}`}
              aria-expanded={active === e.name}
              onClick={() => onToggle(e.name)}
            >
              <span className="material-icons-round" aria-hidden>
                {TYPE_ICON[e.type]}
              </span>
              {e.name}
              {vs.length > 0 ? <i>{names(vs)} 봤어요</i> : count > 0 ? <i>한 줄 {count}</i> : null}
            </button>
          )
        })}
      </div>

      {entry && (
        <GlossPanel
          key={entry.name}
          entry={entry}
          where={where}
          loggedIn={loggedIn}
          viewers={viewersOf ? viewersOf(entry.name) : []}
          bucket={lines?.[entry.name]}
        />
      )}
    </section>
  )
}

export default TypingGlossary
