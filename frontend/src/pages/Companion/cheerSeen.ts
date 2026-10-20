// "짝이 오늘 나를 위해 기도했어요" 를 이 기기에서 오늘 봤는지 — 홈 발자국 버튼을 숨기는 데 쓴다
import { safeStorage } from '../../utils/safeStorage'

const key = (id: number) => `companion.cheerSeen.${id}`
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })

export const isCheerSeenToday = (id: number) => safeStorage.get(key(id)) === today()
export const markCheerSeen = (id: number) => safeStorage.set(key(id), today())
