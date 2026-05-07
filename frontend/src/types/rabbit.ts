// 전신갑주 토끼 타입 정의

export type RabbitSlot =
  | 'feet'
  | 'belt'
  | 'chest'
  | 'shield'
  | 'helmet'
  | 'weapon'
  | 'accessory'
  | 'companion'
  | 'lamp'
  | 'scroll'
  | 'back'
  | 'banner'

export interface TreasureDef {
  code: string
  name: string
  slot: RabbitSlot | string
  scripture: string
  threshold?: number | null
  description?: string | null
}

export interface InventoryEntry {
  acquired_at: string
  name: string
  scripture?: string
}

export interface Rabbit {
  id: number
  user_id: number
  stage: number
  total_correct: number
  total_treasures: number
  inventory: Record<string, InventoryEntry>
  equipped: Record<string, string>
  nickname: string | null
  created_at: string
  updated_at: string
  last_evolved_at: string | null
}

export interface NextTreasureInfo {
  code: string
  name: string
  scripture: string
  threshold: number
  remaining: number
}

export interface RabbitProgress {
  rabbit: Rabbit
  next_stage_at: number | null
  next_treasure: NextTreasureInfo | null
}

export interface RabbitCatalog {
  treasures: TreasureDef[]
  stages: number[]
  max_stage: number
}

export interface RabbitEventLog {
  id: number
  event_type: 'treasure' | 'evolve' | 'equip' | 'unequip'
  item_code: string | null
  from_stage: number | null
  to_stage: number | null
  note: string | null
  created_at: string
}

// AnswerResponse에 포함되는 토끼 이벤트
export interface RabbitEvent {
  stage: number
  evolved: boolean
  from_stage: number | null
  treasures_gained: TreasureDef[]
  total_correct: number
  total_treasures: number
}
