import type { AtlasJourney } from '../atlasTypes'

// 성경 지도여행 — 여정 트랙.
//
// 순서는 성경의 시간 순서다. 첫 화면에 아브라함이 뜨는 것은 의도된 것으로,
// "성경은 한 사람이 길을 떠나는 데서 시작한다"는 것을 지도로 먼저 보여 준다.
//
// 트랙 색은 지하철 노선도와 같은 역할이다(색 = 어느 여정인가). 브랜드 블루는
// 복음서 트랙에 쓰고, 나머지는 라이트/다크 양쪽에서 바다·육지 배경과 충분히
// 대비되는 중간 명도로 고른다. 게임 시맨틱 색과 같은 성격의 의도된 예외다.
//
// stops 는 성경 본문의 순서를 그대로 따른다. 왕복 구간에서 같은 장소가 다시
// 나오는 것은 정상이며(되짚어 가는 길), 그때 bow 부호를 뒤집어 갈 때와 올 때의
// 곡선이 겹치지 않게 한다.

/** 되짚어 가는 구간의 곡선 휨 — 갈 때(기본 +0.14)와 반대로 부풀린다 */
const BACK = -0.16

export const JOURNEYS: AtlasJourney[] = [
  {
    id: 'abraham',
    group: 'ot',
    title: '아브라함의 길',
    short: '아브라함',
    subtitle: '지도를 모르고 떠난 사람',
    era: 'BC 2000년경',
    scripture: '창세기 11–23장',
    color: '#c2410c',
    hook: '어디로 가는지 듣지 못한 채 떠났습니다. 성경은 이 한 걸음에서 시작합니다.',
    stops: [
      {
        place: 'ur',
        title: '문명을 등지고',
        narration: '당대 최고의 도시 우르. 데라가 가족을 데리고 이 도시를 떠납니다.',
        ref: { book: 1, chapter: 11, verse: 31, label: '창세기 11:31' },
      },
      {
        place: 'haran',
        title: '부르심이 임하다',
        narration: '아버지가 죽고 발이 묶인 하란에서, 일흔다섯의 그에게 "떠나라" 하십니다.',
        ref: { book: 1, chapter: 12, verse: 1, label: '창세기 12:1' },
      },
      {
        place: 'shechem',
        title: '남의 땅에 쌓은 제단',
        narration: '가나안에 들어와 처음 멈춘 곳. 아직 한 뼘도 자기 땅이 아닌데 제단부터 쌓습니다.',
        ref: { book: 1, chapter: 12, verse: 7, label: '창세기 12:7' },
      },
      {
        place: 'bethel',
        title: '이름을 부르다',
        narration: '장막을 치고 여호와의 이름을 부릅니다. 예배가 집보다 먼저 세워집니다.',
        ref: { book: 1, chapter: 12, verse: 8, label: '창세기 12:8' },
      },
      {
        place: 'egypt',
        title: '기근에 흔들리다',
        narration: '약속의 땅에 기근이 듭니다. 아브라함은 애굽으로 내려가 아내를 누이라 속입니다.',
        ref: { book: 1, chapter: 12, verse: 13, label: '창세기 12:13' },
      },
      {
        place: 'bethel',
        title: '처음 그 자리로',
        narration: '되돌아와, 처음 제단을 쌓았던 그 자리에서 다시 여호와의 이름을 부릅니다.',
        ref: { book: 1, chapter: 13, verse: 4, label: '창세기 13:4' },
        bow: BACK,
      },
      {
        place: 'hebron',
        title: '롯과 갈라선 뒤',
        narration: '좋은 땅을 조카에게 양보하고 산지로 옮겨, 마므레 상수리 수풀에 자리를 잡습니다.',
        ref: { book: 1, chapter: 13, verse: 18, label: '창세기 13:18' },
      },
      {
        place: 'beersheba',
        title: '약속의 아들',
        narration: '백 세에 이삭이 태어납니다. 우물을 두고 언약을 맺고 에셀 나무를 심습니다.',
        ref: { book: 1, chapter: 21, verse: 33, label: '창세기 21:33' },
      },
      {
        place: 'jerusalem',
        title: '모리아 산',
        narration: '사흘 길을 걸어 그 산에 오릅니다. 약속의 아들을 드리라는 시험 앞에 섭니다.',
        ref: { book: 1, chapter: 22, verse: 2, label: '창세기 22:2' },
      },
      {
        place: 'hebron',
        title: '얻은 것은 한 조각 땅',
        narration:
          '평생을 나그네로 살고, 사라를 묻을 굴 하나를 값 주고 삽니다. 그것이 손에 쥔 전부였습니다.',
        ref: { book: 1, chapter: 23, verse: 19, label: '창세기 23:19' },
        bow: BACK,
      },
    ],
  },

  {
    id: 'exodus',
    group: 'ot',
    title: '출애굽의 길',
    short: '출애굽',
    subtitle: '사십 년을 걸어 이만큼',
    era: 'BC 1400년경',
    scripture: '출애굽기 12장 – 여호수아 3장',
    color: '#dc2626',
    hook: '지도로 보면 며칠 길입니다. 이스라엘은 이 거리를 사십 년에 걸쳐 걸었습니다.',
    stops: [
      {
        place: 'rameses',
        title: '유월절 밤',
        narration: '어린양의 피를 문설주에 바른 그 밤, 사백 년 종살이가 끝납니다.',
        ref: { book: 2, chapter: 12, verse: 37, label: '출애굽기 12:37' },
      },
      {
        place: 'succoth',
        title: '부풀 새도 없이',
        narration: '반죽이 부풀 틈도 없이 떠나, 첫 진에서 누룩 없는 떡을 구워 먹습니다.',
        ref: { book: 2, chapter: 12, verse: 39, label: '출애굽기 12:39' },
      },
      {
        place: 'red-sea',
        title: '앞은 바다, 뒤는 병거',
        narration: '길이 끊긴 자리에서 바다가 갈라집니다. 구원은 늘 막다른 곳에서 시작됩니다.',
        ref: { book: 2, chapter: 14, verse: 22, label: '출애굽기 14:22' },
      },
      {
        place: 'marah',
        title: '쓴 물',
        narration: '사흘을 걸어 만난 물이 씁니다. 나무 한 조각을 던지자 마실 수 있게 됩니다.',
        ref: { book: 2, chapter: 15, verse: 25, label: '출애굽기 15:25' },
      },
      {
        place: 'elim',
        title: '샘 열둘, 종려 일흔',
        narration: '쓴 물 바로 다음에 오아시스가 있었습니다. 광야에도 쉼터는 있습니다.',
        ref: { book: 2, chapter: 15, verse: 27, label: '출애굽기 15:27' },
      },
      {
        place: 'rephidim',
        title: '반석에서 나온 물',
        narration: '물이 없어 원망이 터지고, 아말렉과 첫 전쟁을 치릅니다. 아론과 훌이 손을 받칩니다.',
        ref: { book: 2, chapter: 17, verse: 12, label: '출애굽기 17:12' },
      },
      {
        place: 'sinai',
        title: '언약의 산',
        narration: '거의 일 년을 머물며 십계명과 언약을 받습니다. 노예 무리가 한 백성이 됩니다.',
        ref: { book: 2, chapter: 20, verse: 1, label: '출애굽기 20:1' },
      },
      {
        place: 'kadesh-barnea',
        title: '문턱에서 돌아서다',
        narration:
          '약속의 땅이 코앞입니다. 그런데 정탐꾼 열 사람의 보고에 백성이 무너져, 광야로 되돌아갑니다.',
        ref: { book: 4, chapter: 14, verse: 9, label: '민수기 14:9' },
      },
      {
        place: 'nebo',
        title: '보기만 하고',
        narration: '사십 년을 이끈 모세는 산에 올라 그 땅을 봅니다. 건너가지는 못합니다.',
        ref: { book: 5, chapter: 34, verse: 4, label: '신명기 34:4' },
      },
      {
        place: 'jericho',
        title: '드디어 강을 건너다',
        narration: '요단 물이 끊어지고, 다음 세대가 마른 땅으로 걸어 들어갑니다.',
        ref: { book: 6, chapter: 3, verse: 17, label: '여호수아 3:17' },
      },
    ],
  },

  {
    id: 'david',
    group: 'ot',
    title: '다윗의 도피로',
    short: '다윗',
    subtitle: '시편이 쓰인 실제 장소들',
    era: 'BC 1010년경',
    scripture: '사무엘상 16장 – 사무엘하 5장',
    color: '#0d9488',
    hook: '기름 부음을 받고서 왕궁이 아니라 동굴로 갑니다. 시편의 절반이 이 길 위에서 쓰였습니다.',
    stops: [
      {
        place: 'bethlehem',
        title: '들에서 부름받다',
        narration: '아무도 부르지 않던 막내가 양 떼에서 불려 나와 기름 부음을 받습니다.',
        ref: { book: 9, chapter: 16, verse: 13, label: '사무엘상 16:13' },
      },
      {
        place: 'gibeah',
        title: '왕궁에서 날아온 창',
        narration: '수금을 타 왕의 마음을 달래던 자리에서, 그 왕의 창을 피합니다.',
        ref: { book: 9, chapter: 18, verse: 11, label: '사무엘상 18:11' },
      },
      {
        place: 'nob',
        title: '빈손으로 도망쳐',
        narration: '제사장에게 거룩한 떡과 골리앗의 칼을 얻습니다. 가진 것 없이 떠난 길입니다.',
        ref: { book: 9, chapter: 21, verse: 9, label: '사무엘상 21:9' },
      },
      {
        place: 'gath',
        title: '원수의 도시로',
        narration: '갈 곳이 없어 하필 골리앗의 고향으로 숨어들고, 살려고 미친 체합니다.',
        ref: { book: 9, chapter: 21, verse: 13, label: '사무엘상 21:13' },
      },
      {
        place: 'adullam',
        title: '굴에 모인 사백 명',
        narration: '환난 당한 자, 빚진 자, 마음이 원통한 자가 모입니다. 다윗의 군대는 이렇게 시작됩니다.',
        ref: { book: 9, chapter: 22, verse: 2, label: '사무엘상 22:2' },
      },
      {
        place: 'ziph',
        title: '친구가 찾아온 광야',
        narration: '주민들이 그를 밀고한 위험한 광야로, 요나단이 굳이 찾아와 손을 잡아 줍니다.',
        ref: { book: 9, chapter: 23, verse: 16, label: '사무엘상 23:16' },
      },
      {
        place: 'engedi',
        title: '죽일 수 있었지만',
        narration: '사해 절벽의 굴에서 사울을 마주칩니다. 겉옷 자락만 베고, 그것마저 마음에 찔립니다.',
        ref: { book: 9, chapter: 24, verse: 5, label: '사무엘상 24:5' },
      },
      {
        place: 'ziklag',
        title: '가장 낮은 자리',
        narration: '적국 땅에서 일 년 사 개월. 모든 것을 잃고도 하나님을 힘입어 다시 일어섭니다.',
        ref: { book: 9, chapter: 30, verse: 6, label: '사무엘상 30:6' },
      },
      {
        place: 'hebron',
        title: '유다의 왕',
        narration: '도망자 생활이 끝나고, 여기서 유다의 왕으로 기름 부음을 받습니다.',
        ref: { book: 10, chapter: 2, verse: 4, label: '사무엘하 2:4' },
      },
      {
        place: 'jerusalem',
        title: '다윗 성',
        narration: '시온 산성을 빼앗아 수도로 삼습니다. 기름 부음에서 여기까지 십오 년이 걸렸습니다.',
        ref: { book: 10, chapter: 5, verse: 7, label: '사무엘하 5:7' },
      },
    ],
  },

  {
    id: 'jesus',
    group: 'gospel',
    title: '예수님의 길',
    short: '예수님',
    subtitle: '삼십 년과 삼 년의 무대',
    era: 'BC 4년 – AD 30년경',
    scripture: '사복음서 · 사도행전 1장',
    color: '#3182f6',
    hook: '세상을 바꾼 삼 년의 무대는, 지도로 보면 경기도만 한 넓이였습니다.',
    stops: [
      {
        place: 'bethlehem',
        title: '구유에 뉘시니라',
        narration: '왕궁이 아니라 여관 뒷마당, 짐승의 구유에서 태어나십니다.',
        ref: { book: 42, chapter: 2, verse: 7, label: '누가복음 2:7' },
      },
      {
        place: 'egypt',
        title: '난민이 되어',
        narration: '헤롯의 칼을 피해 애굽으로 피난합니다. 조상들이 종살이하던 그 땅으로.',
        ref: { book: 40, chapter: 2, verse: 14, label: '마태복음 2:14' },
      },
      {
        place: 'nazareth',
        title: '삼십 년의 침묵',
        narration: '지도에도 없던 작은 마을에서 목수의 아들로 자라십니다.',
        ref: { book: 40, chapter: 2, verse: 23, label: '마태복음 2:23' },
      },
      {
        place: 'jordan',
        title: '물에서 올라오실 때',
        narration: '요한에게 세례를 받으시고, 하늘에서 소리가 납니다. 공생애가 시작됩니다.',
        ref: { book: 40, chapter: 3, verse: 17, label: '마태복음 3:17' },
      },
      {
        place: 'wilderness',
        title: '사십 일의 시험',
        narration: '성령에 이끌려 광야로 가시고, 굶주린 채 세 번의 시험을 이기십니다.',
        ref: { book: 40, chapter: 4, verse: 4, label: '마태복음 4:4' },
      },
      {
        place: 'cana',
        title: '첫 표적은 잔칫집에서',
        narration: '성전이 아니라 결혼 잔치에서, 물을 포도주로 바꾸십니다.',
        ref: { book: 43, chapter: 2, verse: 11, label: '요한복음 2:11' },
      },
      {
        place: 'capernaum',
        title: '본 동네',
        narration: '호숫가 어촌을 사역의 집으로 삼으십니다. 어부와 세리를 여기서 부르십니다.',
        ref: { book: 40, chapter: 4, verse: 13, label: '마태복음 4:13' },
      },
      {
        place: 'caesarea-philippi',
        title: '너희는 나를 누구라 하느냐',
        narration: '이방 신전이 늘어선 국경 도시 앞에서 물으십니다. 베드로가 처음으로 답합니다.',
        ref: { book: 40, chapter: 16, verse: 16, label: '마태복음 16:16' },
      },
      {
        place: 'jerusalem',
        title: '십자가와 빈 무덤',
        narration: '아브라함이 이삭을 드리려던 그 산지에서, 십자가가 서고 사흘 만에 무덤이 빕니다.',
        ref: { book: 42, chapter: 24, verse: 6, label: '누가복음 24:6' },
      },
      {
        place: 'olivet',
        title: '땅 끝까지',
        narration: '"땅 끝까지 이르러 내 증인이 되리라." 여기서 지도가 다시 넓어지기 시작합니다.',
        ref: { book: 44, chapter: 1, verse: 8, label: '사도행전 1:8' },
      },
    ],
  },

  {
    id: 'paul-1',
    group: 'acts',
    title: '바울의 1차 전도여행',
    short: '바울 1차',
    subtitle: '복음이 처음으로 바다를 건너다',
    era: 'AD 46–48년경',
    scripture: '사도행전 13–14장',
    color: '#db2777',
    hook: '교회가 두 사람을 배에 태워 보냈습니다. 그 배가 닿은 곳마다 교회가 생겼습니다.',
    stops: [
      {
        place: 'antioch-syria',
        title: '보내는 교회',
        narration: '안디옥 교회가 금식하며 기도한 뒤, 바나바와 사울에게 안수하여 보냅니다.',
        ref: { book: 44, chapter: 13, verse: 3, label: '사도행전 13:3' },
      },
      {
        place: 'seleucia',
        title: '항구로 내려가다',
        narration: '두 사람은 항구 실루기아로 내려가, 거기서 배를 타고 바다로 나섭니다.',
        ref: { book: 44, chapter: 13, verse: 4, label: '사도행전 13:4' },
      },
      {
        place: 'salamis',
        title: '바나바의 고향 섬',
        narration: '첫 기착지는 바나바의 고향 구브로. 익숙한 땅의 회당부터 말씀을 전합니다.',
        ref: { book: 44, chapter: 13, verse: 5, label: '사도행전 13:5' },
        sea: true,
      },
      {
        place: 'paphos',
        title: '이름이 바뀌는 자리',
        narration: '섬을 가로질러 바보에 이릅니다. 총독이 믿고, 이때부터 사울은 바울로 불립니다.',
        ref: { book: 44, chapter: 13, verse: 9, label: '사도행전 13:9' },
      },
      {
        place: 'perga',
        title: '한 사람이 돌아가다',
        narration: '배로 본토에 닿습니다. 그런데 마가라 하는 요한이 여기서 일행을 떠납니다.',
        ref: { book: 44, chapter: 13, verse: 13, label: '사도행전 13:13' },
        sea: true,
      },
      {
        place: 'antioch-pisidia',
        title: '이방인에게로',
        narration: '고원을 넘어 올라가 회당에서 설교합니다. "우리가 이방인에게로 향하노라."',
        ref: { book: 44, chapter: 13, verse: 46, label: '사도행전 13:46' },
      },
      {
        place: 'iconium',
        title: '갈라진 성',
        narration: '오래 머물며 담대히 전했지만, 성 전체가 둘로 갈라져 결국 몸을 피합니다.',
        ref: { book: 44, chapter: 14, verse: 4, label: '사도행전 14:4' },
      },
      {
        place: 'lystra',
        title: '신으로 떠받들리고, 돌에 맞고',
        narration: '걷지 못하던 사람이 일어서자 무리가 제사하려 듭니다. 며칠 뒤 바울은 돌에 맞습니다.',
        ref: { book: 44, chapter: 14, verse: 19, label: '사도행전 14:19' },
      },
      {
        place: 'derbe',
        title: '가장 먼 지점',
        narration: '여행이 닿은 가장 먼 곳. 여기서 많은 사람을 제자로 삼고, 발길을 돌립니다.',
        ref: { book: 44, chapter: 14, verse: 21, label: '사도행전 14:21' },
      },
      {
        place: 'lystra',
        title: '돌아가는 길',
        narration: '쫓겨났던 그 도시로 되돌아갑니다. 도망친 곳으로 다시 걸어 들어간 것입니다.',
        ref: { book: 44, chapter: 14, verse: 22, label: '사도행전 14:22' },
        bow: BACK,
      },
      {
        place: 'iconium',
        title: '제자들을 굳게 하고',
        narration: '"우리가 하나님의 나라에 들어가려면 많은 환난을 겪어야 할 것이라" 격려합니다.',
        bow: BACK,
      },
      {
        place: 'antioch-pisidia',
        title: '장로를 세우다',
        narration: '각 교회에서 장로들을 세우고, 금식 기도하며 주께 그들을 맡깁니다.',
        ref: { book: 44, chapter: 14, verse: 23, label: '사도행전 14:23' },
        bow: BACK,
      },
      {
        place: 'perga',
        title: '다시 항구로',
        narration: '고원을 내려와 버가에서 한 번 더 말씀을 전합니다.',
        bow: BACK,
      },
      {
        place: 'attalia',
        title: '집으로 가는 배',
        narration: '앗달리아 항구에서 배에 오릅니다. 떠날 때 둘, 돌아갈 때도 둘입니다.',
        ref: { book: 44, chapter: 14, verse: 25, label: '사도행전 14:25' },
        bow: BACK,
      },
      {
        place: 'antioch-syria',
        title: '믿음의 문이 열리다',
        narration: '보내 준 교회로 돌아와 보고합니다. 하나님이 이방인에게 믿음의 문을 여셨다고.',
        ref: { book: 44, chapter: 14, verse: 27, label: '사도행전 14:27' },
        sea: true,
        bow: BACK,
      },
    ],
  },

  {
    id: 'paul-2',
    group: 'acts',
    title: '바울의 2차 전도여행',
    short: '바울 2차',
    subtitle: '복음이 유럽으로 건너간 밤',
    era: 'AD 49–52년경',
    scripture: '사도행전 15–18장',
    color: '#16a34a',
    hook: '길이 막히고 막히다 서쪽 끝 항구에 닿습니다. 그날 밤 꿈에서 바다 건너편이 부릅니다.',
    stops: [
      {
        place: 'antioch-syria',
        title: '갈라선 두 사람',
        narration: '마가 문제로 바나바와 다투어 갈라섭니다. 바울은 실라를 택해 다시 떠납니다.',
        ref: { book: 44, chapter: 15, verse: 40, label: '사도행전 15:40' },
      },
      {
        place: 'tarsus',
        title: '고향을 지나',
        narration: '이번엔 배가 아니라 육로입니다. 자기 고향 길리기아를 지나 산을 넘습니다.',
        ref: { book: 44, chapter: 15, verse: 41, label: '사도행전 15:41' },
      },
      {
        place: 'derbe',
        title: '세운 교회를 다시',
        narration: '1차 때 세운 교회들을 되짚어 찾아가 그들을 굳게 합니다.',
        ref: { book: 44, chapter: 16, verse: 1, label: '사도행전 16:1' },
      },
      {
        place: 'lystra',
        title: '디모데를 만나다',
        narration: '돌에 맞았던 그 도시에서, 평생의 동역자가 될 젊은이를 얻습니다.',
        ref: { book: 44, chapter: 16, verse: 3, label: '사도행전 16:3' },
      },
      {
        place: 'troas',
        title: '막다른 항구에서 본 환상',
        narration: '아시아에서 말씀 전하기를 성령이 막으십니다. 서쪽 끝에서 밤에 환상을 봅니다.',
        ref: { book: 44, chapter: 16, verse: 9, label: '사도행전 16:9' },
      },
      {
        place: 'neapolis',
        title: '유럽에 첫발',
        narration: '배로 이틀. 복음이 아시아를 떠나 유럽 땅을 처음 밟습니다.',
        ref: { book: 44, chapter: 16, verse: 11, label: '사도행전 16:11' },
        sea: true,
      },
      {
        place: 'philippi',
        title: '강가의 기도처, 그리고 감옥',
        narration: '루디아의 집에서 유럽 첫 교회가 시작되고, 그날 밤 두 사람은 감옥에서 찬송합니다.',
        ref: { book: 44, chapter: 16, verse: 25, label: '사도행전 16:25' },
      },
      {
        place: 'thessalonica',
        title: '세 안식일',
        narration: '고작 세 주 남짓 머물고 쫓겨납니다. 그 짧은 사이에 교회가 남습니다.',
        ref: { book: 44, chapter: 17, verse: 2, label: '사도행전 17:2' },
      },
      {
        place: 'berea',
        title: '날마다 성경을 상고하다',
        narration: '들은 말이 정말인지 매일 성경을 펴 확인한 사람들. 성경은 그들을 칭찬합니다.',
        ref: { book: 44, chapter: 17, verse: 11, label: '사도행전 17:11' },
      },
      {
        place: 'athens',
        title: '알지 못하는 신에게',
        narration: '우상으로 가득한 도시. 바울은 그들의 제단과 시인을 인용하며 말을 겁니다.',
        ref: { book: 44, chapter: 17, verse: 23, label: '사도행전 17:23' },
      },
      {
        place: 'corinth',
        title: '천막을 만들며 일 년 반',
        narration: '아굴라·브리스길라와 함께 일하며 가장 오래 머뭅니다. "이 성중에 내 백성이 많다."',
        ref: { book: 44, chapter: 18, verse: 10, label: '사도행전 18:10' },
      },
      {
        place: 'ephesus',
        title: '잠깐 들르고',
        narration: '더 있어 달라는 청을 뒤로하고, "하나님의 뜻이면 다시 오리라" 하고 떠납니다.',
        ref: { book: 44, chapter: 18, verse: 21, label: '사도행전 18:21' },
        sea: true,
      },
      {
        place: 'caesarea',
        title: '배에서 내려',
        narration: '지중해를 가로질러 유대 땅으로 돌아옵니다.',
        ref: { book: 44, chapter: 18, verse: 22, label: '사도행전 18:22' },
        sea: true,
      },
      {
        place: 'antioch-syria',
        title: '다시 보내는 교회로',
        narration: '출발했던 교회로 돌아와 얼마를 지냅니다.',
        ref: { book: 44, chapter: 18, verse: 22, label: '사도행전 18:22' },
        bow: BACK,
      },
    ],
  },

  {
    id: 'paul-3',
    group: 'acts',
    title: '바울의 3차 전도여행',
    short: '바울 3차',
    subtitle: '아시아 전체가 말씀을 듣다',
    era: 'AD 53–57년경',
    scripture: '사도행전 18–21장',
    color: '#b45309',
    hook: '한 도시에 삼 년을 머물렀더니, 아시아에 사는 사람이 다 말씀을 들었습니다.',
    stops: [
      {
        place: 'antioch-syria',
        title: '세 번째로 떠나다',
        narration: '얼마를 지낸 뒤 또 떠납니다. 이번에도 갈라디아와 브루기아의 제자들부터 찾습니다.',
        ref: { book: 44, chapter: 18, verse: 23, label: '사도행전 18:23' },
      },
      {
        place: 'ephesus',
        title: '두란노 서원에서 두 해',
        narration: '강의실 하나를 빌려 매일 강론합니다. 아시아에 사는 자가 다 주의 말씀을 듣습니다.',
        ref: { book: 44, chapter: 19, verse: 10, label: '사도행전 19:10' },
      },
      {
        place: 'philippi',
        title: '소동 뒤 마게도냐로',
        narration: '은장색들의 소동이 가라앉자 유럽으로 건너가 제자들을 권합니다.',
        ref: { book: 44, chapter: 20, verse: 1, label: '사도행전 20:1' },
        sea: true,
      },
      {
        place: 'corinth',
        title: '헬라에서 석 달',
        narration: '고린도에서 겨울을 납니다. 로마에 보낼 편지를 아마 이 무렵 씁니다.',
        ref: { book: 44, chapter: 20, verse: 3, label: '사도행전 20:3' },
      },
      {
        place: 'troas',
        title: '밤새 강론하다가',
        narration: '이야기가 길어져 자정을 넘기고, 창에 걸터앉았던 유두고가 삼층에서 떨어집니다.',
        ref: { book: 44, chapter: 20, verse: 9, label: '사도행전 20:9' },
        sea: true,
      },
      {
        place: 'assos',
        title: '혼자 걸어서',
        narration: '일행은 배로 보내고 바울만 걸어서 갑니다. 마지막이 될 길을 홀로 걷습니다.',
        ref: { book: 44, chapter: 20, verse: 13, label: '사도행전 20:13' },
      },
      {
        place: 'mitylene',
        title: '섬을 따라 남쪽으로',
        narration: '배는 섬을 끼고 하루씩 내려갑니다. 오순절 전에 예루살렘에 닿으려 서두릅니다.',
        ref: { book: 44, chapter: 20, verse: 14, label: '사도행전 20:14' },
        sea: true,
      },
      {
        place: 'miletus',
        title: '눈물의 고별',
        narration: '에베소 장로들을 불러 마지막 인사를 합니다. 다들 목을 안고 웁니다.',
        ref: { book: 44, chapter: 20, verse: 37, label: '사도행전 20:37' },
        sea: true,
      },
      {
        place: 'tyre',
        title: '가지 말라 만류하다',
        narration: '제자들이 성령의 감동으로 예루살렘에 가지 말라 합니다. 그래도 배에 오릅니다.',
        ref: { book: 44, chapter: 21, verse: 4, label: '사도행전 21:4' },
        sea: true,
      },
      {
        place: 'caesarea',
        title: '결박되리라',
        narration: '아가보가 바울의 띠로 자기 손발을 묶으며 예언합니다. "죽을 것도 각오하였노라."',
        ref: { book: 44, chapter: 21, verse: 13, label: '사도행전 21:13' },
      },
      {
        place: 'jerusalem',
        title: '알면서 걸어 들어가다',
        narration: '무슨 일이 일어날지 다 듣고도 예루살렘으로 올라갑니다. 여기서 체포됩니다.',
        ref: { book: 44, chapter: 21, verse: 17, label: '사도행전 21:17' },
      },
    ],
  },

  {
    id: 'rome',
    group: 'acts',
    title: '로마로 가는 길',
    short: '로마로',
    subtitle: '죄수로 갔지만, 도착했다',
    era: 'AD 59–62년경',
    scripture: '사도행전 27–28장',
    color: '#0891b2',
    hook: '가고 싶어 그렇게 기도하던 도시에, 결국 사슬에 매여 도착합니다.',
    stops: [
      {
        place: 'caesarea',
        title: '죄수가 되어 배에 오르다',
        narration: '이 년의 옥살이 끝에, 가이사에게 상소하여 로마행 배에 오릅니다.',
        ref: { book: 44, chapter: 27, verse: 2, label: '사도행전 27:2' },
      },
      {
        place: 'sidon',
        title: '뜻밖의 친절',
        narration: '백부장 율리오가 죄수인 그에게 친구들을 만나 대접받도록 허락합니다.',
        ref: { book: 44, chapter: 27, verse: 3, label: '사도행전 27:3' },
        sea: true,
      },
      {
        place: 'myra',
        title: '배를 갈아타다',
        narration: '로마로 가는 애굽 곡물선으로 옮겨 탑니다. 계절은 이미 늦가을입니다.',
        ref: { book: 44, chapter: 27, verse: 6, label: '사도행전 27:6' },
        sea: true,
      },
      {
        place: 'fair-havens',
        title: '떠나지 말자던 만류',
        narration: '"이 항해는 위험하다"는 바울의 말을 뒤로하고, 배는 겨울 바다로 나섭니다.',
        ref: { book: 44, chapter: 27, verse: 10, label: '사도행전 27:10' },
        sea: true,
      },
      {
        place: 'malta',
        title: '열나흘 표류, 그리고 파선',
        narration: '유라굴로 광풍에 떠밀려 열나흘. 배는 부서졌지만 276명이 한 사람도 죽지 않습니다.',
        ref: { book: 44, chapter: 27, verse: 44, label: '사도행전 27:44' },
        sea: true,
      },
      {
        place: 'syracuse',
        title: '겨울을 나고 다시',
        narration: '섬에서 석 달을 지낸 뒤 다른 배를 얻어 타고 시칠리아에 닿습니다.',
        ref: { book: 44, chapter: 28, verse: 12, label: '사도행전 28:12' },
        sea: true,
      },
      {
        place: 'rhegium',
        title: '남풍이 불어',
        narration: '이탈리아 발끝에서 하루를 지내자 남풍이 일어, 이틀 만에 다음 항구에 닿습니다.',
        ref: { book: 44, chapter: 28, verse: 13, label: '사도행전 28:13' },
        sea: true,
      },
      {
        place: 'puteoli',
        title: '이미 형제들이 있었다',
        narration: '아직 로마에 닿기도 전인데, 이 항구에 이미 믿는 형제들이 있었습니다.',
        ref: { book: 44, chapter: 28, verse: 14, label: '사도행전 28:14' },
        sea: true,
      },
      {
        place: 'appii-forum',
        title: '마중 나온 사람들',
        narration: '소식을 들은 로마 교인들이 60km를 걸어 나와 맞습니다. 바울이 담대한 마음을 얻습니다.',
        ref: { book: 44, chapter: 28, verse: 15, label: '사도행전 28:15' },
      },
      {
        place: 'rome',
        title: '아무도 막지 못하다',
        narration: '셋집에 갇혀서도 거침없이 가르칩니다. 사도행전은 이 문장에서 멈춥니다.',
        ref: { book: 44, chapter: 28, verse: 31, label: '사도행전 28:31' },
      },
    ],
  },
]

export const getJourney = (id: string): AtlasJourney | undefined =>
  JOURNEYS.find((j) => j.id === id)

/** 여정에서 중복 없는 장소 id 목록 (핀은 장소당 하나만 그린다) */
export const uniquePlaceIds = (journey: AtlasJourney): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const stop of journey.stops) {
    if (seen.has(stop.place)) continue
    seen.add(stop.place)
    out.push(stop.place)
  }
  return out
}

/** 이 장소가 등장하는 다른 여정들 — 핀 카드에서 "같은 자리, 다른 시대"를 잇는다 */
export const journeysAtPlace = (placeId: string): AtlasJourney[] =>
  JOURNEYS.filter((journey) => journey.stops.some((stop) => stop.place === placeId))
