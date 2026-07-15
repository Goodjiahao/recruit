# -*- coding: utf-8 -*-
"""
用全量 CSV 重算 ads_city_salary（城市级平均薪资表），覆盖全量 321 个城市。

薪资清洗规则（关键，修复“承德=全国最高”等离群点失真）：
- 仅统计有效薪资记录：最低月薪 >= 1000 且 最高月薪 >= 最低月薪 且 最高月薪 <= 100000。
  （过滤“面议/缺失”的 0 值、min=49 这类垃圾、以及 max=25 万这类极端离群点）
- job_count  = 该城市招聘记录总数（含无薪资的“面议”岗位，代表需求规模）
- avg_salary = 该城市【有效记录】(最低月薪+最高月薪)/2 的真实均值（四舍五入到分）
- min_salary = 有效记录最低月薪最小值
- max_salary = 有效记录最高月薪最大值
同步写库（DROP/CREATE/INSERT）并导出可独立重跑的 .sql 文件。
"""
import csv, collections, os, pymysql

CSV_PATH = r'E:\实训\结项项目\智联招聘数据库2025.csv'
SQL_OUT = r'E:\实训\结项项目\recruit\sql\ads_city_salary_full.sql'
DB = dict(host='127.0.0.1', port=3306, user='root', password='123456',
          database='bigdata', charset='utf8mb4')

cnt = collections.Counter()        # city -> 记录数
sum_avg = collections.defaultdict(float)  # city -> Σ(avg)
min_s = collections.defaultdict(lambda: 1e18)
max_s = collections.defaultdict(lambda: -1e18)


def to_num(x):
    x = (x or '').strip()
    if x in ('', 'None', 'null'):
        return None
    try:
        return float(x)
    except Exception:
        return None


with open(CSV_PATH, encoding='utf-8-sig', newline='') as f:
    r = csv.DictReader(f)
    for row in r:
        c = (row.get('工作城市') or '').strip()
        if not c:
            c = '未知'
        lo = to_num(row.get('最低月薪'))
        hi = to_num(row.get('最高月薪'))
        cnt[c] += 1
        if lo is not None and hi is not None and hi >= lo and lo >= 1000 and hi <= 100000:
            sum_avg[c] += (lo + hi) / 2.0
            if lo < min_s[c]:
                min_s[c] = lo
            if hi > max_s[c]:
                max_s[c] = hi

# 组装结果（按平均薪资降序，便于 TOP15 复用同一表）
rows = []
for c, n in cnt.items():
    avg = round(sum_avg[c] / n, 2) if n else 0
    lo = round(min_s[c], 2) if min_s[c] < 1e18 else 0
    hi = round(max_s[c], 2) if max_s[c] > -1e18 else 0
    rows.append((c, n, avg, lo, hi))
rows.sort(key=lambda t: t[2], reverse=True)

print(f'解析城市数 = {len(rows)}，总记录数 = {sum(cnt.values())}')

# ---------- 导出 SQL ----------
lines = []
lines.append('-- 全量城市平均薪资表（由 generate_ads_city_salary.py 生成）')
lines.append('-- 数据源：智联招聘数据库2025.csv（95,484 条）')
lines.append('DROP TABLE IF EXISTS `ads_city_salary`;')
lines.append("""CREATE TABLE `ads_city_salary` (
  `city` varchar(50) DEFAULT NULL,
  `job_count` int DEFAULT NULL,
  `avg_salary` double DEFAULT NULL,
  `max_salary` double DEFAULT NULL,
  `min_salary` double DEFAULT NULL,
  KEY `idx_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;""")
vals = []
for c, n, avg, lo, hi in rows:
    cc = c.replace("'", "\\'")
    vals.append(f"('{cc}',{n},{avg},{hi},{lo})")
# 分批写入，避免单行过长
BATCH = 200
for i in range(0, len(vals), BATCH):
    chunk = ',\n'.join(vals[i:i+BATCH])
    lines.append('INSERT INTO `ads_city_salary` (`city`,`job_count`,`avg_salary`,`max_salary`,`min_salary`) VALUES')
    lines.append(chunk + ';')
with open(SQL_OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print('已写出 SQL ->', SQL_OUT)

# ---------- 同步写库 ----------
try:
    conn = pymysql.connect(**DB, connect_timeout=8)
    cur = conn.cursor()
    cur.execute('DROP TABLE IF EXISTS ads_city_salary')
    cur.execute("""CREATE TABLE ads_city_salary (
        city VARCHAR(50) DEFAULT NULL,
        job_count INT DEFAULT NULL,
        avg_salary DOUBLE DEFAULT NULL,
        max_salary DOUBLE DEFAULT NULL,
        min_salary DOUBLE DEFAULT NULL,
        KEY idx_city (city)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4""")
    data = [(c, n, avg, hi, lo) for (c, n, avg, lo, hi) in rows]
    cur.executemany(
        'INSERT INTO ads_city_salary (city,job_count,avg_salary,max_salary,min_salary) VALUES (%s,%s,%s,%s,%s)',
        data)
    conn.commit()
    cur.execute('SELECT COUNT(*), SUM(job_count) FROM ads_city_salary')
    nrows, total = cur.fetchone()
    print(f'库内同步完成：行数={nrows}，SUM(job_count)={total}')
    conn.close()
except Exception as e:
    print('写库失败：', repr(e))
    raise
