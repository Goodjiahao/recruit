# -*- coding: utf-8 -*-
"""提取招聘就业平台关键统计，生成写死进 AI 系统提示词的数据摘要。"""
import json
import pymysql

conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456',
                       database='bigdata', charset='utf8mb4', autocommit=True)
cur = conn.cursor()
L = []


def section(title):
    L.append("")
    L.append(f"【{title}】")


def q(sql, params=None):
    try:
        cur.execute(sql, params or ())
        return cur.fetchall()
    except Exception as e:
        L.append(f"  (查询失败: {e})")
        return []


# ---------- 总览 ----------
row = q("SELECT SUM(job_count), COUNT(DISTINCT city) FROM ads_city_demand")
if row and row[0]:
    total, cities = row[0]
    L.append(f"数据来源：智联招聘 2025 年招聘数据（共 {total} 条岗位记录，覆盖 {cities} 个城市）。")

# ---------- 学历分布 ----------
section("学历分布（按岗位数）")
for name, cnt in q("SELECT education, job_count FROM ads_edu_dist ORDER BY job_count DESC"):
    L.append(f"  - {name}：{cnt} 个岗位")

# ---------- 经验要求 ----------
section("经验要求分布")
for name, cnt in q("SELECT exp_req, job_count FROM ads_talent_exp ORDER BY job_count DESC"):
    L.append(f"  - {name}：{cnt} 个岗位")

# ---------- 薪资水平（学历×经验均值） ----------
section("平均薪资水平（元/月，按学历）")
for name, avg in q("SELECT edu_level, ROUND(AVG(avg_salary)) FROM ads_talent_salary GROUP BY edu_level ORDER BY AVG(avg_salary) DESC"):
    L.append(f"  - {name}：约 {avg} 元")
row = q("SELECT ROUND(AVG(avg_salary)) FROM ads_talent_salary")
if row:
    L.append(f"  - 全平台平均：约 {row[0][0]} 元")

# ---------- 薪资区间结构 ----------
section("薪资区间结构分布")
for bucket, cnt in q("SELECT salary_bucket, job_count FROM ads_talent_salary_struct ORDER BY job_count DESC"):
    L.append(f"  - {bucket}：{cnt} 个岗位")

# ---------- 招聘规模 ----------
section("企业招聘规模分布")
for bucket, cnt in q("SELECT scale_bucket, job_count FROM ads_talent_scale ORDER BY job_count DESC"):
    L.append(f"  - {bucket}：{cnt} 个岗位")

# ---------- 地域 TOP 城市 ----------
section("招聘需求 TOP10 城市")
for i, (city, cnt) in enumerate(q("SELECT city, job_count FROM ads_city_demand ORDER BY job_count DESC LIMIT 10"), 1):
    L.append(f"  {i}. {city}：{cnt} 个岗位")

# ---------- 地域 TOP 省份（读本地 province_jobs.json） ----------
try:
    with open(r"E:\实训\结项项目\recruit\frontend\public\geo\province_jobs.json", encoding="utf-8") as f:
        pj = json.load(f)
    top = sorted(((k, v) for k, v in pj.items() if v and k not in ("香港", "澳门", "台湾")),
                 key=lambda x: -x[1])[:10]
    section("招聘需求 TOP10 省份")
    for i, (prov, cnt) in enumerate(top, 1):
        L.append(f"  {i}. {prov}：{cnt} 个岗位")
except Exception as e:
    L.append(f"(province_jobs 读取失败: {e})")

# ---------- 行业 ----------
section("行业招聘需求 TOP10")
for name, cnt in q("SELECT industry, SUM(job_count) AS s FROM industry_job_stat GROUP BY industry ORDER BY s DESC LIMIT 10"):
    L.append(f"  - {name}：{cnt} 个岗位")

section("行业平均薪资 TOP10（元/月）")
for name, avg in q("SELECT industry, ROUND(AVG(avg_salary)) AS a FROM industry_salary_stat GROUP BY industry ORDER BY a DESC LIMIT 10"):
    L.append(f"  - {name}：约 {avg} 元")

# ---------- 时间趋势 ----------
section("月度招聘趋势（按发布月份）")
for mon, cnt in q("SELECT mon, SUM(job_count) FROM ads_time_trend GROUP BY mon ORDER BY mon"):
    if cnt is None: cnt = 0
    L.append(f"  - {mon}：{cnt} 个岗位")

# ---------- 技能词云 ----------
section("热门技能关键词 TOP15")
for i, (skill, cnt) in enumerate(q("SELECT word, count FROM skill_word_cloud ORDER BY count DESC LIMIT 15"), 1):
    L.append(f"  {i}. {skill}（{cnt}）")

# ---------- 福利提及率 ----------
section("福利待遇提及率 TOP10")
for welfare, rate in q("SELECT welfare_name, mention_rate FROM welfare_mention_rate ORDER BY mention_rate DESC LIMIT 10"):
    L.append(f"  - {welfare}：{rate}%")

# ---------- 热门公司 ----------
section("热门招聘企业 TOP10")
for i, (company, cnt) in enumerate(q("SELECT company_name, job_count FROM top_company ORDER BY job_count DESC LIMIT 10"), 1):
    L.append(f"  {i}. {company}：{cnt} 个岗位")

# ---------- 热门职位 ----------
section("热门职位 TOP10")
for i, (job, cnt) in enumerate(q("SELECT job_title, job_count FROM ads_hot_jobs ORDER BY job_count DESC LIMIT 10"), 1):
    L.append(f"  {i}. {job}：{cnt} 个岗位")

out = "\n".join(L)
print(out)
with open(r"E:\实训\结项项目\recruit\sql\ai_context.txt", "w", encoding="utf-8") as f:
    f.write(out)
print("\n[written] ai_context.txt")
cur.close()
conn.close()
