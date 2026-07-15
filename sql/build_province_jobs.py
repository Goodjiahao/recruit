# -*- coding: utf-8 -*-
"""
把「城市级岗位数」(ads_city_demand) 聚合为「省级岗位数」，固化到前端 public 目录。
结果：frontend/public/geo/province_jobs.json  { province_norm: job_count, ... }  (全 34 省，含 0)
- 用 DataV 省级 _full.json 建立 城市norm -> 省norm 映射（adcode 前两位=省代码）
- 直辖市(北京/天津/上海/重庆/香港/澳门) 城市名即省级，直接映射
- 读取本机 MySQL bigdata.ads_city_demand 的城市岗位数，按省聚合
- 未匹配的城市打印出来，便于核查覆盖度
运行：python build_province_jobs.py
"""
import urllib.request, json, os, re, pymysql

OUT = r'E:\实训\结项项目\recruit\frontend\public\geo\province_jobs.json'
PROV_GEO = r'E:\实训\结项项目\recruit\frontend\public\geo\china-provinces.json'
BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/'

# 省名归一化（与 build_local_province_geojson.py 完全一致）
SUFFIX = (r'(省|市|自治区|自治州|地区|盟|特别行政区|维吾尔|壮族|回族|哈萨克|'
          r'柯尔克孜|蒙古|藏|苗|彝|土家|布依|傣|白|哈尼|傈僳|拉祜|佤|纳西|景颇|'
          r'布朗|阿昌|普米|怒|德昂|独龙|基诺|水|东乡|土|撒拉|保安|裕固|俄罗斯|'
          r'塔塔尔|乌孜别克|锡伯|黎|畲|高山|珞巴|门巴|区|县)$')
def norm(n):
    if not n:
        return ''
    n = re.sub(SUFFIX, '', n)
    n = re.sub(r'(壮族|维吾尔|回族|哈萨克|柯尔克孜)$', '', n)
    return n

# 直辖市 / 特别行政区：城市名即省级
MUNI = {'北京', '天津', '上海', '重庆', '香港', '澳门'}

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return json.load(urllib.request.urlopen(req, timeout=30))

# ---- 1) 省级 adcode -> 省norm ----
prov_geo = json.load(open(PROV_GEO, encoding='utf-8'))
prov_by_prefix = {}   # '11' -> '北京'
prov_norm_list = []
for f in prov_geo['features']:
    p = f['properties']
    code = str(p['adcode'])
    pn = p['norm']
    prov_by_prefix[code[:2]] = pn
    prov_norm_list.append(pn)
print('省级行政区数:', len(prov_norm_list))

# ---- 2) 建立 城市norm -> 省norm 映射（下载各省 _full）----
city2prov = {}
# 直辖市：城市名本身即省
for m in MUNI:
    city2prov[m] = m

PROV_CODES = ['110000','120000','130000','140000','150000','210000','220000','230000',
              '310000','320000','330000','340000','350000','360000','370000','410000',
              '420000','430000','440000','450000','460000','500000','510000','520000',
              '530000','540000','610000','620000','630000','640000','650000','710000',
              '810000','820000']
print('-> 下载各省 _full 建立城市->省映射 ...')
for code in PROV_CODES:
    try:
        d = fetch_json(BASE + code + '_full.json')
    except Exception as e:
        print('   跳过', code, e)
        continue
    pn = prov_by_prefix.get(code[:2])
    if not pn:
        continue
    for f in d['features']:
        nm = f.get('properties', {}).get('name')
        if not nm:
            continue
        cn = norm(nm)
        if cn and cn not in city2prov:
            city2prov[cn] = pn
print('   城市->省 映射条数:', len(city2prov))

# ---- 3) 读取 ads_city_demand 并聚合 ----
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456',
                       database='bigdata', charset='utf8mb4', autocommit=True)
cur = conn.cursor()
cur.execute('SELECT city, job_count FROM ads_city_demand')
rows = cur.fetchall()
conn.close()
print('ads_city_demand 城市行数:', len(rows))

agg = {pn: 0 for pn in prov_norm_list}
unmapped = []
total_jobs = 0
mapped_jobs = 0
for city, cnt in rows:
    total_jobs += int(cnt or 0)
    cn = norm((city or '').strip())
    pn = city2prov.get(cn)
    if pn:
        agg[pn] += int(cnt or 0)
        mapped_jobs += int(cnt or 0)
    else:
        unmapped.append((city, int(cnt or 0)))

print('映射覆盖城市数:', len(rows) - len(unmapped), '/', len(rows))
print('映射覆盖岗位数: %d / %d (%.1f%%)' % (mapped_jobs, total_jobs, 100.0*mapped_jobs/total_jobs if total_jobs else 0))
if unmapped:
    unmapped.sort(key=lambda x: -x[1])
    print('未映射城市 TOP15 (city, jobs):', unmapped[:15])

# ---- 4) 写出 ----
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as fp:
    json.dump(agg, fp, ensure_ascii=False, separators=(',', ':'))
print('写出:', OUT)
print('--- 各省岗位数（降序）---')
for pn, v in sorted(agg.items(), key=lambda x: -x[1]):
    print('   %s: %d' % (pn, v))
