// 교회 조직도 타입

// governance = 의결기구(공동의회·당회·제직회…), committee = 위원회,
// bureau = 국(위원회 아래 묶음 헤더), department = 부서
export type OrgUnitType = 'governance' | 'committee' | 'bureau' | 'department'

export interface OrgUnit {
  id: number
  parent_id: number | null
  name: string
  unit_type: OrgUnitType
  sort_order: number
  is_active: boolean
  note: string | null
  children: OrgUnit[]
}

export interface OrgTree {
  governance: OrgUnit[]
  committees: OrgUnit[]
  committee_count: number
  department_count: number
  updated_at: string | null
}

export interface OrgUnitCreate {
  name: string
  unit_type: OrgUnitType
  parent_id?: number | null
  sort_order?: number
  is_active?: boolean
  note?: string | null
}

export interface OrgUnitUpdate {
  name?: string
  unit_type?: OrgUnitType
  parent_id?: number | null
  sort_order?: number
  is_active?: boolean
  note?: string | null
}

export const UNIT_TYPE_LABEL: Record<OrgUnitType, string> = {
  governance: '의결기구',
  committee: '위원회',
  bureau: '국',
  department: '부서',
}
