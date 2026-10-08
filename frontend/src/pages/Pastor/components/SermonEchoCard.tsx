import { pastorKeys, sermonKeys } from '../../../hooks/queryKeys'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  draftDiscussionQuestions,
  fetchSermonEcho,
  saveSermonDiscussion,
  type SermonDiscussion,
  type SermonEchoData,
  type SermonEchoSermon,
} from '../../../api/pastor'
import { showToast } from '../../../utils/toast'
import { EmptyHint, SectionCard } from '../../Admin/components/StatCards'
import { formatDay } from './pastorUtils'

// 설교의 메아리 — 지난 주일 설교에서 성도들이 붙잡은 한 줄과, 그걸로 만드는 소그룹 나눔 질문.
// 개인정보 경계: 몇 명이 적었는지는 숫자만, 본문은 성도가 '목사님께 이름 없이 전하기'를 켠 것만
// (서버가 이름·시각 없이 섞어서, 최소 인원 미만이면 아예 내려보내지 않는다).

const LINES_PREVIEW = 6
const MAX_QUESTIONS = 5

const SermonEchoCard = () => {
  // null = 가장 최근 설교. 고른 설교도 같은 응답 모양이라 카드 하나로 오간다
  const [sermonId, setSermonId] = useState<number | null>(null)
  const { data, isPending } = useQuery<SermonEchoData>({
    queryKey: pastorKeys.sermonEcho(sermonId),
    queryFn: () => fetchSermonEcho(sermonId),
  })

  const sermon = data?.sermon ?? null
  return (
    <SectionCard
      title="설교의 메아리"
      action={
        data && data.recent.length > 1 && sermon ? (
          <select
            aria-label="설교 고르기"
            value={sermon.id}
            onChange={e => setSermonId(Number(e.target.value))}
            className="max-w-[180px] truncate rounded-lg border border-gray-200 dark:border-white/[0.1] bg-transparent px-2 py-1 text-[12.5px] font-semibold text-gray-700 dark:text-white/75"
          >
            {data.recent.map(s => (
              <option key={s.id} value={s.id}>
                {s.date ? `${formatDay(s.date, false)} · ` : ''}
                {s.title}
              </option>
            ))}
          </select>
        ) : undefined
      }
    >
      {isPending ? (
        <div className="h-[140px] rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
      ) : !data || !sermon ? (
        <EmptyHint text="아직 공개된 설교가 없습니다" />
      ) : (
        <>
          <SermonHead sermon={sermon} data={data} />
          <EchoLines key={`lines-${sermon.id}`} data={data} />
          <DiscussionEditor
            key={`q-${sermon.id}-${data.discussion?.updated_at ?? 'none'}`}
            sermon={sermon}
            discussion={data.discussion ?? null}
            sermonIdKey={sermonId}
          />
        </>
      )}
    </SectionCard>
  )
}

const SermonHead = ({ sermon, data }: { sermon: SermonEchoSermon; data: SermonEchoData }) => (
  <div>
    <p className="text-[12.5px] font-semibold text-gray-600 dark:text-white/65">
      {sermon.date ? formatDay(sermon.date) : ''}
      {sermon.bible_verse ? ` · ${sermon.bible_verse}` : ''}
    </p>
    <p className="mt-1 text-[16px] font-bold text-ink-strong tracking-[-0.02em] line-clamp-2">{sermon.title}</p>
    <p className="mt-1.5 text-[13px] text-gray-600 dark:text-white/65">
      <b className="text-brand">{data.writers ?? 0}명</b>이 한 줄을 붙잡았어요
      {(data.shared ?? 0) > 0 && <> · 그중 {data.shared}명이 목사님께 전했어요</>}
    </p>
  </div>
)

const EchoLines = ({ data }: { data: SermonEchoData }) => {
  const [all, setAll] = useState(false)
  const lines = data.lines ?? []
  if (lines.length === 0) {
    return (
      <p className="rounded-xl bg-gray-50 dark:bg-white/[0.03] px-3.5 py-3 text-[12.5px] leading-relaxed text-gray-500 dark:text-white/50">
        목사님께 전한 한 줄이 {data.min_shared}명 이상 모이면 이름 없이 여기에 보여요.
        성도들은 /sermon '한 줄 붙잡기'에서 전할 수 있어요.
      </p>
    )
  }
  const shown = all ? lines : lines.slice(0, LINES_PREVIEW)
  return (
    <div>
      <ul className="grid gap-1.5">
        {shown.map((t, i) => (
          <li
            key={i}
            className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-[14px] leading-relaxed text-gray-800 dark:text-white/80 break-keep"
          >
            “{t}”
          </li>
        ))}
      </ul>
      {lines.length > LINES_PREVIEW && (
        <button
          type="button"
          onClick={() => setAll(v => !v)}
          className="mt-2 text-[13px] font-semibold text-brand hover:underline"
        >
          {all ? '접기' : `모두 보기 (${lines.length})`}
        </button>
      )}
    </div>
  )
}

