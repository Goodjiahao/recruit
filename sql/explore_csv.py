import csv, collections, sys

path = r'E:\实训\结项项目\智联招聘数据库2025.csv'
cnt = collections.Counter()
total = 0
empty = 0
# 同时统计 招聘人数(列名"招聘人数") 求和，供参考
hire = collections.Counter()
with open(path, encoding='utf-8-sig', newline='') as f:
    r = csv.DictReader(f)
    cols = r.fieldnames
    for row in r:
        total += 1
        c = (row.get('工作城市') or '').strip()
        if not c:
            empty += 1
            c = '未知'
        cnt[c] += 1
        h = (row.get('招聘人数') or '').strip()
        try:
            hire[c] += int(float(h)) if h not in ('', 'None') else 0
        except Exception:
            pass

print('TOTAL_ROWS', total, 'EMPTY_CITY', empty, 'N_CITIES', len(cnt))
print('COLUMNS', cols)
print('--- TOP 40 cities by job_count ---')
for c, n in cnt.most_common(40):
    print(f'{c}\t{n}\t{hire[c]}')
