// 설교 준비실 ② 연구 — 본문의 절 해석(성경에 실어 둔 주석).
//   본문 작업대(/pastor/sermon/study)에만 있던 것을 준비실에도 둔다 — AI 연구 재료 옆에 이미 검토해 실어 둔 해석이 함께 보이게.
//   자료는 본문 조회(usePassageStudy)가 이미 받아 온 것이라 요청이 늘지 않는다. 발췌만 보이고 전체는 성경 화면에서 연다.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SermonStudy } from '../../../../api/pastor'
import { SectionCard } from '../../../Admin/components/StatCards'

const PREVIEW = 4

const StudioCommentaryCard = ({ study }: { study: SermonStudy | undefined }) => {
  const [all, setAll] = useState(false)
  // 장·단락 요약을 먼저, 그다음 절 순서
  const items = useMemo(() => {
    const list = study?.commentaries ?? []
    return [...list.filter(c => c.scope === 'summary'), ...list.filter(c => c.scope !== 'summary')]
  }, [study?.commentaries])
  if (!study?.found || items.length === 0) return null
  const firstChapter = study.verses?.[0]?.chapter ?? items[0].chapter
  const shown = all ? items : items.slice(0, PREVIEW)
  return (
    <SectionCard
      title="절 해석"
      action={
        <Link
          to={`/bible/${study.book_number}/${firstChapter}`}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] lg:text-[13px] font-bold text-brand hover:underline"
        >
          성경에서 전체 보기
        </Link>
      }
    >
      <p className="text-[12px] lg:text-[13px] text-gray-600 dark:text-white/60 leading-relaxed">
        성경 화면에 실어 둔 이 본문의 해석입니다. AI 연구 재료와 견주어 보세요.
      </p>
      <ul className="space-y-2">
        {shown.map(c => (
          <li key={c.id} className="rounded-xl p-3 border border-gray-200/70 dark:border-white/[0.07]">
            <p className="flex items-center gap-1.5 text-[12px] lg:text-[13px] font-bold text-gray-500 dark:text-white/55">
              <span className="text-brand">
                {c.chapter}:{c.verse_start}
                {c.verse_end > c.verse_start && `-${c.verse_end}`}
              </span>
              {c.category && <span>· {c.category}</span>}
              {c.scope === 'summary' && <span>· 요약</span>}
            </p>
            {c.title && <p className="mt-0.5 text-[13.5px] lg:text-[15px] font-bold text-ink-strong">{c.title}</p>}
            <p className="mt-0.5 text-[12.5px] lg:text-[14.5px] leading-relaxed text-gray-700 dark:text-white/75">{c.excerpt}</p>
          </li>
        ))}
      </ul>
      {items.length > PREVIEW && (
        <button type="button" onClick={() => setAll(v => !v)} className="text-[12.5px] lg:text-[13.5px] font-semibold text-brand">
          {all ? '접기' : `해석 ${items.length - PREVIEW}개 더 보기`}
        </button>
      )}
    </SectionCard>
  )
}

export default StudioCommentaryCard
