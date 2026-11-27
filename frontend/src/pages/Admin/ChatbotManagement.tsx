// 챗봇 관리 = "참비 관제실" (2026-11-27 C1안). 시안: /#/dev/chatbot-admin?v=c1
//   머리: 참비 상태(남색 판) + 최근 7일 새 질문 막대
//   데스크 탭: 질문함(목록|그때 대화|가르치기) · 아는 말(인텐트 표+살펴보기) · 성장 기록(해결 타임라인)
// 미답변 질문을 답(인텐트)으로 승격하는 것이 참비가 자라는 핵심 경로다.
// 답한 비율·요일 막대·인텐트별 사용 횟수는 하루 집계(GET /chatbot/stats, 2026-11-27~)에서 온다 — 못 받으면 미답변함 기준으로만.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../../utils/toast'
import { confirmDialog } from '../../utils/confirmDialog'
import {
  getChatbotUnanswered,
  updateChatbotUnanswered,
  deleteChatbotUnanswered,
  getChatbotIntents,
  getChatbotStats,
  updateChatbotIntent,
  deleteChatbotIntent,
} from '../../api/chatbot'
import type { ChatbotIntent, ChatbotStats, ChatbotUnanswered } from '../../types/chatbot'
import { can } from '../../utils/access'
import ChatbotHero from './chatbot/ChatbotHero'
import QuestionDesk from './chatbot/QuestionDesk'
import KnownWords from './chatbot/KnownWords'
import GrowthLog from './chatbot/GrowthLog'
import { tone } from './chatbot/chatbotTheme'
import { intentHitMap } from './chatbot/chatbotAdminUtils'

type Tab = 'questions' | 'words' | 'growth'

// 서버는 status 없이 부르면 weak·resolved 를 각 200건까지만 내려준다(backend chatbot/admin.LIST_LIMITS)
const LIST_CAP = 200
const capLabel = (n: number) => (n >= LIST_CAP ? `${LIST_CAP}+` : `${n}`)

