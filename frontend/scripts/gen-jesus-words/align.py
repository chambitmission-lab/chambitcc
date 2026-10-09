# 영어 \wj 구간 → 개역개정 어절 구간. 결과: {"b:c:v": "all" | [[from, to], ...]} + 검토 목록
import re, json, sys
en = json.load(open(sys.argv[1])); ko = json.load(open(sys.argv[2]))
LET = re.compile(r'[A-Za-z0-9]')
INTRO = re.compile(r'(시되|시기를|사대|하시되|말씀에)[,.]?$')
OTHER = re.compile(r'(이르되|대답하되|말하되|여짜오되|가로되|하되|이르기를|말하기를)[,.]?$')
STRICT = re.compile(r'^(하시니|하시고|하시매|하시니라|하시더라|하셨더라|하셨으니|하시거늘|하시며|하신대|하시므로|하심이|하시는지라|하셨느니라|하시되|하신즉|하셨음)')
LEAD = re.compile(r'(가|이|은|는|께서|들이|하여|에게|도|서로|또|그러나|이에)$')
CLOSER = re.compile(r'^(하시|하신|하셨|하심|말씀하시|말씀하신)')
res, review, stats = {}, [], {'all': 0, 'part': 0, 'fail': 0}

def letters_before(text, pos):
    return len(LET.findall(text[:pos]))

OVERRIDE = json.load(open(sys.argv[4]))
for key, phrases in OVERRIDE.items():
    toks = re.findall(r'\S+', ko[key]); out = []
    for ph in phrases:
        pw = ph.split(); n2 = len(pw)
        idx = [i for i in range(len(toks) - n2 + 1) if toks[i:i + n2] == pw]
        assert idx, (key, ph)
        out.append([idx[0], idx[0] + n2])
    if out: res[key] = 'all' if out == [[0, len(toks)]] else out
for key, e in en.items():
    if key in OVERRIDE: continue
    if not e['spans']: continue
    text = e['text']; total = len(LET.findall(text))
    if not total: continue
    # 글자 없이 붙은 구간은 하나로
    segs = []
    for s, t in sorted(e['spans']):
        if segs and not LET.search(text[segs[-1][1]:s]): segs[-1][1] = t
        else: segs.append([s, t])
    segs = [[letters_before(text, s), letters_before(text, t)] for s, t in segs]
    segs = [g for g in segs if g[1] > g[0]]
    if not segs: continue
    k = ko.get(key, '')
    if not k.strip(): continue
    if len(segs) == 1 and segs[0][0] == 0 and segs[0][1] == total:
        res[key] = 'all'; stats['all'] += 1; continue
    toks = re.findall(r'\S+', k); n = len(toks)
    out, cursor, ok = [], 0, True
    for ls, le in segs:
        fs, fe = ls / total, le / total
        if ls == 0: st = 0
        else:
            cands = [i + 1 for i, w in enumerate(toks) if i >= cursor and INTRO.search(w)]
            if cands: st = min(cands, key=lambda c: abs(c / n - fs))
            elif fs < 0.3 and cursor == 0: st = 0
            else: ok = False; break
        if le == total:
            c = [j for j in range(st + 1, n) if STRICT.match(toks[j])]
            en_ = c[0] if c else n
        else:
            cands = [j for j, w in enumerate(toks) if j > st and CLOSER.match(w)]
            for j, w in enumerate(toks):
                if j > st and OTHER.search(w) and not INTRO.search(w):
                    b = j
                    while b - 1 > st and j - b < 3 and LEAD.search(toks[b - 1]): b -= 1
                    cands.append(b)
            if not cands: ok = False; break
            en_ = min(cands, key=lambda c: abs(c / n - fe))
        if en_ <= st: ok = False; break
        out.append([st, en_]); cursor = en_
    if not ok:
        stats['fail'] += 1; review.append((key, text.strip()[:160], segs, total, k)); continue
    if out == [[0, n]]: res[key] = 'all'; stats['all'] += 1
    else: res[key] = out; stats['part'] += 1
json.dump({'res': res, 'review': review}, open(sys.argv[3], 'w'), ensure_ascii=False)
print(stats)
