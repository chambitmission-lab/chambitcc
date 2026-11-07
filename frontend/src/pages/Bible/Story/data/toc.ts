// 생성 파일 — 손으로 고치지 않는다. 본문(act01~10.ts·promise.ts)을 고친 뒤 `npm run gen:story-toc`.
// 지도·완주 벽화·에피소드 히어로가 쓰는 목차만 담아, 본문 120KB 가 지도 청크에 실리지 않게 한다.
import type { StoryActToc } from '../storyTypes'

export const act01Toc: StoryActToc = {
  act: 1,
  title: "시작",
  subtitle: "모든 것이 좋았던 세계, 그리고 금이 간 자리",
  emoji: "🌍",
  range: "창세기 1–11장",
  episodes: [
    { id: "creation", emoji: "🌍", title: "세상이 시작되다", hook: "세상이 어떻게 시작됐을까?" },
    { id: "fall", emoji: "🍎", title: "무언가 잘못되다", hook: "인간은 왜 이렇게 되었을까?" },
    { id: "flood", emoji: "🌊", title: "노아와 무지개", hook: "왜 하필 방주였을까?" },
    { id: "babel", emoji: "🗼", title: "하늘에 닿으려던 탑", hook: "바벨탑은 무엇이 문제였을까?" },
  ],
}

export const act02Toc: StoryActToc = {
  act: 2,
  title: "약속",
  subtitle: "한 사람을 불러 모든 민족을 복 주시는 길",
  emoji: "🌠",
  range: "창세기 12–50장",
  episodes: [
    { id: "abraham", emoji: "🌠", title: "한 사람을 부르시다", hook: "아브라함은 왜 중요한 인물일까?" },
    { id: "isaac", emoji: "⛰️", title: "산 위의 시험", hook: "하나님은 왜 이삭을 바치라 하셨을까?" },
    { id: "jacob", emoji: "🤼", title: "씨름하는 사람", hook: "'이스라엘'이라는 이름은 어디서 왔을까?" },
    { id: "joseph", emoji: "🌈", title: "꿈꾸는 소년", hook: "최악의 배신이 어떻게 구원이 됐을까?" },
  ],
}

export const act03Toc: StoryActToc = {
  act: 3,
  title: "구출",
  subtitle: "노예의 집에서 건져내신 하나님",
  emoji: "🔥",
  range: "출애굽기 – 신명기",
  episodes: [
    { id: "burning-bush", emoji: "🔥", title: "불타는 떨기나무", hook: "하나님은 고통을 보고 계실까?" },
    { id: "exodus", emoji: "🌊", title: "바다가 갈라지다", hook: "유월절과 홍해, 무슨 일이 있었나?" },
    { id: "sinai", emoji: "📜", title: "산에서 받은 열 마디", hook: "십계명은 왜 주어졌을까?" },
    { id: "wilderness", emoji: "🏜️", title: "광야의 40년", hook: "왜 사십 년이나 돌아야 했을까?" },
  ],
}

export const act04Toc: StoryActToc = {
  act: 4,
  title: "땅과 왕",
  subtitle: "약속의 땅에 세워진 나라, 그리고 왕들",
  emoji: "👑",
  range: "여호수아 – 열왕기상",
  episodes: [
    { id: "jericho", emoji: "🎺", title: "무너지는 성벽", hook: "나팔 소리에 성벽이 무너진다고?" },
    { id: "judges", emoji: "🌀", title: "영웅들의 시대, 흔들리는 백성", hook: "왕이 없으면 어떻게 될까?" },
    { id: "ruth", emoji: "🌾", title: "이방 여인의 선택", hook: "왜 이방 여인이 예수님의 족보에 있을까?" },
    { id: "saul", emoji: "👑", title: "왕을 달라는 백성", hook: "첫 번째 왕은 왜 실패했을까?" },
    { id: "david", emoji: "🎯", title: "목동이 왕이 되다", hook: "다윗은 왜 성경 최고의 왕일까?" },
    { id: "solomon", emoji: "🏛️", title: "지혜의 왕과 성전", hook: "가장 지혜로운 왕은 왜 무너졌을까?" },
  ],
}