const ChatbotManagement = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('questions')
  const [unanswered, setUnanswered] = useState<ChatbotUnanswered[]>([])
  const [intents, setIntents] = useState<ChatbotIntent[]>([])
  const [stats, setStats] = useState<ChatbotStats | null>(null)
  const [loading, setLoading] = useState(true)

  // silent: 저장 뒤 다시 불러올 땐 스피너로 화면을 갈아엎지 않는다(가르치기 완료 카드가 남아 있어야 한다)
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      // 집계는 곁들이 — 실패(백엔드 배포 전 404 등)해도 화면은 미답변함 기준으로 그대로 뜬다
      const [u, i, st] = await Promise.all([
        getChatbotUnanswered(),
        getChatbotIntents(),
        getChatbotStats(14).catch(() => null),
      ])
      setUnanswered(u)
      setIntents(i)
      setStats(st)
    } catch (e) {
      showToast(e instanceof Error ? e.message : '불러오기에 실패했습니다', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!can('admin:access')) {
      showToast('관리자 권한이 필요합니다', 'error')
      navigate('/')
      return
    }
    void load()
  }, [navigate, load])

  const reload = useCallback(() => void load(true), [load])

  const resolveQuestion = async (u: ChatbotUnanswered) => {
    try {
      await updateChatbotUnanswered(u.id, { status: 'resolved' })
      setUnanswered((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: 'resolved' } : x)))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '처리에 실패했습니다', 'error')
    }
  }

  const deleteQuestion = async (u: ChatbotUnanswered) => {
    if (!(await confirmDialog({ message: '이 질문을 지울까요?', description: u.text }))) return
    try {
      await deleteChatbotUnanswered(u.id)
      setUnanswered((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const toggleIntent = async (it: ChatbotIntent) => {
    setIntents((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_active: !x.is_active } : x)))
    try {
      await updateChatbotIntent(it.id, { is_active: !it.is_active })
    } catch (e) {
      setIntents((prev) => prev.map((x) => (x.id === it.id ? { ...x, is_active: it.is_active } : x)))
      showToast(e instanceof Error ? e.message : '변경에 실패했습니다', 'error')
    }
  }

  const deleteIntent = async (it: ChatbotIntent) => {
    if (!(await confirmDialog({ message: `‘${it.name}’ 답을 지울까요?`, description: '참비가 이 말을 더 이상 알아듣지 못해요.' })))
      return
    try {
      await deleteChatbotIntent(it.id)
      setIntents((prev) => prev.filter((x) => x.id !== it.id))
    } catch (e) {
      showToast(e instanceof Error ? e.message : '삭제에 실패했습니다', 'error')
    }
  }

  const waitingCount = unanswered.filter((u) => u.status !== 'resolved').length

  const tabs: { k: Tab; label: string; n?: string }[] = [
    { k: 'questions', label: '질문함', n: capLabel(waitingCount) },
    { k: 'words', label: '아는 말', n: `${intents.length}` },
    { k: 'growth', label: '성장 기록' },
  ]

  return (
    // lg 에선 이 페이지만 스스로 스크롤하는 상자 — 우측 패널 sticky·내부 스크롤이 이 상자를 기준으로 산다
    <div className="min-h-screen bg-[var(--app-canvas)] dark:bg-background-dark text-gray-900 dark:text-gray-100 lg:h-[calc(100dvh-56px)] lg:min-h-0 lg:overflow-y-auto">
      <div className="max-w-md mx-auto min-h-screen pb-24 lg:max-w-[1280px] lg:min-h-0 lg:px-6 lg:pt-5 lg:pb-10">
        {/* 헤더 */}
        <div className="sticky top-14 lg:static z-20 bg-[var(--app-canvas)]/95 dark:bg-background-dark/95 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0 px-4 py-3 lg:px-1 lg:pt-0 lg:pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로"
            className="flex items-center gap-1 text-gray-600 dark:text-white/70 hover:text-brand transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className={`m-0 text-[20px] font-extrabold tracking-tight ${tone.strong}`}>참비 관리</h1>
          <span className={`hidden sm:inline text-[14px] ${tone.sub}`}>성도들이 묻는 말을 참비에게 알려 주는 곳</span>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 px-4 lg:px-0">
            <ChatbotHero unanswered={unanswered} intents={intents} stats={stats} />

            <section className={`rounded-3xl ${tone.panel} overflow-hidden lg:shadow-2xl`}>
              <div className={`px-5 lg:px-6 pt-4 border-b ${tone.line} flex gap-6 overflow-x-auto`}>
                {tabs.map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className={`relative shrink-0 pb-3 text-[16px] font-bold transition-colors ${
                      tab === t.k ? tone.strong : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70'
                    }`}
                  >
                    {t.label}
                    {t.n && (
                      <span className={`ml-1.5 text-[14px] ${t.k === 'questions' && waitingCount > 0 ? 'text-amber-600 dark:text-amber-300' : ''}`}>
                        {t.n}
                      </span>
                    )}
                    {tab === t.k && <span className={`absolute left-0 right-0 -bottom-px h-[3px] rounded-full ${tone.accentBg}`} />}
                  </button>
                ))}
              </div>

              {tab === 'questions' ? (
                <QuestionDesk
                  unanswered={unanswered}
                  intents={intents}
                  onSaved={reload}
                  onResolve={(u) => void resolveQuestion(u)}
                  onDelete={(u) => void deleteQuestion(u)}
                />
              ) : tab === 'words' ? (
                <KnownWords
                  intents={intents}
                  onSaved={reload}
                  onToggle={(it) => void toggleIntent(it)}
                  onDelete={(it) => void deleteIntent(it)}
                  hits={stats ? intentHitMap(stats) : null}
                />
              ) : (
                <GrowthLog
                  unanswered={unanswered}
                  intents={intents}
                  capLabel={capLabel}
                  onDelete={(u) => void deleteQuestion(u)}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatbotManagement
