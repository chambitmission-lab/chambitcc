import { describe, expect, it } from 'vitest'
import { PARAGRAPH_GAP, wrapPrayerText } from './glyphLayout'

// 글자 하나 = 폭 1
const width = (s: string) => Array.from(s).length

describe('wrapPrayerText', () => {
  it('엔터 한 번은 줄바꿈', () => {
    expect(wrapPrayerText('첫 줄\n둘째 줄', width, 20)).toEqual([
      { text: '첫 줄', gap: 0 },
      { text: '둘째 줄', gap: 0 },
    ])
  })

  it('빈 줄은 문단 간격 하나 (여러 줄이어도)', () => {
    expect(wrapPrayerText('가\n\n\n나', width, 20)).toEqual([
      { text: '가', gap: 0 },
      { text: '나', gap: PARAGRAPH_GAP },
    ])
  })

  it('낱말 가운데서 끊지 않는다', () => {
    const lines = wrapPrayerText('오늘 하루 너무 버겁습니다. 아멘.', width, 10)
    expect(lines.map((l) => l.text)).toEqual(['오늘 하루 너무', '버겁습니다. 아멘.'])
  })

  it('폭보다 긴 낱말만 글자 단위로 자른다', () => {
    expect(wrapPrayerText('가나다라마바', width, 4).map((l) => l.text)).toEqual(['가나다라', '마바'])
  })

  it('앞뒤 빈 줄은 간격을 만들지 않는다', () => {
    expect(wrapPrayerText('\n\n가\n\n', width, 20)).toEqual([{ text: '가', gap: 0 }])
  })
})
