import RabbitAvatar, { type RabbitMood } from '../../components/rabbit/RabbitAvatar'
import { useQuestBgStyle } from '../Bluemarble/journey/useQuestBg'
import '../Bluemarble/Bluemarble.css'
import '../Bluemarble/quest.css'

/**
 * /#/dev/rabbit — 전신갑주 토끼(RabbitAvatar) 단계·장비·표정 한눈에 보기.
 * 위: 발자취 지도 위 '지금 여기' 칸에 선 크기(58px), 아래: /bluemarble/rabbit 히어로 크기(200px).
 */
const FULL_GEAR: Record<string, string> = {
  feet: 'shoes_of_peace',
  belt: 'belt_of_truth',
  chest: 'breastplate_of_righteousness',
  shield: 'shield_of_faith',
  helmet: 'helmet_of_salvation',
  weapon: 'sword_of_spirit',
}

const SAMPLES: { stage: number; equipped: Record<string, string>; mood: RabbitMood }[] = [
  { stage: 1, equipped: {}, mood: 'idle' },
  { stage: 2, equipped: { feet: 'shoes_of_peace' }, mood: 'happy' },
  { stage: 3, equipped: { feet: 'shoes_of_peace', belt: 'belt_of_truth' }, mood: 'idle' },
  { stage: 4, equipped: { feet: 'shoes_of_peace', belt: 'belt_of_truth', chest: 'breastplate_of_righteousness' }, mood: 'sleep' },
  { stage: 5, equipped: { ...FULL_GEAR, helmet: '', weapon: '' }, mood: 'sad' },
  { stage: 6, equipped: FULL_GEAR, mood: 'excited' },
  { stage: 7, equipped: { ...FULL_GEAR, helmet: '', accessory: 'crown_of_life', back: 'golden_cross', companion: 'dove_of_spirit', lamp: 'lamp_of_word' }, mood: 'happy' },
]

export default function RabbitPreview() {
  const bg = useQuestBgStyle()
  return (
    <div className="quest quest--journey" style={bg}>
      <div className="qj" style={{ minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '96px 36px', paddingTop: 70, justifyContent: 'center' }}>
          {SAMPLES.map((s) => (
            <div key={s.stage} className="qj-node is-done" style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 6 }}>
              <button type="button" className="qj-node-disc" style={{ width: 60, height: 60, borderRadius: '50%' }} />
              <span className="qj-node-label">Lv{s.stage} · {s.mood}</span>
              <span className="qj-rabbit" aria-hidden>
                <RabbitAvatar stage={s.stage} equipped={s.equipped} mood={s.mood} size={58} />
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 48, justifyContent: 'center' }}>
          {SAMPLES.map((s) => (
            <div key={s.stage} className="qj-panel" style={{ padding: 12 }}>
              <RabbitAvatar stage={s.stage} equipped={s.equipped} mood={s.mood} size={200} staticPose />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
