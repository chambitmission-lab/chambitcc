// 성경 해석 AI 일괄 생성 (admin, /admin/bible-commentaries)
// 해석 없는 절을 골라 Gemini로 1건씩 생성·저장하는 백엔드 엔드포인트
// (POST /bible-commentaries/ai-batch-generate-one)를 원하는 횟수만큼 순차 호출하며
// 진행률을 보여준다. 1건씩 호출하므로 타임아웃에 안전하고 중간 중단도 가능.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { useBibleBooks } from '../../hooks/useBible'
import { batchGenerateOneCommentary } from '../../api/bibleCommentary'

interface LogEntry {
  ok: boolean
  text: string
}

const BibleCommentaryManagement = () => {
  const navigate = useNavigate()
  const { data: books } = useBibleBooks()

  // 범위/개수 설정
  const [bookNumber, setBookNumber] = useState<number | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const [count, setCount] = useState(20)

  // 진행 상태
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0) // 시도한 건수
  const [ok, setOk] = useState(0)
  const [fail, setFail] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [finished, setFinished] = useState(false) // 더 채울 절 없음
  const [logs, setLogs] = useState<LogEntry[]>([])

  // 중단 플래그 (루프가 매 반복마다 확인)
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
    }
  }, [navigate])

  const bookMap = useMemo(() => {
    const m = new Map<number, string>()
    books?.forEach((b) => m.set(b.book_number, b.book_name_ko))
    return m
  }, [books])

  const selectedBook = useMemo(
    () => books?.find((b) => b.book_number === bookNumber) ?? null,
    [books, bookNumber],
  )

  const refLabel = (b: number, ch: number, v: number) =>
    `${bookMap.get(b) ?? `${b}권`} ${ch}:${v}`

  const handleStart = async () => {
    if (running) return
    cancelRef.current = false
    setRunning(true)
    setDone(0)
    setOk(0)
    setFail(0)
    setRemaining(null)
    setFinished(false)
    setLogs([])

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < count; i++) {
      if (cancelRef.current) break
      try {
        const res = await batchGenerateOneCommentary(
          bookNumber ?? undefined,
          chapter ?? undefined,
        )
        setRemaining(res.remaining)
        if (res.done || !res.saved) {
          setFinished(true)
          setLogs((prev) => [
            { ok: true, text: '✓ 채울 절이 더 없습니다. 완료!' },
            ...prev,
          ])
          break
        }
        successCount += 1
        setOk(successCount)
        const s = res.saved
        setLogs((prev) => [
          {
            ok: true,
            text: `${refLabel(s.book_number, s.chapter, s.verse_start)}  (남은 ${res.remaining})`,
          },
          ...prev,
        ])
      } catch (e) {
        failCount += 1
        setFail(failCount)
        const msg = e instanceof Error ? e.message : '생성 실패'
        setLogs((prev) => [{ ok: false, text: `✗ ${msg}` }, ...prev])
      } finally {
        setDone(i + 1)
      }
    }

    setRunning(false)
    if (!cancelRef.current) {
      if (failCount === 0) {
        showToast(`완료: ${successCount}건 생성`, 'success')
      } else {
        showToast(`완료: 성공 ${successCount} / 실패 ${failCount}`, 'error')
      }
    }
  }

  const handleStop = () => {
    cancelRef.current = true
  }

  const progressPct = count > 0 ? Math.round((done / count) * 100) : 0

  const inputCls =
    'w-full h-11 rounded-xl px-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-white/[0.08] text-[14px] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/40'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">
        {/* 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-gray-900 dark:text-white">성경 해석 생성</h1>
          <span className="w-12" />
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* 안내 */}
          <p className="text-[13px] leading-relaxed text-gray-500 dark:text-white/55">
            해석이 아직 없는 절을 정경 순서대로 골라 AI가 해석을 생성해 바로 저장합니다.
            저장된 해석은 말씀 화면에서 수정·삭제할 수 있습니다.
          </p>

          {/* 범위 설정 */}
          <div className="space-y-3 rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-card-dark p-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 dark:text-white/60 mb-1.5">
                대상 책 (선택)
              </label>
              <select
                value={bookNumber ?? ''}
                disabled={running}
                onChange={(e) => {
                  const v = e.target.value
                  setBookNumber(v === '' ? null : Number(v))
                  setChapter(null)
                }}
                className={inputCls}
              >
                <option value="">전체 (창세기부터)</option>
                {books?.map((b) => (
                  <option key={b.book_number} value={b.book_number}>
                    {b.book_name_ko}
                  </option>
                ))}
              </select>
            </div>

            {selectedBook && (
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 dark:text-white/60 mb-1.5">
                  대상 장 (선택)
                </label>
                <select
                  value={chapter ?? ''}
                  disabled={running}
                  onChange={(e) => {
                    const v = e.target.value
                    setChapter(v === '' ? null : Number(v))
                  }}
                  className={inputCls}
                >
                  <option value="">전체 장</option>
                  {Array.from({ length: selectedBook.chapter_count }, (_, i) => i + 1).map(
                    (ch) => (
                      <option key={ch} value={ch}>
                        {ch}장
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-gray-600 dark:text-white/60 mb-1.5">
                생성 개수
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={count}
                disabled={running}
                onChange={(e) =>
                  setCount(Math.max(1, Math.min(300, Number(e.target.value) || 1)))
                }
                className={inputCls}
              />
              <p className="mt-1 text-[11.5px] text-gray-400 dark:text-white/40">
                한 번에 최대 300개. 1건씩 순차로 생성하며 도중에 멈출 수 있습니다.
              </p>
            </div>
          </div>

          {/* 시작 / 중단 버튼 */}
          {!running ? (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-gray-200 dark:bg-white/[0.07] text-gray-400 dark:text-white/30 text-[15px] font-bold cursor-not-allowed"
            >
              <span className="material-icons-round text-[20px]">block</span>
              {count}개 생성 시작 (비활성화됨)
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full inline-flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white text-[15px] font-bold transition-all"
            >
              <span className="material-icons-round text-[20px] animate-spin">refresh</span>
              생성 중... (눌러서 중단)
            </button>
          )}

          {/* 진행률 */}
          {(running || done > 0) && (
            <div className="space-y-3 rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-card-dark p-4">
              <div className="flex items-center justify-between text-[13px] font-semibold">
                <span className="text-gray-700 dark:text-white/80">
                  진행 {done} / {count}
                </span>
                <span className="text-purple-600 dark:text-purple-300">{progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-[12px]">
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                  성공 {ok}
                </span>
                {fail > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-semibold">
                    실패 {fail}
                  </span>
                )}
                {remaining != null && (
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold">
                    남은 절 {remaining}
                  </span>
                )}
              </div>
              {finished && (
                <p className="text-[12.5px] text-green-600 dark:text-green-400 font-semibold">
                  ✓ 이 범위에 더 채울 절이 없습니다.
                </p>
              )}
            </div>
          )}

          {/* 로그 */}
          {logs.length > 0 && (
            <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-card-dark p-3 max-h-72 overflow-y-auto space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`text-[12.5px] px-2 py-1 rounded-lg ${
                    log.ok
                      ? 'text-gray-600 dark:text-white/70'
                      : 'text-red-600 dark:text-red-400 bg-red-500/[0.06]'
                  }`}
                >
                  {log.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BibleCommentaryManagement