const DiscussionEditor = ({
  sermon,
  discussion,
  sermonIdKey,
}: {
  sermon: SermonEchoSermon
  discussion: SermonDiscussion | null
  sermonIdKey: number | null
}) => {
  const qc = useQueryClient()
  const [questions, setQuestions] = useState<string[]>(discussion?.questions ?? [])
  const published = !!discussion?.is_published
  const dirty = JSON.stringify(questions) !== JSON.stringify(discussion?.questions ?? [])

  const draft = useMutation({
    mutationFn: () => draftDiscussionQuestions(sermon.id),
    onSuccess: r => setQuestions(r.questions),
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const save = useMutation({
    mutationFn: (isPublished: boolean) =>
      saveSermonDiscussion(sermon.id, { questions: questions.map(q => q.trim()).filter(Boolean), is_published: isPublished }),
    onSuccess: (saved, isPublished) => {
      qc.setQueryData<SermonEchoData>(pastorKeys.sermonEcho(sermonIdKey), prev =>
        prev ? { ...prev, discussion: saved } : prev,
      )
      void qc.invalidateQueries({ queryKey: sermonKeys.discussion(sermon.id) })
      showToast(isPublished ? '성도들에게 나눔 질문을 공개했어요' : '나눔 질문을 저장했어요', 'success')
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  })

  const busy = draft.isPending || save.isPending
  const hasAny = questions.some(q => q.trim())

  return (
    <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13.5px] font-bold text-ink-strong">소그룹 나눔 질문</p>
        {discussion && (
          <span
            className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${
              published ? 'bg-[var(--brand-soft)] text-brand' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/55'
            }`}
          >
            {published ? '성도에게 공개 중' : '저장됨 · 비공개'}
          </span>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="mt-2">
          <p className="text-[12.5px] leading-relaxed text-gray-500 dark:text-white/50">
            설교 원고와 성도들이 전한 한 줄로 구역·목장에서 나눌 질문 3개를 만들어 드려요. 다듬어서 공개하면
            설교 화면 아래에 보이고, 구역장이 단톡방으로 바로 나눌 수 있어요.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => draft.mutate()}
              className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              {draft.isPending ? '질문을 만드는 중…' : 'AI로 질문 만들기'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setQuestions(['', '', ''])}
              className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              직접 쓰기
            </button>
          </div>
        </div>
      ) : (
        <>
          <ol className="mt-2.5 grid gap-2">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[var(--brand-soft)] text-[12px] font-extrabold text-brand">
                  {i + 1}
                </span>
                <textarea
                  value={q}
                  rows={2}
                  maxLength={200}
                  aria-label={`나눔 질문 ${i + 1}`}
                  onChange={e => setQuestions(prev => prev.map((p, j) => (j === i ? e.target.value : p)))}
                  className="min-w-0 flex-1 resize-none rounded-lg border border-gray-200 dark:border-white/[0.1] bg-transparent px-2.5 py-2 text-[14px] leading-relaxed text-gray-800 dark:text-white/85 focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  aria-label={`질문 ${i + 1} 지우기`}
                  onClick={() => setQuestions(prev => prev.filter((_, j) => j !== i))}
                  className="mt-1.5 rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                >
                  <span className="material-icons-outlined text-[18px]">close</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {questions.length < MAX_QUESTIONS && (
              <button
                type="button"
                onClick={() => setQuestions(prev => [...prev, ''])}
                className="rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              >
                + 질문 추가
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => draft.mutate()}
              className="rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
            >
              {draft.isPending ? '만드는 중…' : 'AI로 다시 만들기'}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {published ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => save.mutate(false)}
                  className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
                >
                  공개 내리기
                </button>
                <button
                  type="button"
                  disabled={busy || !dirty || !hasAny}
                  onClick={() => save.mutate(true)}
                  className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                >
                  고친 내용 공개
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || !dirty}
                  onClick={() => save.mutate(false)}
                  className="rounded-xl px-3 py-2 text-[13px] font-semibold text-gray-600 dark:text-white/65 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
                >
                  저장만
                </button>
                <button
                  type="button"
                  disabled={busy || !hasAny}
                  onClick={() => save.mutate(true)}
                  className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                >
                  성도에게 공개
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default SermonEchoCard
