/**
 * 시대순(한 줄기 계보선) 화면의 이야기 데이터 — 초보자가 "왜 이 사람이 중요한지"를 한 줄로 잡게 한다.
 * DB(bible_figures)는 그대로 두고 slug로 덧입힌다. 없는 slug는 이름만 남은 세대로 접힌다.
 */

export interface EraInfo {
  label: string
  /** 상단 여정 지도 눈금용 짧은 이름 */
  short: string
  meta: string
  story: string
  order: number
  match: (era: string) => boolean
}

export const ERAS: EraInfo[] = [
  { label: '창조 · 홍수 이전', short: '창조', order: 0, meta: '연대 미상 · 창세기 1–11장', story: '하나님이 세상을 지으시고, 죄가 들어오고, 홍수로 새 출발하기까지.', match: (e) => /창조|에덴|아담|홍수|노아 이전/.test(e) },
  { label: '족장 시대', short: '족장', order: 1, meta: '약 BC 2100–1800 · 창세기 12–50장', story: '한 사람 아브라함을 부르셔서, 한 가족을 통해 약속을 이어 가신 시대.', match: (e) => /족장/.test(e) },
  { label: '출애굽 · 광야', short: '출애굽', order: 2, meta: '약 BC 1450 · 출애굽기–신명기', story: '이집트 종살이에서 건져 내 광야 40년을 함께 걸으신 시대.', match: (e) => /출애굽|광야/.test(e) },
  { label: '정복 · 사사', short: '사사', order: 3, meta: '약 BC 1400–1050 · 여호수아·사사기·룻기', story: '가나안에 들어가 살던 혼란의 시대. 라합과 룻, 이방 여인들이 계보에 들어왔어요.', match: (e) => /가나안|사사|정복/.test(e) },
  { label: '통일 왕국', short: '왕국', order: 4, meta: '약 BC 1050–930 · 사무엘서–열왕기상', story: '다윗에게 “네 왕위가 영원하리라” 약속하신 시대.', match: (e) => /통일왕국|왕정|초기왕국/.test(e) },
  { label: '분열 왕국', short: '분열', order: 5, meta: 'BC 930–586 · 열왕기·역대기', story: '나라가 남북으로 갈라지고, 선지자들이 돌아오라 외친 시대.', match: (e) => /분열|남유다|북이스라엘/.test(e) },
  { label: '포로 · 귀환', short: '포로', order: 6, meta: 'BC 586–430 · 열왕기하·에스라·느헤미야', story: '나라를 잃고 바벨론에 끌려갔다가, 돌아와 성전을 다시 지은 시대.', match: (e) => /포로|귀환/.test(e) },
  { label: '중간기', short: '중간기', order: 7, meta: 'BC 430–4 · 400년의 침묵', story: '선지자의 목소리가 끊긴 채 약속을 기다린 시대.', match: (e) => /중간기/.test(e) },
  { label: '메시아의 오심', short: '메시아', order: 8, meta: '약 BC 4 – · 복음서', story: '수천 년 이어 온 약속이 마침내 한 아기로 오신 시대.', match: (e) => /신약|예수|초대교회|사도/.test(e) },
]

/** 큰 카드로 세우는 주요 인물 — 값은 StoryGlyph 이모지 키(렌더 시점에 Phosphor duotone 으로 바뀐다) */
export const MAJOR_GLYPH: Record<string, string> = {
  adam: '🌍',
  noah: '🌊',
  abraham: '🌠',
  isaac: '⛰',
  jacob: '🤼',
  judah: '👸',
  david: '👑',
  solomon: '🏛',
  zerubbabel: '🧱',
}

/** 주요 인물 대표 본문 */
export const MAJOR_REF: Record<string, string> = {
  adam: '창 1–3장',
  noah: '창 6–9장',
  abraham: '창 12–25장',
  isaac: '창 21–27장',
  jacob: '창 25–35장',
  judah: '창 38·49장',
  david: '삼상 16장 – 왕상 2장',
  solomon: '왕상 1–11장',
  zerubbabel: '에스라 3–6장',
}

