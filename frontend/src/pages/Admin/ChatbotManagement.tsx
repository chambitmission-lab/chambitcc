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

// 챗봇 관리 — 미답변 질문함(교인들이 실제로 묻는 말)과 인텐트 사전(키워드 → 답변).
// 미답변 질문을 인텐트로 승격시키는 것이 챗봇이 자라는 핵심 경로다.

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

const ChatbotManagement = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('unanswered')
  const [unanswered, setUnanswered] = useState<ChatbotUnanswered[]>([])
  const [intents, setIntents] = useState<ChatbotIntent[]>([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)

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

  const openCount = unanswered.filter((u) => u.status === 'open').length

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-ink-strong mb-1">💬 챗봇 관리</h1>
      <p className="text-[13px] text-ink-muted mb-4">
        답하지 못한 질문에 키워드와 답변을 등록하면, 말씀비서가 다음부터 스스로 답합니다.
      </p>

      {/* 탭 */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab('unanswered')}
          className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${
            tab === 'unanswered'
              ? 'bg-[var(--brand)] text-brand-on'
              : 'bg-surface-container text-ink'
          }`}
        >
          미답변 질문 {openCount > 0 && `(${openCount})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('intents')}
          className={`rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors ${
            tab === 'intents' ? 'bg-[var(--brand)] text-brand-on' : 'bg-surface-container text-ink'
          }`}
        >
          인텐트 사전 ({intents.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'unanswered' ? (
        /* ── 미답변 질문함 ── */
        <div className="flex flex-col gap-2">
          {unanswered.length === 0 && (
            <p className="text-center text-[14px] text-ink-muted py-14">
              미답변 질문이 없어요. 챗봇이 모든 질문에 답하고 있습니다 🎉
            </p>
          )}
          {unanswered.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-border-light dark:border-border-dark bg-surface-container px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 text-[14.5px] text-ink break-words">{u.text}</p>
                  <p className="m-0 mt-1 text-[12px] text-ink-muted">
                    {fmtDate(u.created_at)} · {u.ask_count}회 질문됨
                    {u.status === 'resolved' && ' · ✅ 해결됨'}
                  </p>
                </div>
              </div>
              {u.status === 'open' && (
                <div className="flex gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => promoteToIntent(u)}
                    className="rounded-full px-3 py-1 text-[12.5px] font-semibold text-brand-on"
                    style={{ background: 'var(--brand)' }}
                  >
                    ✍️ 답변 만들기
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveUnanswered(u)}
                    className="rounded-full border px-3 py-1 text-[12.5px] font-medium text-ink"
                    style={{ borderColor: 'var(--brand)' }}
                  >
                    해결됨 표시
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeUnanswered(u)}
                    className="rounded-full px-3 py-1 text-[12.5px] text-ink-muted hover:text-ig-red"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ── 인텐트 사전 ── */
        <div className="flex flex-col gap-2">
          {!editor && (
            <button
              type="button"
              onClick={() => openIntentEditor()}
              className="self-start rounded-full px-4 py-1.5 text-[13.5px] font-semibold text-brand-on mb-1"
              style={{ background: 'var(--brand)' }}
            >
              ＋ 새 인텐트
            </button>
          )}

          {editor && (
            <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-container px-4 py-4 mb-2 flex flex-col gap-3">
              <p className="m-0 text-[14px] font-bold text-ink-strong">
                {editor.id == null ? '새 인텐트' : '인텐트 수정'}
                {editor.sourceUnansweredId != null && ' (미답변 질문에서 승격)'}
              </p>
              <label className="flex flex-col gap-1 text-[12.5px] text-ink-muted">
                이름
                <input
                  value={editor.name}
                  onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                  placeholder="예) 주차 안내"
                  className="rounded-lg bg-surface px-3 py-2 text-[14px] text-ink border border-border-light dark:border-border-dark outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] text-ink-muted">
                키워드 (쉼표로 구분 — 질문에 이 단어가 있으면 발동)
                <input
                  value={editor.keywords}
                  onChange={(e) => setEditor({ ...editor, keywords: e.target.value })}
                  placeholder="예) 주차, 주차장, 차 세울"
                  className="rounded-lg bg-surface px-3 py-2 text-[14px] text-ink border border-border-light dark:border-border-dark outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </label>
              <label className="flex flex-col gap-1 text-[12.5px] text-ink-muted">
                답변
                <textarea
                  value={editor.answer}
                  onChange={(e) => setEditor({ ...editor, answer: e.target.value })}
                  rows={4}
                  placeholder="챗봇이 할 답변을 적어주세요"
                  className="rounded-lg bg-surface px-3 py-2 text-[14px] text-ink border border-border-light dark:border-border-dark outline-none focus-visible:ring-2 focus-visible:ring-brand resize-y"
                />
              </label>

              {/* 선택: 답변 아래 버튼(칩) */}
              <div className="flex flex-col gap-2">
                <span className="text-[12.5px] text-ink-muted">
                  버튼 (선택 — 답변 아래에 붙는 이동/재질문 칩)
                </span>
                {editor.actions.map((a, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <input
                      value={a.label}
                      onChange={(e) => setAction(idx, { label: e.target.value })}
                      placeholder="라벨"
                      className="w-28 rounded-lg bg-surface px-2 py-1.5 text-[13px] text-ink border border-border-light dark:border-border-dark"
                    />
                    <select
                      value={a.type}
                      onChange={(e) => setAction(idx, { type: e.target.value as ChatAction['type'] })}
                      className="rounded-lg bg-surface px-1.5 py-1.5 text-[13px] text-ink border border-border-light dark:border-border-dark"
                    >
                      <option value="link">페이지 이동</option>
                      <option value="message">메시지 전송</option>
                    </select>
                    <input
                      value={a.value}
                      onChange={(e) => setAction(idx, { value: e.target.value })}
                      placeholder={a.type === 'link' ? '/worship' : '예배 시간 알려줘'}
                      className="flex-1 min-w-0 rounded-lg bg-surface px-2 py-1.5 text-[13px] text-ink border border-border-light dark:border-border-dark"
                    />
                    <button
                      type="button"
                      aria-label="버튼 삭제"
                      onClick={() =>
                        setEditor({ ...editor, actions: editor.actions.filter((_, i) => i !== idx) })
                      }
                      className="text-ink-muted hover:text-ig-red px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {editor.actions.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditor({
                        ...editor,
                        actions: [...editor.actions, { label: '', type: 'link', value: '' }],
                      })
                    }
                    className="self-start text-[12.5px] text-brand"
                  >
                    ＋ 버튼 추가
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={editor.is_active}
                  onChange={(e) => setEditor({ ...editor, is_active: e.target.checked })}
                />
                활성화
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void saveIntent()}
                  disabled={saving}
                  className="rounded-full px-4 py-1.5 text-[13.5px] font-semibold text-brand-on disabled:opacity-50"
                  style={{ background: 'var(--brand)' }}
                >
                  {saving ? '저장 중…' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="rounded-full px-4 py-1.5 text-[13.5px] text-ink-muted"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {intents.length === 0 && !editor && (
            <p className="text-center text-[14px] text-ink-muted py-14">
              등록된 인텐트가 없어요. 미답변 질문에서 '답변 만들기'로 시작해 보세요.
            </p>
          )}
          {intents.map((it) => (
            <div
              key={it.id}
              className="rounded-xl border border-border-light dark:border-border-dark bg-surface-container px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-[14.5px] font-semibold text-ink-strong">
                  {it.name}
                  {!it.is_active && (
                    <span className="ml-2 text-[11.5px] font-normal text-ink-muted">(비활성)</span>
                  )}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openIntentEditor(it)}
                    className="text-[12.5px] text-brand"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleIntent(it)}
                    className="text-[12.5px] text-ink-muted"
                  >
                    {it.is_active ? '끄기' : '켜기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeIntent(it)}
                    className="text-[12.5px] text-ink-muted hover:text-ig-red"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {it.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full px-2 py-0.5 text-[11.5px] text-brand"
                    style={{ background: 'var(--brand-soft)' }}
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="m-0 mt-1.5 text-[13px] text-ink-muted line-clamp-2 whitespace-pre-line">
                {it.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChatbotManagement
