// 챗봇 관리 — 미답변 질문함(교인들이 실제로 묻는 말)과 인텐트 사전(키워드 → 답변).
// 미답변 질문을 인텐트로 승격시키는 것이 챗봇이 자라는 핵심 경로다.
// 화면 틀은 WeeklyPrayerManagement 와 동일: 헤더 + PC 2단(목록/작업 레일) 구성.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  getChatbotUnanswered,
  updateChatbotUnanswered,
  deleteChatbotUnanswered,
  getChatbotIntents,
  createChatbotIntent,
  updateChatbotIntent,
  deleteChatbotIntent,
} from '../../api/chatbot'
import type { ChatAction, ChatbotIntent, ChatbotUnanswered } from '../../types/chatbot'

type Tab = 'unanswered' | 'intents'

interface EditorState {
  id: number | null            // null = 새 인텐트
  name: string
  keywords: string             // 쉼표 구분 입력
  answer: string
  actions: ChatAction[]
  is_active: boolean
  sourceUnansweredId: number | null // 미답변에서 승격한 경우 저장 후 해결 처리
}

const emptyEditor = (): EditorState => ({
  id: null,
  name: '',
  keywords: '',
  answer: '',
  actions: [],
  is_active: true,
  sourceUnansweredId: null,
})

const fmtDate = (s: string) => {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`
}

// brand 계열은 CSS 변수 색이라 투명도 수식자(border-brand/60 등)가 생성되지
// 않는다 — 옅은 톤이 필요하면 --brand-soft / --brand-glow 토큰을 쓴다
const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[14px] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:border-brand transition-colors'

const smallBtnCls =
  'px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.1] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors'

const dangerBtnCls =
  'px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'

const ChatbotManagement = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('unanswered')
  const [unanswered, setUnanswered] = useState<ChatbotUnanswered[]>([])
  const [intents, setIntents] = useState<ChatbotIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [showResolved, setShowResolved] = useState(false)
  const [showKeywordGuide, setShowKeywordGuide] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, i] = await Promise.all([getChatbotUnanswered(), getChatbotIntents()])
      setUnanswered(u)
      setIntents(i)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '불러오기에 실패했습니다', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin()) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void load()
  }, [navigate, load])

  // ── 미답변 처리 ────────────────────────────────────────────────

  const promoteToIntent = (item: ChatbotUnanswered) => {
    setTab('intents')
    setEditor({
      ...emptyEditor(),
      name: item.text.slice(0, 40),
      sourceUnansweredId: item.id,
    })
    // 모바일에선 편집 폼이 상단(작업 영역)에 뜨므로 위로 올려준다
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resolveUnanswered = async (item: ChatbotUnanswered) => {
    try {
      await updateChatbotUnanswered(item.id, { status: 'resolved' })
      setUnanswered((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: 'resolved' } : u)),
      )
    } catch (e) {
      showToast(e instanceof Error ? e.message : '처리에 실패했습니다', 'error')
    }
  }

  const removeUnanswered = async (item: ChatbotUnanswered) => {
    if (!(await confirmDialog({ message: '이 질문을 삭제할까요?', description: item.text }))) return
    try {
      await deleteChatbotUnanswered(item.id)
      setUnanswered((prev) => prev.filter((u) => u.id !== item.id))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  // ── 인텐트 편집 ────────────────────────────────────────────────

  const openIntentEditor = (intent?: ChatbotIntent) => {
    setEditor(
      intent
        ? {
            id: intent.id,
            name: intent.name,
            keywords: intent.keywords.join(', '),
            answer: intent.answer,
            actions: intent.actions ?? [],
            is_active: intent.is_active,
            sourceUnansweredId: null,
          }
        : emptyEditor(),
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveIntent = async () => {
    if (!editor) return
    const keywords = editor.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    if (!editor.name.trim() || keywords.length === 0 || !editor.answer.trim()) {
      showToast('이름·키워드·답변을 모두 입력해 주세요', 'error')
      return
    }
    const actions = editor.actions.filter((a) => a.label.trim() && a.value.trim())
    setSaving(true)
    try {
      const payload = {
        name: editor.name.trim(),
        keywords,
        answer: editor.answer.trim(),
        actions,
        is_active: editor.is_active,
        order: 0,
      }
      if (editor.id == null) {
        await createChatbotIntent(payload)
        if (editor.sourceUnansweredId != null) {
          await updateChatbotUnanswered(editor.sourceUnansweredId, {
            status: 'resolved',
            answer: payload.answer,
          }).catch(() => undefined)
        }
        showToast('인텐트를 등록했어요. 이제 챗봇이 이 질문에 답합니다!', 'success')
      } else {
        await updateChatbotIntent(editor.id, payload)
        showToast('인텐트를 수정했어요', 'success')
      }
      setEditor(null)
      void load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '저장에 실패했습니다', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleIntent = async (intent: ChatbotIntent) => {
    try {
      await updateChatbotIntent(intent.id, { is_active: !intent.is_active })
      setIntents((prev) =>
        prev.map((i) => (i.id === intent.id ? { ...i, is_active: !i.is_active } : i)),
      )
    } catch (e) {
      showToast(e instanceof Error ? e.message : '변경에 실패했습니다', 'error')
    }
  }

  const removeIntent = async (intent: ChatbotIntent) => {
    if (!(await confirmDialog({ message: `'${intent.name}' 인텐트를 삭제할까요?` }))) return
    try {
      await deleteChatbotIntent(intent.id)
      setIntents((prev) => prev.filter((i) => i.id !== intent.id))
      if (editor?.id === intent.id) setEditor(null)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const setAction = (idx: number, patch: Partial<ChatAction>) => {
    setEditor((prev) =>
      prev
        ? { ...prev, actions: prev.actions.map((a, i) => (i === idx ? { ...a, ...patch } : a)) }
        : prev,
    )
  }

  const openList = unanswered.filter((u) => u.status === 'open')
  const resolvedList = unanswered.filter((u) => u.status !== 'open')
  const activeCount = intents.filter((i) => i.is_active).length

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${
      active
        ? 'bg-brand text-white shadow-[0_4px_12px_-4px_var(--brand-glow)]'
        : 'bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
    }`

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자로 만든다 — #root 의 overflow-y 탓에
    // sticky 가 전역으로 죽어 있어, 이 상자가 있어야 우측 작업 레일 sticky 가 산다.
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100vh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24 lg:max-w-[1180px] lg:mt-2 lg:mb-10 lg:min-h-0 lg:pb-8 lg:rounded-3xl lg:border">
        {/* 헤더 — lg 에선 우측 작업 레일이 sticky 를 맡으므로 풀어 둔다 */}
        <div className="sticky top-0 lg:static lg:rounded-t-3xl z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">💬 챗봇 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* PC(lg+) 2단 — 좌: 질문/인텐트 목록 / 우: 작업 레일(통계·새 인텐트·편집 폼)이 sticky.
            래퍼 2개는 lg 미만에서 display:contents 라 모바일 흐름은 위→아래 그대로다. */}
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6 lg:items-start lg:px-5 lg:pt-5">
          {/* ── 작업 레일 ── */}
          <div className="contents lg:block lg:col-start-2 lg:row-start-1 lg:sticky lg:top-3 lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto lg:pr-1 lg:space-y-3">
            {/* 통계 칩 */}
            <div className="px-4 pt-4 lg:px-0 lg:pt-0 flex gap-2 flex-wrap">
              <StatChip label="미답변" value={openList.length} warn={openList.length > 0} />
              <StatChip label="인텐트" value={intents.length} />
              <StatChip label="활성" value={activeCount} accent />
            </div>

            {/* 액션 버튼 */}
            <div className="px-4 pt-3 lg:px-0 lg:pt-0 flex gap-2">
              <button
                onClick={() => openIntentEditor()}
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dim text-white text-sm font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] transition-colors active:scale-[0.98]"
              >
                + 새 인텐트
              </button>
            </div>

            {/* 인텐트 편집 폼 */}
            {editor && (
              <div className="px-4 py-3 lg:px-0 lg:py-0">
                <div className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink-strong">
                      {editor.id == null ? '새 인텐트' : '인텐트 수정'}
                      {editor.sourceUnansweredId != null && (
                        <span className="ml-1.5 text-[11px] font-semibold text-brand">
                          미답변에서 승격
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={() => setEditor(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-white/70"
                    >
                      닫기 ✕
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">
                      이름 (관리용)
                    </label>
                    <input
                      value={editor.name}
                      onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                      placeholder="예) 주차 안내"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">
                      키워드 — 질문에 이 단어가 있으면 발동
                    </label>
                    <input
                      value={editor.keywords}
                      onChange={(e) => setEditor({ ...editor, keywords: e.target.value })}
                      placeholder="예) 주차, 주차장, 차 세울"
                      className={inputCls}
                    />
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="m-0 text-[11px] text-gray-400 dark:text-white/40 leading-relaxed">
                        쉼표(,)로 여러 개 등록 · 띄어쓰기가 달라도 알아들어요
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowKeywordGuide((v) => !v)}
                        className="shrink-0 text-[11px] font-semibold text-brand hover:underline"
                      >
                        💡 잘 등록하는 법 {showKeywordGuide ? '접기' : '보기'}
                      </button>
                    </div>
                    {showKeywordGuide && (
                      <div className="mt-1.5 rounded-xl border border-[var(--brand-glow)] bg-[var(--brand-soft)] p-3 space-y-2 text-[11.5px] leading-relaxed">
                        <p className="m-0 text-gray-700 dark:text-white/80">
                          질문 속에 키워드 중 <b>하나라도 그대로 들어 있으면</b> 이 답변이 나갑니다.
                          그래서 키워드는 <b>그 단어만 봐도 주제를 알 수 있는 말</b>이어야 해요.
                        </p>
                        <div>
                          <p className="m-0 font-bold text-green-700 dark:text-green-300">⭕ 좋은 예</p>
                          <p className="m-0 text-gray-600 dark:text-white/65">
                            · 주차 안내 → <b>주차, 주차장, 차 세울</b>
                            <br />· 담임목사님 소개 → <b>담임목사, 목사님 성함, 목사님 이름</b>
                            <br />· 헌금 계좌 → <b>헌금 계좌, 계좌번호, 온라인 헌금</b>
                          </p>
                        </div>
                        <div>
                          <p className="m-0 font-bold text-red-600 dark:text-red-300">❌ 피해야 할 키워드</p>
                          <p className="m-0 text-gray-600 dark:text-white/65">
                            · <b>뭐야, 알려줘, 언제, ?</b> — 아무 질문에나 들어가는 말이라 엉뚱한 답이 나가요
                            <br />· <b>성함, 이름, 시간</b> 단독 — 누구/무엇의 것인지 특정이 안 돼요
                            → <b>목사님 성함</b>처럼 대상과 붙여 주세요
                          </p>
                        </div>
                        <p className="m-0 text-gray-500 dark:text-white/50">
                          확신이 안 서면 좁게 등록하세요 — 못 알아들은 질문은 미답변함에 쌓이니
                          거기서 키워드를 보태면 됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-white/50 mb-1">
                      답변
                    </label>
                    <textarea
                      value={editor.answer}
                      onChange={(e) => setEditor({ ...editor, answer: e.target.value })}
                      rows={4}
                      placeholder="챗봇이 할 답변을 적어주세요"
                      className={`${inputCls} resize-y`}
                    />
                  </div>

                  {/* 선택: 답변 아래 버튼(칩) */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-semibold text-gray-500 dark:text-white/50">
                      버튼 (선택 — 답변 아래에 붙는 이동/재질문 칩)
                    </span>
                    {editor.actions.map((a, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          value={a.label}
                          onChange={(e) => setAction(idx, { label: e.target.value })}
                          placeholder="라벨"
                          className={`${inputCls} !w-24 shrink-0 !px-2 !py-1.5 !text-[13px]`}
                        />
                        <select
                          value={a.type}
                          onChange={(e) => setAction(idx, { type: e.target.value as ChatAction['type'] })}
                          className={`${inputCls} !w-auto shrink-0 !px-1.5 !py-1.5 !text-[13px]`}
                        >
                          <option value="link">페이지 이동</option>
                          <option value="message">메시지 전송</option>
                        </select>
                        <input
                          value={a.value}
                          onChange={(e) => setAction(idx, { value: e.target.value })}
                          placeholder={a.type === 'link' ? '/worship' : '예배 시간 알려줘'}
                          className={`${inputCls} flex-1 min-w-0 !px-2 !py-1.5 !text-[13px]`}
                        />
                        <button
                          type="button"
                          aria-label="버튼 삭제"
                          onClick={() =>
                            setEditor({ ...editor, actions: editor.actions.filter((_, i) => i !== idx) })
                          }
                          className="px-1 text-red-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {editor.actions.length < 3 && (
                      <button
                        onClick={() =>
                          setEditor({
                            ...editor,
                            actions: [...editor.actions, { label: '', type: 'link', value: '' }],
                          })
                        }
                        className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.15] text-sm text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand transition-colors"
                      >
                        + 버튼 추가
                      </button>
                    )}
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/80">
                    <input
                      type="checkbox"
                      checked={editor.is_active}
                      onChange={(e) => setEditor({ ...editor, is_active: e.target.checked })}
                      className="w-4 h-4 accent-[var(--brand)]"
                    />
                    바로 활성화 (해제하면 꺼진 상태로 저장)
                  </label>

                  <button
                    onClick={() => void saveIntent()}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-brand hover:bg-brand-dim text-white text-sm font-bold shadow-[0_6px_16px_-6px_var(--brand-glow)] disabled:opacity-50 transition-colors active:scale-[0.99]"
                  >
                    {saving ? '저장 중…' : editor.id == null ? '등록하기' : '수정 저장'}
                  </button>
                </div>
              </div>
            )}

            {/* 폼이 닫혀 있을 때 레일이 비어 보이지 않도록 — PC 전용 안내 */}
            {!editor && (
              <div className="hidden lg:block rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.12] p-5 text-center">
                <p className="text-[13px] font-semibold text-ink-strong">이 자리에서 바로 편집합니다</p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1 leading-relaxed">
                  미답변 질문의 <span className="font-semibold text-brand">✍️ 답변 만들기</span>를 누르거나
                  <br />위의 <span className="font-semibold text-brand">+ 새 인텐트</span>로 시작하세요.
                </p>
              </div>
            )}
          </div>

          {/* ── 목록 ── */}
          <div className="contents lg:block lg:col-start-1 lg:row-start-1 lg:min-w-0">
            <p className="m-0 px-4 pt-4 lg:px-1 lg:pt-0 text-[12.5px] text-gray-500 dark:text-white/55 leading-relaxed">
              답하지 못한 질문에 키워드와 답변을 등록하면, 참비가 다음부터 스스로 답합니다.
            </p>

            {/* 탭 */}
            <div className="px-4 pt-3 lg:px-1 flex gap-2">
              <button onClick={() => setTab('unanswered')} className={tabCls(tab === 'unanswered')}>
                미답변 질문{openList.length > 0 && ` (${openList.length})`}
              </button>
              <button onClick={() => setTab('intents')} className={tabCls(tab === 'intents')}>
                인텐트 사전 ({intents.length})
              </button>
            </div>

            <div className="px-4 py-3 lg:px-0 lg:py-3 lg:pb-8 space-y-2">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tab === 'unanswered' ? (
                /* ── 미답변 질문함 ── */
                <>
                  {openList.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-10">
                      미답변 질문이 없어요. 챗봇이 모든 질문에 답하고 있습니다 🎉
                    </p>
                  )}
                  {openList.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.08] p-4"
                    >
                      <p className="m-0 text-[14.5px] font-semibold text-ink-strong break-words">
                        “{u.text}”
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2.5">
                        <p className="m-0 text-[12px] text-gray-500 dark:text-white/50 shrink-0">
                          {fmtDate(u.created_at)} · {u.ask_count}회 질문됨
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => promoteToIntent(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-brand hover:bg-brand-dim text-white text-xs font-bold transition-colors"
                          >
                            ✍️ 답변 만들기
                          </button>
                          <button onClick={() => void resolveUnanswered(u)} className={smallBtnCls}>
                            해결됨
                          </button>
                          <button onClick={() => void removeUnanswered(u)} className={dangerBtnCls}>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 해결된 질문 — 접어 두어 미답변에 집중 */}
                  {resolvedList.length > 0 && (
                    <>
                      <button
                        onClick={() => setShowResolved((v) => !v)}
                        className="w-full py-2 rounded-xl border border-dashed border-gray-300 dark:border-white/[0.12] text-[12.5px] text-gray-500 dark:text-white/50 hover:border-brand hover:text-brand transition-colors"
                      >
                        ✅ 해결된 질문 {resolvedList.length}개 {showResolved ? '접기' : '보기'}
                      </button>
                      {showResolved &&
                        resolvedList.map((u) => (
                          <div
                            key={u.id}
                            className="rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] p-4"
                          >
                            <p className="m-0 text-[14px] text-gray-500 dark:text-white/55 break-words">
                              “{u.text}”
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <p className="m-0 text-[12px] text-gray-400 dark:text-white/40">
                                {fmtDate(u.created_at)} · {u.ask_count}회 질문됨 · ✅ 해결됨
                              </p>
                              <button onClick={() => void removeUnanswered(u)} className={dangerBtnCls}>
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </>
              ) : (
                /* ── 인텐트 사전 ── */
                <>
                  {intents.length === 0 && !editor && (
                    <p className="text-center text-sm text-gray-400 py-10">
                      등록된 인텐트가 없어요.
                      <br />미답변 질문에서 '답변 만들기'로 시작해 보세요.
                    </p>
                  )}
                  {intents.map((it) => (
                    <div
                      key={it.id}
                      className={`rounded-2xl bg-white/80 dark:bg-card-dark border p-4 transition-colors ${
                        editor?.id === it.id
                          ? 'border-[var(--brand-glow)] bg-[var(--brand-soft)]'
                          : 'border-gray-200/70 dark:border-white/[0.08] lg:hover:border-[var(--brand-glow)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="m-0 text-[14.5px] font-bold text-ink-strong truncate">
                          {it.name}
                          {!it.is_active && (
                            <span className="ml-1.5 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">
                              꺼짐
                            </span>
                          )}
                        </p>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => openIntentEditor(it)} className={smallBtnCls}>
                            수정
                          </button>
                          <button onClick={() => void toggleIntent(it)} className={smallBtnCls}>
                            {it.is_active ? '끄기' : '켜기'}
                          </button>
                          <button onClick={() => void removeIntent(it)} className={dangerBtnCls}>
                            삭제
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {it.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-brand"
                            style={{ background: 'var(--brand-soft)' }}
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                      <p className="m-0 mt-2 text-[13px] text-gray-500 dark:text-white/55 line-clamp-2 whitespace-pre-line">
                        {it.answer}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 통계 칩 ─────────────────────────────────────────────
interface StatChipProps {
  label: string
  value: number
  accent?: boolean
  warn?: boolean
}

const StatChip = ({ label, value, accent, warn }: StatChipProps) => {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-semibold '
  const tone = warn
    ? 'bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
    : accent
      ? 'bg-[var(--brand-soft-strong)] border-[var(--brand-glow)] text-brand'
      : 'bg-gray-100 dark:bg-white/[0.05] border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-white/75'
  return (
    <span className={base + tone}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  )
}

export default ChatbotManagement
