import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isAdmin } from '../../utils/auth'
import { showToast } from '../../utils/toast'
import {
  useAdminSituationCategories,
  useCreateSituationCategory,
  useUpdateSituationCategory,
  useDeleteSituationCategory,
  useAddSituationVerse,
  useRemoveSituationVerse,
  useUpdateSituationVerseMessage,
  useSituationVerses,
  useSeedSituations,
} from '../../hooks/useSituation'
import { getAdminSettings, updateAdminSettings } from '../../api/user'
import type { SituationCategory } from '../../types/situation'

const ICON_OPTIONS = [
  'shield','cloud_off','favorite_border','sentiment_very_dissatisfied',
  'crisis_alert','wb_cloudy','storm','trending_down','help_outline',
  'person','explore','spa','healing','water_drop','favorite','handshake',
  'menu_book','church','star','bolt',
]
const COLOR_OPTIONS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#ef4444',
  '#64748b','#0ea5e9','#10b981','#f97316','#a78bfa',
  '#14b8a6','#22c55e','#f43f5e','#3b82f6','#84cc16',
]

// 기도 감정 태그 (backend prayer.emotion 키와 동일)
const EMOTION_OPTIONS = [
  { key: 'tired', label: '지칠 때' },
  { key: 'anxious', label: '불안할 때' },
  { key: 'grateful', label: '감사할 때' },
  { key: 'sad', label: '슬플 때' },
  { key: 'lonely', label: '외로울 때' },
  { key: 'angry', label: '화날 때' },
  { key: 'hopeful', label: '희망이 필요할 때' },
  { key: 'confused', label: '혼란스러울 때' },
]

const emotionLabel = (key: string) =>
  EMOTION_OPTIONS.find(o => o.key === key)?.label ?? key

// ── 기도 묵상 구절 추천 모드 카드 ─────────────────────────────────────

const RecommendationModeCard = () => {
  const qc = useQueryClient()
  const { data: settings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: getAdminSettings,
    staleTime: 0,
  })
  const mutation = useMutation({
    mutationFn: (mode: 'ai' | 'admin') => updateAdminSettings({ verse_recommendation_mode: mode }),
    onSuccess: data => {
      qc.setQueryData(['adminSettings'], data)
      showToast(
        data.verse_recommendation_mode === 'ai'
          ? 'AI 우선 모드로 변경되었습니다 (실패 시 관리자 구절 폴백)'
          : '관리자 지정 모드로 변경되었습니다 (AI 미사용)',
        'success'
      )
    },
    onError: e => showToast(e instanceof Error ? e.message : '변경 실패', 'error'),
  })

  const mode = settings?.verse_recommendation_mode ?? 'ai'

  return (
    <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-icons-round text-[18px] text-brand">auto_awesome</span>
        <h3 className="text-[13.5px] font-bold text-ink-strong">기도 묵상 구절 추천 방식</h3>
      </div>
      <p className="text-[12px] text-gray-400 dark:text-white/40 mb-3 leading-relaxed">
        기도 등록 시 함께 묵상 구절을 어떻게 고를지 정합니다.
        AI 우선 모드에서도 리밋 등으로 AI가 실패하면 아래 카테고리의 구절이 자동으로 사용됩니다.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { value: 'ai' as const, title: 'AI 우선', desc: '실패 시 관리자 구절 폴백' },
          { value: 'admin' as const, title: '관리자 지정', desc: '항상 아래 카테고리 구절 사용' },
        ]).map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={mutation.isPending || !settings}
            onClick={() => mode !== opt.value && mutation.mutate(opt.value)}
            className={`px-3 py-2.5 rounded-xl border text-left transition-colors disabled:opacity-60 ${
              mode === opt.value
                ? 'border-brand bg-[var(--brand-soft)] shadow-[0_0_10px_var(--brand-glow)]'
                : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${mode === opt.value ? 'bg-brand' : 'bg-gray-300 dark:bg-white/20'}`} />
              <span className="text-[13px] font-bold text-ink-strong">{opt.title}</span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5 leading-snug">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 구절 패널 ─────────────────────────────────────────────────────────

