# WEB USFM → {"b:c:v": {"text": plain, "spans": [[s,e],...]}} (예수님 말씀 \wj 구간, plain 기준 위치)
import re, json, sys, os
src = sys.argv[1]
files = {40: '70-MAT', 41: '71-MRK', 42: '72-LUK', 43: '73-JHN', 44: '74-ACT', 66: '96-REV'}
out = {}
for b, pre in files.items():
    raw = open(os.path.join(src, pre + 'eng-web.usfm'), encoding='utf-8').read()
    raw = re.sub(r'\\f .*?\\f\*', '', raw, flags=re.S)       # 각주
    raw = re.sub(r'\\x .*?\\x\*', '', raw, flags=re.S)       # 교차참조
    raw = re.sub(r'\\\+?w ([^|\\]*)\|[^\\]*\\\+?w\*', r'\1', raw)  # \w word|strong\w*
    raw = re.sub(r'\\\+?w\*', '', raw)
    chap = 0
    for tok in re.split(r'(\\c \d+|\\v \d+[a-z]?)', raw):
        m = re.match(r'\\c (\d+)', tok)
        if m: chap = int(m.group(1)); cur = None; continue
        m = re.match(r'\\v (\d+)', tok)
        if m: cur = f'{b}:{chap}:{int(m.group(1))}'; continue
        if not chap or cur is None: continue
        # 남은 문단 마커 제거 (\p, \q1, \m 등) — \wj 는 보존
        t = re.sub(r'\\(?!wj)[a-z]+\d*\*?', ' ', tok)
        plain, spans, inwj, buf = '', [], False, re.split(r'(\\wj\*?)', t)
        for part in buf:
            if part == '\\wj': inwj = True; start = len(plain); continue
            if part == '\\wj*':
                inwj = False; spans.append([start, len(plain)]); continue
            plain += part
        if inwj: spans.append([start, len(plain)])
        # 공백 정규화하면서 위치 재계산
        out.setdefault(cur, {'text': '', 'spans': []})
        base = len(out[cur]['text'])
        out[cur]['text'] += plain
        out[cur]['spans'] += [[s + base, e + base] for s, e in spans]
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
print(len(out), sum(1 for v in out.values() if v['spans']))
