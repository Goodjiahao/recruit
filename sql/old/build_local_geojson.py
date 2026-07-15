"""
把 DataV 市级边界 geojson 下载、合并、坐标精简，固化到前端 public 目录。
结果：frontend/public/geo/china-cities.json
- 4 个直辖市整体边界（北京/天津/上海/重庆）从全国图 100000_full.json 取
- 其余省/自治区/特别行政区 各自 _full.json 取地级市明细
- 仅保留 name 归一化后能匹配 321 城(CSV)的 feature，减小体积
- 每个 feature.properties 写入 norm（归一化城市名），前端直接用，不再运行时计算
- 坐标保留两位小数(~100m精度)，大幅压缩体积
运行：python build_local_geojson.py
"""
import urllib.request, json, os, csv, re

CSV = r'E:\实训\结项项目\智联招聘数据库2025.csv'
OUT = r'E:\实训\结项项目\recruit\frontend\public\geo\china-cities.json'
BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/'

# 归一化（与前端最终版一致：不含「京」，避免 北京->北 的误删）
SUFFIX = (r'(省|市|自治区|自治州|地区|盟|特别行政区|维吾尔|壮族|回族|哈萨克|'
          r'柯尔克孜|蒙古|藏|苗|彝|土家|布依|傣|白|哈尼|傈僳|拉祜|佤|纳西|景颇|'
          r'布朗|阿昌|普米|怒|德昂|独龙|基诺|水|东乡|土|撒拉|保安|裕固|俄罗斯|'
          r'塔塔尔|乌孜别克|锡伯|黎|畲|高山|珞巴|门巴|区|县)$')
def norm(n):
    if not n:
        return ''
    return re.sub(SUFFIX, '', n)

# 321 城（CSV 工作城市）
cities = set()
with open(CSV, encoding='utf-8-sig', newline='') as f:
    for row in csv.DictReader(f):
        c = (row.get('工作城市') or '').strip() or '未知'
        cities.add(c)
city_norm = set(norm(c) for c in cities)
print('CSV 城市数:', len(cities), '| 归一化集合:', len(city_norm))

def rnd(coord):
    if isinstance(coord, list):
        return [rnd(x) for x in coord]
    try:
        return round(float(coord), 2)
    except Exception:
        return coord

def simplify_geom(g):
    if not g:
        return g
    g = dict(g)
    if 'coordinates' in g:
        g['coordinates'] = rnd(g['coordinates'])
    return g

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return json.load(urllib.request.urlopen(req, timeout=20))

features = []
seen = set()
muni_found = 0

# 1) 直辖市整体边界（全国图最可靠）
print('-> 取直辖市整体边界...')
nat = fetch_json(BASE + '100000_full.json')
for f in nat['features']:
    p = f.get('properties', {})
    nm = p.get('name')
    if nm in ('北京市', '天津市', '上海市', '重庆市'):
        nf = norm(nm)
        if nf in city_norm and nm not in seen:
            seen.add(nm)
            ff = dict(f)
            ff['properties'] = dict(p)
            ff['properties']['norm'] = nf
            ff['geometry'] = simplify_geom(f.get('geometry'))
            features.append(ff)
            muni_found += 1
print('   直辖市命中:', muni_found, '/ 4')

# 2) 普通省/自治区/特别行政区 地级市明细
PROV = ['130000','140000','150000','210000','220000','230000','320000','330000',
        '340000','350000','360000','370000','410000','420000','430000','440000',
        '450000','460000','510000','520000','530000','540000','610000','620000',
        '630000','640000','650000','810000','820000']
print('-> 下载', len(PROV), '个省级 _full...')
for code in PROV:
    try:
        d = fetch_json(BASE + code + '_full.json')
    except Exception as e:
        print('   跳过', code, e)
        continue
    for f in d['features']:
        p = f.get('properties', {})
        nm = p.get('name')
        if not nm or nm in seen:
            continue
        nf = norm(nm)
        if nf in city_norm:
            seen.add(nm)
            ff = dict(f)
            ff['properties'] = dict(p)
            ff['properties']['norm'] = nf
            ff['geometry'] = simplify_geom(f.get('geometry'))
            features.append(ff)

matched_norms = {f['properties']['norm'] for f in features}
missing = [c for c in city_norm if c not in matched_norms]
print('总 feature:', len(features))
print('匹配城市数:', len(matched_norms))
print('未匹配 321 城(geojson 无对应地级市, 地图缺失无妨):', len(missing))
if missing:
    print('   样例:', missing[:25])

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as fp:
    json.dump({'type': 'FeatureCollection', 'features': features},
              fp, ensure_ascii=False, separators=(',', ':'))
sz = os.path.getsize(OUT)
print('写出:', OUT, '| 体积 %.2f MB' % (sz / 1024 / 1024))
