# -*- coding: utf-8 -*-
"""
固化「省级」边界 geojson 到前端 public 目录。
结果：frontend/public/geo/china-provinces.json
- 下载 DataV 全国图 100000_full.json（省级，34 个省级行政区，含台湾省/港/澳）
- 每个 feature.properties 写入 norm（归一化省名），前端直接用，不再运行时计算
- 坐标保留两位小数(~1km精度)，压缩体积
- 全量 34 省全部保留（含 0 岗位省，满足「没有岗位的省份也显示出来」）
运行：python build_local_province_geojson.py
"""
import urllib.request, json, os, re

OUT = r'E:\实训\结项项目\recruit\frontend\public\geo\china-provinces.json'
BASE = 'https://geo.datav.aliyun.com/areas_v3/bound/'

# 与前端保持一致的省名归一化（剥离省级后缀）
SUFFIX = (r'(省|市|自治区|自治州|地区|盟|特别行政区|维吾尔|壮族|回族|哈萨克|'
          r'柯尔克孜|蒙古|藏|苗|彝|土家|布依|傣|白|哈尼|傈僳|拉祜|佤|纳西|景颇|'
          r'布朗|阿昌|普米|怒|德昂|独龙|基诺|水|东乡|土|撒拉|保安|裕固|俄罗斯|'
          r'塔塔尔|乌孜别克|锡伯|黎|畲|高山|珞巴|门巴|区|县)$')
def norm(n):
    if not n:
        return ''
    # 第一轮：剥离省级通用后缀（省/市/自治区/特别行政区…）
    n = re.sub(SUFFIX, '', n)
    # 第二轮：剥离自治区尾部残留的 ethnic 后缀（如 广西壮族->广西、宁夏回族->宁夏、新疆维吾尔->新疆）
    n = re.sub(r'(壮族|维吾尔|回族|哈萨克|柯尔克孜)$', '', n)
    return n

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
    return json.load(urllib.request.urlopen(req, timeout=30))

print('-> 下载全国省级边界 100000_full.json ...')
nat = fetch_json(BASE + '100000_full.json')
print('   原始省级 feature 数:', len(nat['features']))

features = []
for f in nat['features']:
    p = f.get('properties', {})
    nm = p.get('name')
    if not nm:
        continue
    nf = norm(nm)
    ff = dict(f)
    ff['properties'] = dict(p)
    ff['properties']['norm'] = nf
    ff['geometry'] = simplify_geom(f.get('geometry'))
    features.append(ff)

# 按 adcode 排序，保证稳定顺序（直辖市/省/自治区/特别行政区）
features.sort(key=lambda x: x['properties'].get('adcode', 0))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as fp:
    json.dump({'type': 'FeatureCollection', 'features': features},
              fp, ensure_ascii=False, separators=(',', ':'))
sz = os.path.getsize(OUT)
print('写出:', OUT, '| 省级 feature 数:', len(features), '| 体积 %.2f MB' % (sz / 1024 / 1024))
print('省份列表:')
for f in features:
    print('   ', f['properties']['adcode'], f['properties']['name'], '->', f['properties']['norm'])