/** 왜 중요한지 한 줄 — 여기 없는 메시아 라인 인물은 "n대가 더 이어져요"로 접힌다 */
export const FIGURE_HOOK: Record<string, string> = {
  adam: '흙으로 빚어진 첫 사람',
  eve: '모든 산 자의 어머니',
  seth: '죽은 아벨 대신 주신 아들',
  enoch: '죽지 않고 하늘로 옮겨진 사람',
  methuselah: '969년, 성경 최장수',
  noah: '방주를 지어 홍수에서 살아남다',
  shem: '노아가 축복한 아들',
  eber: '‘히브리’라는 이름의 뿌리',
  terah: '우르를 떠난 아브라함의 아버지',
  abraham: '고향을 떠나 믿음의 조상이 되다',
  sarah: '아흔에 약속의 아들을 낳다',
  isaac: '모리아 산에서 바쳐진 약속의 아들',
  rebekah: '“큰 자가 어린 자를 섬기리라”',
  jacob: '이름이 ‘이스라엘’이 된 사람',
  leah: '사랑받지 못했지만 유다의 어머니',
  rachel: '요셉과 베냐민의 어머니',
  judah: '“규가 유다를 떠나지 아니하리라”',
  tamar: '계보에 이름을 올린 첫 여인',
  perez: '마태복음 1장의 갈림길',
  nahshon: '광야의 유다 지파 지휘관',
  salmon: '여리고의 라합을 아내로 맞다',
  rahab: '정탐꾼을 숨겨 준 여리고 여인',
  boaz: '룻을 품은 기업 무를 자',
  ruth: '“어머니의 하나님이 나의 하나님”',
  obed: '다윗의 할아버지',
  jesse: '“이새의 줄기에서 한 싹이 나며”',
  david: '골리앗을 이긴 목동, 영원한 왕위의 약속',
  bathsheba: '솔로몬의 어머니',
  solomon: '지혜의 왕, 성전을 짓다',
  jeconiah: '바벨론으로 끌려간 왕',
  zerubbabel: '포로에서 돌아와 성전을 다시 짓다',
  joseph: '천사의 말에 순종한 의인',
  mary: '“주의 여종이오니”',
  jesus_christ: '모든 계보가 기다려 온 그분',
}

export const JESUS_SLUG = 'jesus_christ'

/* ── 가계도(별자리) — 시대마다 한 굽이, 건너뛴 세대, 마태복음 1장 ───────────── */

export interface SkyEra { label: string; meta: string }

/** 이 slug(또는 'gap:<앞 slug>')에서 새 시대가 시작된다 — 별자리가 시대마다 한 굽이를 돈다 */
export const SKY_ERA_START: Record<string, SkyEra> = {
  adam: { label: '창조와 홍수', meta: '창세기 1–9장' },
  shem: { label: '홍수 이후, 흩어진 민족', meta: '창세기 10–11장' },
  abraham: { label: '족장 시대', meta: '약 BC 2100–1800 · 창세기 12–50장' },
  perez: { label: '애굽 · 광야 · 사사', meta: '출애굽기 – 룻기' },
  jesse: { label: '왕국 시대', meta: '약 BC 1050–586 · 사무엘서 – 열왕기' },
  jeconiah: { label: '포로와 귀환', meta: 'BC 586–430 · 에스라 · 학개' },
  'gap:zerubbabel': { label: '침묵의 400년', meta: '말라기 이후 · 마태복음 1:13–16' },
  jesus_christ: { label: '때가 차매', meta: '갈라디아서 4:4' },
}

export interface GenGap {
  /** 바로 다음에 와야 하는 slug — DB에 중간 세대가 생기면 자동으로 끼우지 않는다 */
  until: string
  count: number
  names: string
  ref: string
}

/** DB에 없는 세대(마태복음 1장 기준) — 세대 번호가 바로 이어지는 착시를 막는다 */
export const SKY_GAP_AFTER: Record<string, GenGap> = {
  solomon: { until: 'jeconiah', count: 12, names: '르호보암 · 아사 · 히스기야 … 요시야', ref: '마 1:7–11' },
  zerubbabel: { until: 'jacob_father_of_joseph', count: 8, names: '아비훗 · 엘리아김 … 맛단', ref: '마 1:13–15' },
}

/** 마태복음 1:17 "열네 대 × 3" 구분점 — slot id 기준 */
export const SKY_MT_MARK: Record<string, string> = {
  abraham: '마 1:17 열네 대의 시작',
  david: '열네 대 ①',
  'gap:solomon': '열네 대 ②',
  jesus_christ: '열네 대 ③',
}

/** 마태복음 1장이 이름을 부른 다섯 여인 — 별자리에서 분홍 카드로 크게 */
export const MATTHEW_WOMEN: Record<string, string> = {
  tamar: '버려진 자리에서 계보를 이은 며느리 · 마 1:3',
  rahab: '믿음으로 정탐꾼을 숨긴 여리고 여인 · 마 1:5',
  ruth: '“어머니의 하나님이 나의 하나님” · 마 1:5',
  bathsheba: '마태는 ‘우리야의 아내’라 불렀어요 · 마 1:6',
  mary: '“주의 여종이오니” · 마 1:16',
}