export const act05Toc: StoryActToc = {
  act: 5,
  title: "분열과 선지자",
  subtitle: "기울어 가는 나라, 그 위로 울리는 목소리",
  emoji: "⚡",
  range: "열왕기 · 선지서",
  episodes: [
    { id: "divided", emoji: "💔", title: "나라가 둘로 갈라지다", hook: "이스라엘과 유다, 왜 두 나라일까?" },
    { id: "elijah", emoji: "⚡", title: "불의 선지자 엘리야", hook: "하늘에서 불이 떨어진 날" },
    { id: "jonah", emoji: "🐋", title: "도망친 선지자", hook: "요나는 왜 도망쳤을까?" },
    { id: "prophets", emoji: "📢", title: "선지자들의 외침", hook: "선지자들은 무엇을 예고했을까?" },
    { id: "exile", emoji: "🕯️", title: "무너진 성전, 낯선 땅의 노래", hook: "나라를 잃고도 믿음이 남을 수 있을까?" },
  ],
}

export const act06Toc: StoryActToc = {
  act: 6,
  title: "귀환과 침묵",
  subtitle: "돌아온 백성, 그리고 사백 년의 기다림",
  emoji: "🌒",
  range: "에스라 – 말라기",
  episodes: [
    { id: "return", emoji: "🧱", title: "집으로 돌아가다", hook: "폐허에서 다시 시작할 수 있을까?" },
    { id: "esther", emoji: "👸", title: "죽으면 죽으리이다", hook: "하나님이 한 번도 언급되지 않는 책?" },
    { id: "silence", emoji: "🌒", title: "400년의 침묵", hook: "구약과 신약 사이엔 무슨 일이 있었을까?" },
  ],
}

export const act07Toc: StoryActToc = {
  act: 7,
  title: "예수님 오시다",
  subtitle: "모든 약속이 향하던 한 사람",
  emoji: "⭐",
  range: "마태복음 – 요한복음",
  episodes: [
    { id: "nativity", emoji: "⭐", title: "구유에 누우신 왕", hook: "왜 왕이 마구간에서 태어났을까?" },
    { id: "baptism", emoji: "🕊️", title: "물과 광야에서", hook: "예수님은 왜 세례를 받으셨을까?" },
    { id: "sermon", emoji: "🏔️", title: "산 위의 가르침", hook: "가난한 사람이 복이 있다고?" },
    { id: "miracles", emoji: "🌊", title: "폭풍을 잠재우신 분", hook: "기적은 무엇을 가리키는 표지판일까?" },
    { id: "lost", emoji: "🐑", title: "잃어버린 것을 찾아서", hook: "탕자 이야기의 진짜 주인공은 누구일까?" },
  ],
}

export const act08Toc: StoryActToc = {
  act: 8,
  title: "십자가와 부활",
  subtitle: "가장 어두운 금요일, 그리고 사흘째 새벽",
  emoji: "✝️",
  range: "복음서 후반부",
  episodes: [
    { id: "jerusalem", emoji: "🫏", title: "마지막 일주일이 시작되다", hook: "왕은 왜 나귀를 타고 왔을까?" },
    { id: "lastsupper", emoji: "🍞", title: "마지막 식사, 그리고 겟세마네", hook: "성찬식은 어디서 시작됐을까?" },
    { id: "cross", emoji: "✝️", title: "십자가", hook: "\"다 이루었다\"는 무슨 뜻일까?" },
    { id: "resurrection", emoji: "🌅", title: "사흘째 새벽", hook: "무덤은 왜 비어 있었을까?" },
  ],
}

export const act09Toc: StoryActToc = {
  act: 9,
  title: "교회의 시작",
  subtitle: "열두 명에서 온 세상으로",
  emoji: "💨",
  range: "사도행전 · 서신서",
  episodes: [
    { id: "pentecost", emoji: "💨", title: "바람과 불의 날", hook: "교회는 어떻게 태어났을까?" },
    { id: "paul", emoji: "🛤️", title: "박해자가 전도자로", hook: "기독교 최대의 반전은 누구였을까?" },
    { id: "missions", emoji: "🌍", title: "온 세상으로", hook: "복음은 어떻게 로마까지 갔을까?" },
    { id: "letters", emoji: "✉️", title: "교회에게 보낸 편지들", hook: "신약의 절반이 편지라고?" },
  ],
}