const VersePanel = ({ category, onClose }: { category: SituationCategory; onClose: () => void }) => {
  const { data, isLoading } = useSituationVerses(category.id)
  const addVerse = useAddSituationVerse()
  const removeVerse = useRemoveSituationVerse()
  const updateMessage = useUpdateSituationVerseMessage()
  const [bn, setBn] = useState('')
  const [ch, setCh] = useState('')
  const [vs, setVs] = useState('')
  const [msg, setMsg] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [msgDraft, setMsgDraft] = useState('')

  const handleAdd = async () => {
    const book = parseInt(bn), chapter = parseInt(ch), verse = parseInt(vs)
    if (!book || !chapter || !verse) { showToast('책번호 / 장 / 절을 입력하세요', 'error'); return }
    try {
      await addVerse.mutateAsync({ categoryId: category.id, data: { book_number: book, chapter, verse, order: (data?.verses.length ?? 0), message: msg.trim() || undefined } })
      setBn(''); setCh(''); setVs(''); setMsg('')
      showToast('구절이 추가되었습니다', 'success')
    } catch (e) { showToast(e instanceof Error ? e.message : '추가 실패', 'error') }
  }

  const handleSaveMessage = async (verseRowId: number) => {
    try {
      await updateMessage.mutateAsync({ situationVerseId: verseRowId, message: msgDraft.trim() || null, categoryId: category.id })
      setEditingId(null)
      showToast('위로 메시지가 저장되었습니다', 'success')
    } catch (e) { showToast(e instanceof Error ? e.message : '저장 실패', 'error') }
  }

  const handleRemove = async (svId: number) => {
    if (!confirm('이 구절을 제거할까요?')) return
    try {
      await removeVerse.mutateAsync({ situationVerseId: svId, categoryId: category.id })
      showToast('제거되었습니다', 'success')
    } catch { showToast('제거 실패', 'error') }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <div>
            <h3 className="font-bold text-ink-strong text-[15px]">{category.name}</h3>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">구절 관리</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        {/* 구절 추가 입력 */}
        <div className="px-5 py-3 bg-gray-50 dark:bg-white/[0.03] border-b border-border-light dark:border-border-dark flex-shrink-0">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2">
            구절 추가 — 책번호 / 장 / 절
          </p>
          <div className="flex gap-2">
            {[
              { val: bn, set: setBn, ph: '책번호', w: 'flex-1' },
              { val: ch, set: setCh, ph: '장', w: 'w-16' },
              { val: vs, set: setVs, ph: '절', w: 'w-16' },
            ].map(({ val, set, ph, w }) => (
              <input key={ph} value={val} onChange={e => set(e.target.value)} placeholder={ph} type="number" min="1"
                className={`${w} px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors`} />
            ))}
            <button onClick={handleAdd} disabled={addVerse.isPending}
              className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors flex-shrink-0">
              추가
            </button>
          </div>
          <input value={msg} onChange={e => setMsg(e.target.value)} maxLength={500}
            placeholder="위로 메시지 (선택 — 기도 묵상 추천에 함께 표시)"
            className="mt-2 w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors" />
        </div>

        {/* 구절 목록 */}
        <div className="overflow-y-auto flex-1 divide-y divide-border-light dark:divide-border-dark">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
            </div>
          ) : !data?.verses.length ? (
            <p className="py-12 text-center text-sm text-gray-400 dark:text-white/30">등록된 구절이 없습니다</p>
          ) : data.verses.map(v => (
            <div key={v.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-brand">
                    {v.book_name_ko} {v.chapter}:{v.verse}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-white/70 mt-0.5 line-clamp-2 leading-relaxed">{v.text}</p>
                  {editingId !== v.id && v.message && (
                    <p className="text-[12px] text-gray-400 dark:text-white/40 mt-1 leading-relaxed">
                      💬 {v.message}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex gap-1">
                  <button
                    onClick={() => {
                      if (editingId === v.id) { setEditingId(null) }
                      else { setEditingId(v.id); setMsgDraft(v.message ?? '') }
                    }}
                    title="위로 메시지 편집"
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-brand dark:text-white/20 dark:hover:text-brand hover:bg-[var(--brand-soft)] transition-colors">
                    <span className="material-icons-outlined text-[16px]">chat_bubble_outline</span>
                  </button>
                  <button onClick={() => handleRemove(v.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <span className="material-icons-outlined text-[17px]">delete_outline</span>
                  </button>
                </div>
              </div>
              {editingId === v.id && (
                <div className="mt-2">
                  <textarea value={msgDraft} onChange={e => setMsgDraft(e.target.value)} rows={2} maxLength={500}
                    placeholder="이 구절과 함께 보여줄 위로 메시지"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors resize-none" />
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => handleSaveMessage(v.id)} disabled={updateMessage.isPending}
                      className="px-3 py-1.5 text-[12px] font-semibold bg-brand text-white rounded-lg hover:bg-brand-dim disabled:opacity-50 transition-colors">
                      저장
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-[12px] text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 카테고리 폼 패널 ──────────────────────────────────────────────────

const CategoryForm = ({
  initial, onSave, onCancel, isPending,
}: {
  initial: {
    name: string; icon: string; color: string; order: number; is_active: boolean
    emotion_keys: string[]; keywords: string; is_default: boolean
  }
  onSave: (v: typeof initial) => void
  onCancel: () => void
  isPending: boolean
}) => {
  const [form, setForm] = useState(initial)

  const toggleEmotion = (key: string) =>
    setForm(f => ({
      ...f,
      emotion_keys: f.emotion_keys.includes(key)
        ? f.emotion_keys.filter(k => k !== key)
        : [...f.emotion_keys, key],
    }))
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="w-full max-w-md bg-background-light dark:bg-background-dark rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark flex-shrink-0">
          <h3 className="font-bold text-ink-strong text-[15px]">
            {initial.name ? '카테고리 수정' : '새 카테고리'}
          </h3>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <span className="material-icons-round text-[20px]">close</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* 이름 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">상황 이름</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="예: 두려울 때"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors" />
          </div>

          {/* 아이콘 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">아이콘</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${form.icon === ic ? 'border-brand bg-[var(--brand-soft-strong)]' : 'border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'}`}>
                  <span className="material-icons-round text-[20px] text-gray-700 dark:text-white/70">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 색상 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">색상</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full border-[3px] transition-transform ${form.color === c ? 'border-white dark:border-white scale-110 shadow-lg' : 'border-transparent scale-100'}`} />
              ))}
            </div>
          </div>

          {/* 감정 묶음 — 기도 감정 태그와 매칭 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              연결할 감정 (기도 묵상 추천 매칭 — 여러 개 묶기 가능)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTION_OPTIONS.map(opt => (
                <button key={opt.key} type="button" onClick={() => toggleEmotion(opt.key)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${
                    form.emotion_keys.includes(opt.key)
                      ? 'border-brand bg-[var(--brand-soft-strong)] text-brand'
                      : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/50 hover:border-gray-300 dark:hover:border-white/20'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1.5 leading-snug">
              기도 등록 시 선택된 감정 태그가 여기 연결된 감정과 일치하면 이 카테고리의 구절이 추천됩니다.
            </p>
          </div>

          {/* 키워드 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">
              매칭 키워드 (쉼표로 구분)
            </label>
            <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
              placeholder="예: 기쁨, 행복, 기뻐, 감사"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-brand transition-colors" />
            <p className="text-[11px] text-gray-400 dark:text-white/35 mt-1.5 leading-snug">
              기도 제목이나 내용에 이 단어가 들어 있으면 이 카테고리의 구절이 추천됩니다.
            </p>
          </div>

          {/* 순서 + 활성화 + 기본 카테고리 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">순서</label>
              <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: +e.target.value }))}
                className="w-20 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-ink-strong focus:outline-none focus:border-brand transition-colors" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}>
                <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-white/70">활성화</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <div className={`w-10 h-6 rounded-full transition-colors ${form.is_default ? 'bg-brand' : 'bg-gray-200 dark:bg-white/10'}`}
                onClick={() => setForm(f => ({ ...f, is_default: !f.is_default }))}>
                <div className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${form.is_default ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-sm text-gray-700 dark:text-white/70">기본 카테고리</span>
            </label>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-white/35 -mt-2 leading-snug">
            기본 카테고리: 감정·키워드가 하나도 일치하지 않는 기도에 이 카테고리의 구절을 사용합니다.
          </p>

          {/* 미리보기 */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-1.5 block">미리보기</label>
            <div className="inline-flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: form.color + '25' }}>
                <span className="material-icons-round text-[26px]" style={{ color: form.color }}>{form.icon}</span>
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-white/80">{form.name || '이름 없음'}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border-light dark:border-border-dark flex gap-2 flex-shrink-0">
          <button onClick={() => onSave(form)} disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors">
            {isPending ? '저장 중...' : '저장'}
          </button>
          <button onClick={onCancel} className="px-5 py-2.5 text-sm text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', icon: 'bookmark', color: '#6366f1', order: 0, is_active: true,
  emotion_keys: [] as string[], keywords: '', is_default: false,
}

const SituationManagement = () => {
  const navigate = useNavigate()
  const { data: categories = [], isLoading } = useAdminSituationCategories()
  const createCat = useCreateSituationCategory()
  const updateCat = useUpdateSituationCategory()
  const deleteCat = useDeleteSituationCategory()
  const seed = useSeedSituations()

  const [verseTarget, setVerseTarget] = useState<SituationCategory | null>(null)
  const [formTarget, setFormTarget] = useState<SituationCategory | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!isAdmin()) { showToast('관리자 권한이 필요합니다', 'error'); navigate('/') }
  }, [navigate])

  const handleSeed = async () => {
    try {
      const res = await seed.mutateAsync()
      showToast(res.message, res.seeded ? 'success' : 'error')
    } catch { showToast('씨드 실패', 'error') }
  }

  const handleSave = async (form: typeof EMPTY_FORM) => {
    if (!form.name.trim()) { showToast('이름을 입력하세요', 'error'); return }
    const payload = {
      name: form.name,
      icon: form.icon,
      color: form.color,
      order: form.order,
      is_active: form.is_active,
      emotion_keys: form.emotion_keys,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      is_default: form.is_default,
    }
    try {
      if (formTarget) {
        await updateCat.mutateAsync({ id: formTarget.id, data: payload })
        showToast('수정되었습니다', 'success')
      } else {
        await createCat.mutateAsync(payload)
        showToast('생성되었습니다', 'success')
      }
      setShowForm(false); setFormTarget(null)
    } catch (e) { showToast(e instanceof Error ? e.message : '저장 실패', 'error') }
  }

  const handleDelete = async (cat: SituationCategory) => {
    if (!confirm(`"${cat.name}" 카테고리를 삭제할까요?\n연결된 구절도 모두 삭제됩니다.`)) return
    try { await deleteCat.mutateAsync(cat.id); showToast('삭제되었습니다', 'success') }
    catch { showToast('삭제 실패', 'error') }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark">
      <div className="max-w-md mx-auto bg-background-light dark:bg-background-dark border-x border-border-light dark:border-border-dark min-h-screen pb-24">

        {/* 스티키 헤더 */}
        <div className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark px-4 py-3 flex items-center justify-between gap-2">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-white/70 hover:text-brand transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-semibold">뒤로</span>
          </button>
          <h1 className="text-base font-bold tracking-[-0.015em] text-ink-strong">상황별 성구 관리</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-soft-strong)] border border-[var(--brand-glow)] text-brand tracking-[0.08em]">
            ADMIN
          </span>
        </div>

        {/* 기도 묵상 구절 추천 모드 */}
        <RecommendationModeCard />

        {/* 통계 + 씨드 버튼 */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="text-[13px] px-3 py-1 rounded-full bg-[var(--brand-soft-strong)] text-brand font-semibold border border-[var(--brand-glow)]">
              전체 {categories.length}
            </span>
            <span className="text-[13px] px-3 py-1 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-white/50 font-medium border border-gray-200/50 dark:border-white/[0.06]">
              비활성 {categories.filter(c => !c.is_active).length}
            </span>
          </div>
          <button onClick={handleSeed} disabled={seed.isPending}
            className="text-[12px] px-3 py-1.5 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] disabled:opacity-40 transition-colors">
            초기 씨드 삽입
          </button>
        </div>

        {/* 카테고리 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-200 dark:border-white/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <span className="material-icons-outlined text-[48px] text-gray-200 dark:text-white/20 mb-3">sentiment_satisfied_alt</span>
            <p className="text-sm text-gray-400 dark:text-white/30 mb-4">아직 카테고리가 없습니다</p>
            <button onClick={handleSeed} disabled={seed.isPending}
              className="px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-dim disabled:opacity-50 transition-colors">
              초기 씨드 삽입하기
            </button>
          </div>
        ) : (
          <div className="px-4 pt-2 space-y-2">
            {categories.map(cat => (
              <div key={cat.id}
                className="relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-card-dark border border-gray-200/70 dark:border-white/[0.06] shadow-sm dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_2px_8px_rgba(0,0,0,0.20)]">
                <span className="hidden dark:block absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-white/[0.02] pointer-events-none rounded-2xl" />

                {/* 아이콘 */}
                <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: cat.color + '20' }}>
                  <span className="material-icons-round text-[20px]" style={{ color: cat.color }}>{cat.icon}</span>
                </div>

                {/* 정보 */}
                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-gray-900 dark:text-white/85 truncate">{cat.name}</span>
                    {cat.is_default && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[var(--brand-soft-strong)] text-brand rounded-full border border-[var(--brand-glow)] flex-shrink-0">
                        기본
                      </span>
                    )}
                    {!cat.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 rounded-full border border-gray-200 dark:border-white/[0.06] flex-shrink-0">
                        비활성
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-gray-400 dark:text-white/35 block truncate">
                    {cat.verse_count}개 구절 · 순서 {cat.order}
                    {(cat.emotion_keys?.length ?? 0) > 0 && (
                      <> · {cat.emotion_keys.map(emotionLabel).join('·')}</>
                    )}
                    {(cat.keywords?.length ?? 0) > 0 && (
                      <> · 키워드 {cat.keywords.length}</>
                    )}
                  </span>
                </div>

                {/* 액션 버튼 */}
                <div className="relative z-10 flex gap-1">
                  <button onClick={() => setVerseTarget(cat)}
                    className="px-2.5 py-1 text-[12px] font-medium text-brand hover:bg-[var(--brand-soft)] rounded-lg transition-colors">
                    구절
                  </button>
                  <button onClick={() => { setFormTarget(cat); setShowForm(true) }}
                    className="px-2.5 py-1 text-[12px] font-medium text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/[0.06] rounded-lg transition-colors">
                    수정
                  </button>
                  <button onClick={() => handleDelete(cat)}
                    className="px-2.5 py-1 text-[12px] font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB — 카테고리 추가 */}
      <button
        onClick={() => { setFormTarget(null); setShowForm(true) }}
        className="fixed bottom-6 right-1/2 translate-x-[calc(50%+min(calc(100vw/2),24rem)-4.5rem)] z-30 flex items-center gap-2 px-5 py-3 bg-brand hover:bg-brand-dim text-white text-sm font-bold rounded-2xl shadow-[0_4px_20px_var(--brand-glow)] transition-colors"
      >
        <span className="material-icons-round text-[18px]">add</span>
        카테고리 추가
      </button>

      {showForm && (
        <CategoryForm
          initial={formTarget ? {
            name: formTarget.name, icon: formTarget.icon, color: formTarget.color,
            order: formTarget.order, is_active: formTarget.is_active,
            emotion_keys: formTarget.emotion_keys ?? [],
            keywords: (formTarget.keywords ?? []).join(', '),
            is_default: formTarget.is_default ?? false,
          } : EMPTY_FORM}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setFormTarget(null) }}
          isPending={createCat.isPending || updateCat.isPending}
        />
      )}
      {verseTarget && <VersePanel category={verseTarget} onClose={() => setVerseTarget(null)} />}
    </div>
  )
}

export default SituationManagement
