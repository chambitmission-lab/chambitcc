import { describe, expect, it } from 'vitest'
import { parseSummaryNotes } from './summaryNotes'

// 창세기 37:1-4 요약 해석 — 운영 데이터 그대로
const GEN_37 = `**야곱이 가나안 땅 ... 에 거주하였으니**(1절) **요셉이 십칠 세의 소년으로서 ... 말하더라**(2절).

'야곱이 가나안에 거주하고 십칠 세 요셉이 형들과 양을 치며 그들의 잘못을 아버지에게 말했다'는 것은, 에서가 세일로 떠난(36장) 것과 달리 야곱이 약속의 땅에 거하며 약속의 계보(야곱의 족보)로 이야기가 넘어감을 보이고, 요셉의 미성숙한 면도 곧 큰 고난을 통해 빚어져 갈 것을 보입니다(1-2절).

- '★야곱이 노년에 얻은 라헬의 아들 요셉을 더 사랑하여 채색옷을 입히매 형들이 그를 미워하여 편안히 말할 수 없었다'는 것은, 일찍이 이삭과 리브가의 편애(25:28)와 야곱 자신의 라헬 편애(33:2)가 이어진 가정의 죄가 채색옷이라는 눈에 보이는 편애로 드러나 형제의 시기와 미움을 부르고, 그 미움이 곧 살의와 인신매매라는 더 큰 죄로 자라남을(약 1:15·요일 3:15 형제를 미워하는 자는 살인하는 자) 보입니다(3-4절)

> 나는 편애가 아니라 차별 없는 사랑으로 가정을 세우며, 시기와 미움을 마음에서 끊어 내나요?`

describe('parseSummaryNotes', () => {
  it('인용·풀이·참조 구절·절 범위를 가르고 ★ 는 핵심 표시로 바꾼다', () => {
    const parsed = parseSummaryNotes(GEN_37, 1)!
    expect(parsed.notes).toHaveLength(2)

    const [first, second] = parsed.notes
    expect(first.range).toBe('1-2절')
    expect(first.key).toBe(false)
    expect(first.points).toEqual([
      '에서가 세일로 떠난 것과 달리 야곱이 약속의 땅에 거하며 약속의 계보(야곱의 족보)로 이야기가 넘어감을 보입니다.',
      '요셉의 미성숙한 면도 곧 큰 고난을 통해 빚어져 갈 것을 보입니다.',
    ])
    // 책 이름 없는 구절은 이 해석이 달린 책의 것
    expect(first.refs).toEqual(['창 36장'])

    expect(second.range).toBe('3-4절')
    expect(second.key).toBe(true)
    expect(second.quote).not.toContain('★')
    expect(second.refs).toEqual(['창 25:28', '창 33:2', '약 1:15', '요일 3:15'])
    // 구절만 걷어내고 덧말은 남긴다
    expect(second.points.join(' ')).toContain('(형제를 미워하는 자는 살인하는 자)')

    expect(parsed.application).toBe(
      '나는 편애가 아니라 차별 없는 사랑으로 가정을 세우며, 시기와 미움을 마음에서 끊어 내나요?',
    )
  })

  it('꼬리 괄호의 절 범위와 참조 구절을 나누고, 이어 쓴 불릿도 한 줄씩 읽는다', () => {
    const parsed = parseSummaryNotes(
      `**여호와는 나의 목자시니**(1절) **그가 나를 푸른 풀밭에 누이시며**(2절).

- '여호와는 나의 목자시니 내게 부족함이 없으리로다'는 것은, 목자를 소유한 자가 그분 안에서 온전히 자족함을 보입니다(1절·요 10:11·빌 4:19)
- '사망의 음침한 골짜기로 다닐지라도 ... 주께서 나와 함께 하심이라'는 것은, 죽음의 골짜기에서도 두려움을 이기는 것이 함께하시는 목자의 임재임을 보입니다(4절·히 13:5)`,
      19,
    )!
    expect(parsed.notes.map((n) => n.range)).toEqual(['1절', '4절'])
    expect(parsed.notes[0].refs).toEqual(['요 10:11', '빌 4:19'])
    expect(parsed.notes[1].quote).toContain('다닐지라도 ... 주께서')
  })

  it("'후에 42:6'의 '에'를 에스더로 읽지 않는다", () => {
    const parsed = parseSummaryNotes(
      `'요셉이 두 꿈을 꾸고 형들에게 말했다'는 것은, 그 꿈이 하나님의 계시이며(후에 42:6·47장 성취) 반드시 이루어질 것임을 보입니다(5-7·9절).`,
      1,
    )!
    expect(parsed.notes[0].range).toBe('5-7·9절')
    expect(parsed.notes[0].refs).toEqual(['창 42:6', '창 47장'])
    expect(parsed.notes[0].points[0]).toBe('그 꿈이 하나님의 계시이며 반드시 이루어질 것임을 보입니다.')
  })

  it('줄글로 쓰인 요약 해석은 손대지 않는다(null → 예전 지면)', () => {
    expect(
      parseSummaryNotes(
        `유대인의 지도자 **니고데모가 밤에 예수께 와**(1~2절) 하나님께로부터 오신 선생이라 인정합니다.

가장 종교적인 사람조차, 위로부터 새로 태어나야 합니다.

- 거듭남은 인생의 개선이 아니라, 성령으로 받는 완전히 새로운 생명입니다

> 나는 거듭남을 경험했나요?`,
        43,
      ),
    ).toBeNull()
  })
})
