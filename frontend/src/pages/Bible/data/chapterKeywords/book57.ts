import type { BookKeywords } from './types'

// 빌레몬서 — 이 장의 열쇠말
const keywords: BookKeywords = {
  1: [
    {
      word: '마음·심복',
      match: ['마음', '심복'],
      count: 3,
      meaning: '‘마음’과 ‘심복’은 헬라어로 같은 한 단어예요.',
      original: { lang: 'gr', script: 'σπλάγχνα', sound: '스플랑크나', gloss: '창자 — 가장 깊은 속마음' },
      why: '빌레몬이 성도들의 "마음"을 평안케 했고(7절), 오네시모는 바울의 "심복"이며(12절), 이제 바울의 "마음"을 평안케 해 달래요(20절). 바울은 도망친 종을 자기 속마음이라 부르며 보내요.',
      alsoIn: [{ ref: '골로새서 4:9', note: '신실하고 사랑을 받는 형제 오네시모를 함께 보내노니' }],
    },
    {
      word: '사랑',
      match: ['사랑'],
      count: 5,
      meaning: '명령 대신 바울이 기대는 부탁의 근거예요.',
      original: { lang: 'gr', script: 'ἀγάπη', sound: '아가페', gloss: '사랑' },
      why: '바울은 사도의 권위로 명할 수 있지만 "도리어 사랑으로써 간구하노라"(9절) 해요. 그리고 오네시모를 종이 아닌 "사랑 받는 형제"(16절)로 맞아 달라고 하죠. ‘유익’(오네시모 이름 뜻)의 말놀이도 숨어 있어요(11절).',
    },
  ],
}

export default keywords
