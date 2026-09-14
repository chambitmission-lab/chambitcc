// 읽기 플랜 Composer — 표 붙여넣기 (주보의 공동체 성경읽기 표 → 일정)
// 서버 파서가 줄별로 분석해 초안 + 오류를 돌려주고, 저장은 Composer 가 한다.
import { useEffect, useState } from 'react'
import { parseSchedule } from '../../../api/biblePlan'
import type { ParseScheduleResponse, PlanDayInput } from '../../../types/biblePlan'
import { showToast } from '../../../utils/toast'
import { SERMON_DEFAULT_LABEL, dayDate, formatPlanDay } from '../../Bible/Plans/planSchedule'

const EXAMPLE = `9/14(월) 단5-6, 시102 | 왕하 5:1-14 김보은 강도사
9/15(화) 단7-8, 시103 | 왕하 5:15-27 최요한 목사
9/18(금) 호1-4, 시106 | 왕하 6:24-7:2 배닛시 목사
9/20(주일) 호10-14, 시108 | 개인묵상`

const PREVIEW_LIMIT = 7

interface Props {
  /** 1일차 날짜 'YYYY-MM-DD' — 비어 있으면 첫 날짜 줄이 1일차 */
  anchorDate: string
  /** 분석 결과 반영. days=null 이면 적용할 일정 없음(초기화) */
  onParsed: (days: PlanDayInput[] | null, anchorDate: string | null) => void
}

const PlanSchedulePaste = ({ anchorDate, onParsed }: Props) => {
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<ParseScheduleResponse | null>(null)
  const [stale, setStale] = useState(false)

  // 분석 뒤에 1일차 날짜를 바꾸면 날짜 줄의 일차 번호가 달라진다 — 다시 분석하게 한다
  useEffect(() => {
    if (!result?.anchor_date || !anchorDate || anchorDate === result.anchor_date) return
    setStale(true)
    onParsed(null, null)
  }, [anchorDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleParse = async () => {
    if (!text.trim()) {
      showToast('표 내용을 붙여넣어 주세요', 'error')
      return
    }
    setParsing(true)
    try {
      const res = await parseSchedule(text, anchorDate || null)
      setResult(res)
      setStale(false)
      onParsed(res.days.length ? res.days : null, res.anchor_date ?? null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '분석에 실패했습니다', 'error')
    } finally {
      setParsing(false)
    }
  }

  const handleTextChange = (value: string) => {
    setText(value)
    if (result) {
      setResult(null)
      onParsed(null, null)
    }
  }

  const anchor = anchorDate || result?.anchor_date || null

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={6}
        placeholder={EXAMPLE}
        spellCheck={false}
        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[12.5px] leading-[1.7] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand resize-y font-mono"
      />
      <ul className="mt-1.5 space-y-0.5 text-[11px] leading-[1.55] text-gray-500 dark:text-white/45">
        <li>· 한 줄에 하루. 날짜를 적으면 1일차 날짜 기준으로 일차가 정해져요</li>
        <li>· <b className="font-semibold">|</b> 뒤는 새벽기도회 본문과 설교자 (없으면 생략, "개인묵상"처럼 메모도 가능)</li>
      </ul>

      <div className="mt-2.5 flex items-center gap-2">
        {!text && (
          <button
            type="button"
            onClick={() => handleTextChange(EXAMPLE)}
            className="text-[12px] font-semibold text-gray-500 dark:text-white/55 hover:text-brand"
          >
            예시 넣어보기
          </button>
        )}
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="ml-auto px-3.5 py-1.5 rounded-full bg-brand hover:bg-brand-dim text-white text-[12.5px] font-bold disabled:opacity-40"
        >
          {parsing ? '분석 중…' : result ? '다시 분석' : '분석하기'}
        </button>
      </div>

      {stale && (
        <p className="mt-2 text-[11.5px] font-semibold text-amber-600 dark:text-amber-300">
          1일차 날짜가 바뀌었어요. 다시 분석해 주세요
        </p>
      )}

      {result && !stale && (
        <div className="mt-3 space-y-2">
          <p className="text-[12px] font-bold text-ink-strong">
            {result.days.length}일 인식
            {result.errors.length > 0 && (
              <span className="ml-1.5 text-red-500 dark:text-red-300">
                · {result.errors.length}줄 확인 필요 (저장 시 빠져요)
              </span>
            )}
          </p>

          {result.errors.length > 0 && (
            <ul className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-400/30 px-3 py-2 space-y-1">
              {result.errors.map((err) => (
                <li key={err.line} className="text-[11.5px] leading-[1.5] text-red-600 dark:text-red-300">
                  <b className="font-bold">{err.line}줄</b> {err.message}
                  <span className="block truncate text-red-400/90 dark:text-red-300/60">{err.text}</span>
                </li>
              ))}
            </ul>
          )}

          {result.days.length > 0 && (
            <ul className="rounded-xl bg-white/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] divide-y divide-gray-100 dark:divide-white/[0.05]">
              {result.days.slice(0, PREVIEW_LIMIT).map((d) => {
                const dateLabel = anchor ? formatPlanDay(dayDate(anchor, d.day_number)) : null
                const sermonRef = result.sermon_references[String(d.day_number)]
                const sermonText = d.sermon
                  ? [sermonRef, d.sermon.preacher].filter(Boolean).join(' · ') || d.sermon.note
                  : null
                return (
                  <li key={d.day_number} className="px-3 py-2">
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-white/45">
                      {d.day_number}일차{dateLabel ? ` · ${dateLabel}` : ''}
                    </p>
                    <p className="text-[13px] font-bold text-ink-strong truncate">{d.title}</p>
                    {sermonText && (
                      <p className="text-[11.5px] text-gray-500 dark:text-white/55 truncate">
                        {d.sermon?.label || SERMON_DEFAULT_LABEL} · {sermonText}
                      </p>
                    )}
                  </li>
                )
              })}
              {result.days.length > PREVIEW_LIMIT && (
                <li className="px-3 py-2 text-[11.5px] text-gray-500 dark:text-white/50">
                  외 {result.days.length - PREVIEW_LIMIT}일
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default PlanSchedulePaste
