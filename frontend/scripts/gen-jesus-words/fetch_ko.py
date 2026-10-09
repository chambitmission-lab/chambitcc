import json, urllib.request, sys
out = {}
books = {40: 28, 41: 16, 42: 24, 43: 21, 44: 28, 66: 22}
for b, n in books.items():
    for c in range(1, n + 1):
        d = json.load(urllib.request.urlopen(f'http://localhost:8000/api/v1/bible/chapter/{b}/{c}'))
        for v in d['verses']:
            out[f'{b}:{c}:{v["verse"]}'] = v['text']
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(out))