export const act10Toc: StoryActToc = {
  act: 10,
  title: "새 하늘과 새 땅",
  subtitle: "이야기가 향해 온 목적지",
  emoji: "🌈",
  range: "요한계시록",
  episodes: [
    { id: "revelation", emoji: "📖", title: "마지막 책, 문 앞에 서신 분", hook: "요한계시록은 무서운 책일까?" },
    { id: "newheaven", emoji: "🌈", title: "모든 눈물이 씻기다", hook: "성경의 마지막 장면은 어떤 모습일까?" },
    { id: "epilogue", emoji: "🚪", title: "이제 당신의 차례", hook: "완주를 축하합니다. 다음 걸음은?" },
  ],
}

export const promiseToc: StoryActToc = {
  act: 0,
  badge: "특별편",
  title: "약속의 실",
  subtitle: "구약 곳곳에 숨겨 둔 메시아의 신호들",
  emoji: "✨",
  range: "창세기 – 말라기 → 복음서",
  episodes: [
    { id: "promise-seed", emoji: "🌱", title: "여자의 후손", hook: "첫 범죄의 날, 하나님은 무엇을 약속하셨을까?", promiseKind: "prophecy" },
    { id: "promise-abraham", emoji: "🌠", title: "모든 민족이 받을 복", hook: "왜 하필 아브라함 한 사람이었을까?", promiseKind: "prophecy" },
    { id: "promise-moriah", emoji: "⛰️", title: "하나님이 준비하신 어린양", hook: "아버지는 왜 아들을 산으로 데려갔을까?", promiseKind: "type" },
    { id: "promise-judah", emoji: "🦁", title: "유다를 떠나지 않을 왕의 지팡이", hook: "열두 아들 중 누가 왕이 될까?", promiseKind: "prophecy" },
    { id: "promise-passover", emoji: "🚪", title: "문설주에 바른 피", hook: "죽음은 왜 그 집을 넘어갔을까?", promiseKind: "type" },
    { id: "promise-serpent", emoji: "🐍", title: "장대 위의 놋뱀", hook: "쳐다보기만 했는데 왜 살았을까?", promiseKind: "type" },
    { id: "promise-prophet", emoji: "🗣️", title: "모세 같은 선지자", hook: "모세 다음엔 누가 하나님의 말씀을 전할까?", promiseKind: "prophecy" },
    { id: "promise-david", emoji: "👑", title: "영원히 무너지지 않을 왕좌", hook: "하나님은 다윗에게 어떤 집을 지어 주셨을까?", promiseKind: "prophecy" },
    { id: "promise-psalm22", emoji: "🎵", title: "천 년 전에 부른 십자가의 노래", hook: "다윗은 누구의 고통을 노래했을까?", promiseKind: "prophecy" },
    { id: "promise-jonah", emoji: "🐋", title: "물고기 배 속의 사흘", hook: "예수님은 왜 요나 이야기를 꺼내셨을까?", promiseKind: "type" },
    { id: "promise-immanuel", emoji: "👶", title: "처녀가 낳을 아들, 임마누엘", hook: "하나님이 우리와 함께 계신다는 표징은?", promiseKind: "prophecy" },
    { id: "promise-bethlehem", emoji: "📍", title: "작은 마을 베들레헴", hook: "왕은 왜 수도가 아닌 시골에서 태어났을까?", promiseKind: "prophecy" },
    { id: "promise-servant", emoji: "🩹", title: "우리 대신 상처 입은 종", hook: "구원자가 왜 고난을 받아야 했을까?", promiseKind: "prophecy" },
    { id: "promise-donkey", emoji: "🫏", title: "나귀 타고 오시는 왕", hook: "왕이 왜 군마가 아니라 나귀를 탔을까?", promiseKind: "prophecy" },
    { id: "promise-messenger", emoji: "🛣️", title: "길을 닦는 사람", hook: "구약은 왜 엘리야 이야기로 끝날까?", promiseKind: "prophecy" },
    { id: "promise-amen", emoji: "🔑", title: "모든 약속이 \"예\"가 되다", hook: "이 모든 신호는 결국 누구를 가리켰을까?" },
  ],
}

export const STORY_TOC: StoryActToc[] = [act01Toc, act02Toc, act03Toc, act04Toc, act05Toc, act06Toc, act07Toc, act08Toc, act09Toc, act10Toc]
