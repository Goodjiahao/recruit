# -*- coding: utf-8 -*-
"""
修正 ads_geo_demand：以全量 CSV 为唯一真源，重新聚合城市需求。
输出：(1) 修正版 SQL 脚本  (2) 直接同步本机 bigdata 库 ads_geo_demand 表。

口径：
  job_count   = 该城市招聘记录条数（岗位总数）
  demand_pct  = job_count / 全量总岗位数 * 100
  demand_rank = 按 job_count 降序排名
  update_time = 插入时由 DB 自动填充（DEFAULT CURRENT_TIMESTAMP）
"""
import csv, collections

CSV = r'E:\实训\结项项目\智联招聘数据库2025.csv'
OUT = r'E:\实训\结项项目\recruit\sql\ads_geo_demand_fixed.sql'

# ---------- 1. 读取并聚合 ----------
cnt = collections.Counter()
total = 0
with open(CSV, encoding='utf-8-sig', newline='') as f:
    r = csv.DictReader(f)
    for row in r:
        total += 1
        c = (row.get('工作城市') or '').strip() or '未知'
        cnt[c] += 1

ranked = cnt.most_common()  # 已按 count 降序
rows = []
for i, (city, n) in enumerate(ranked, start=1):
    pct = round(n / total * 100, 2)
    rows.append((city, n, i, pct))

# ---------- 2. 生成 SQL 文件 ----------
def esc(s):
    return s.replace("'", "''")

lines = []
lines.append("-- 修正 ads_geo_demand：基于全量 CSV 真实聚合（%d 条记录，%d 个城市）" % (total, len(rows)))
lines.append("-- 由 generate_ads_geo_demand.py 自动生成。update_time 由 DB 自动填充。")
lines.append("DROP TABLE IF EXISTS `ads_geo_demand`;")
lines.append("CREATE TABLE `ads_geo_demand` (")
lines.append("  `city`        varchar(50) DEFAULT NULL COMMENT '城市',")
lines.append("  `job_count`   int(11)     DEFAULT NULL COMMENT '岗位总数',")
lines.append("  `demand_rank` int(11)     DEFAULT NULL COMMENT '需求排名',")
lines.append("  `demand_pct`  double      DEFAULT NULL COMMENT '需求占比(%)',")
lines.append("  `update_time` datetime    DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'")
lines.append(") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;")
lines.append("")
lines.append("INSERT INTO `ads_geo_demand` (`city`, `job_count`, `demand_rank`, `demand_pct`) VALUES")
val_lines = ["  ('%s', %d, %d, %s)" % (esc(c), n, rk, pct) for (c, n, rk, pct) in rows]
lines.append(",\n".join(val_lines) + ";")
with open(OUT, 'w', encoding='utf-8') as f:
    f.write("\n".join(lines) + "\n")

print('[SQL] wrote ->', OUT)
print('[SQL] rows=%d  total_jobs=%d  sum_check=%d' % (len(rows), total, sum(n for _, n, _, _ in rows)))
print('[SQL] TOP5:', rows[:5])

# ---------- 3. 同步数据库 ----------
import pymysql
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456',
                       database='bigdata', charset='utf8mb4', autocommit=False)
try:
    cur = conn.cursor()
    cur.execute('TRUNCATE TABLE ads_geo_demand')
    sql = ('INSERT INTO ads_geo_demand (city, job_count, demand_rank, demand_pct) '
           'VALUES (%s, %s, %s, %s)')
    cur.executemany(sql, rows)
    conn.commit()
    cur.execute('SELECT COUNT(*), SUM(job_count) FROM ads_geo_demand')
    print('[DB ] after sync count,sum =', cur.fetchone())
    cur.execute("SELECT city, job_count, demand_rank, demand_pct FROM ads_geo_demand WHERE city='北京'")
    print('[DB ] 北京 =', cur.fetchone())
    cur.execute("SELECT city, job_count, demand_rank, demand_pct FROM ads_geo_demand ORDER BY demand_rank LIMIT 3")
    print('[DB ] TOP3 =', cur.fetchall())
finally:
    conn.close()
print('[DONE] ads_geo_demand 已用全量 CSV 真实数据同步完成')
