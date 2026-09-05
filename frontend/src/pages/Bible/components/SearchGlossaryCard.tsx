import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { GLOSSARY_TYPE_LABEL, type GlossaryEntry } from '../data/bibleGlossary'
import { parseBibleReference } from '../../Sermon/utils/sermonMeta'

const TYPE_ICON: Record<GlossaryEntry['type'], string> = {
  person: 'person',
  place: 'place',
  title: 'workspace_premium',
  term: 'menu_book',
  archaic: 'spellcheck',
  loanword: 'translate',
}

/**
 * 검색 탭 정의 카드 — 검색어가 사전 표제어와 일치하면 절 결과 위에 뜻풀이를 먼저 보여준다.
 * "삼위일체"처럼 본문에 한 번도 안 나오는 말도 여기서는 답이 나온다.
 * GlossarySheet(본문 칩 시트)와 같은 문법의 인라인 카드.
 */
const SearchGlossaryCard = ({ entry }: { entry: GlossaryEntry }) => {
  const navigate = useNavigate()
  const firstRef = useMemo(() => {
    const parsed = parseBibleReference(entry.first)
    return parsed?.bookNumber ? parsed : null
  }, [entry.first])

  const goToFirstRef = () => {
    if (!firstRef?.bookNumber) return
    navigate(`/bible/${firstRef.bookNumber}/${firstRef.chapter}${firstRef.verse ? `?verse=${firstRef.verse}` : ''}`)
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-card-dark border border-black/[0.05] dark:border-white/[0.08] px-4 py-4 mb-4 lg:max-w-[680px]"
      aria-label={`성경 사전 — ${entry.name}`}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-[var(--brand-soft)] rounded-full blur-2xl pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand-soft)] text-brand shrink-0">
          <span className="material-icons-round text-[22px]">{TYPE_ICON[entry.type]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-brand text-[10.5px] font-bold tracking-[0.1em]">
            성경 사전 · {GLOSSARY_TYPE_LABEL[entry.type]}
          </p>
          <h3 className="mt-0.5 text-ink-strong text-[17px] font-bold tracking-[-0.015em]">
            {entry.name}
            {entry.alt?.length ? (
              <span className="ml-1.5 text-[12px] font-semibold text-ink-muted">{entry.alt.join(' · ')}</span>
            ) : null}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink break-keep">{entry.desc}</p>
          {firstRef ? (
            <button
              type="button"
              onClick={goToFirstRef}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-[12.5px] font-bold text-brand transition-colors hover:bg-[var(--brand-soft-strong)]"
            >
              <span className="material-icons-round text-[16px]">auto_stories</span>
              대표 구절 — {entry.first}
              <span className="material-icons-round text-[16px]">chevron_right</span>
            </button>
          ) : (
            <p className="mt-2.5 text-[12px] text-ink-muted">{entry.first}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default SearchGlossaryCard
