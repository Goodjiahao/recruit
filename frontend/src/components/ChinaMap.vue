<template>
  <div class="china-map-wrap glass-card">
    <div class="map-head">
      <span class="dot"></span>
      <span class="map-title">{{ title }}</span>
      <span class="map-tag">{{ mode }}</span>
    </div>
    <div ref="mapEl" class="map-body"></div>
    <div v-if="!mapReady" class="map-loading">{{ loadingText }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

// 省级视角：geoData 不再由后端驱动，改为读取本地固化资源（写死，稳定可复现）
const mapEl = ref(null)
const mapReady = ref(false)
const mode = ref('')
const loadingText = ref('地图数据加载中…')
let chart = null

const title = '全国招聘岗位地域分布'

// 本地固化资源（build_local_province_geojson.py / build_province_jobs.py 生成）
let GEO = null
let JOBS = {}          // province_norm -> job_count
let TAIWAN_CENTER = null

// 低/无岗位的统一底色（岗位 <50 与 =0 同色）
const LOW_COLOR = '#1b2a4a'

async function loadLocalFiles() {
  const base = import.meta.env.BASE_URL || '/'
  const [geoRes, jobRes] = await Promise.all([
    fetch(base + 'geo/china-provinces.json'),
    fetch(base + 'geo/province_jobs.json')
  ])
  if (!geoRes.ok) throw new Error('geo HTTP ' + geoRes.status)
  if (!jobRes.ok) throw new Error('jobs HTTP ' + jobRes.status)
  GEO = await geoRes.json()
  JOBS = await jobRes.json()
  // 定位台湾省中心，用于重点标注
  for (const f of GEO.features) {
    const p = f.properties || {}
    if ((p.name || '').includes('台湾') || p.norm === '台湾') {
      TAIWAN_CENTER = p.centroid || p.center || null
    }
  }
  echarts.registerMap('china-prov', GEO)
}

// 计算 visualMap 上界：取非零值的 90 分位，使梯度铺开、头部省不独大
function calcMax() {
  const vals = Object.values(JOBS).filter(v => v > 0).sort((a, b) => a - b)
  if (!vals.length) return 5000
  const p90 = vals[Math.floor(vals.length * 0.9)]
  return Math.max(p90, 3000)
}

function buildOption() {
  // 用 geojson 全量省份（含 0 岗位省）生成 data，保证「没有岗位的省份也显示出来」
  const data = GEO.features.map(f => {
    const p = f.properties || {}
    const norm = p.norm
    const val = Number(JOBS[norm] || 0)
    const isTw = (p.name || '').includes('台湾') || norm === '台湾'
    const item = {
      name: p.name,                 // 必须匹配地图 region 名（全称）
      value: val,
      jobCount: val
    }
    if (isTw) {
      // 台湾省：金色描边重点显示；填充仍按 0 岗位取统一低色
      item.itemStyle = {
        borderColor: '#ffd700',
        borderWidth: 2.6,
        areaColor: LOW_COLOR,
        shadowBlur: 18,
        shadowColor: 'rgba(255,215,0,0.55)'
      }
    }
    return item
  })

  const max = calcMax()

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5,10,20,0.94)',
      borderColor: 'rgba(56,180,252,0.3)',
      borderWidth: 1,
      textStyle: { color: '#e0ecff', fontSize: 12 },
      formatter(p) {
        if (typeof p.value !== 'number') return p.name
        const jc = p.data && p.data.jobCount
        const s = `<b style="color:#00e5ff">${p.name}</b><br/>招聘岗位：<b>${Number(jc).toLocaleString('zh-CN')}</b> 个`
        if (!jc) s += `<br/><span style="color:#7b8fb8">（无岗位数据）</span>`
        return s
      }
    },
    visualMap: {
      show: true,
      type: 'continuous',
      min: 50,                       // <50 与 0 均落入最低色（同一颜色）
      max,
      left: 14,
      bottom: 12,
      text: ['多', '少'],
      textStyle: { color: '#7b8fb8', fontSize: 10 },
      calculable: true,
      itemWidth: 10,
      itemHeight: 88,
      inRange: {
        color: [LOW_COLOR, '#1e6fcf', '#38bdf8', '#67e8f9', '#facc15']
      }
    },
    series: [{
      name: '省级岗位数',
      type: 'map',
      map: 'china-prov',
      roam: true,
      zoom: 1.15,
      layoutCenter: ['50%', '50%'],
      layoutSize: '100%',
      label: { show: false, color: '#9fb3d8', fontSize: 9 },
      emphasis: {
        label: { show: true, color: '#fff', fontSize: 11 },
        itemStyle: {
          areaColor: '#1a3a6a',
          borderColor: 'rgba(0,229,255,0.9)',
          shadowBlur: 20,
          shadowColor: 'rgba(0,229,255,0.5)'
        }
      },
      itemStyle: {
        areaColor: LOW_COLOR,
        borderColor: 'rgba(56,180,252,0.22)',
        borderWidth: 0.5
      },
      data
    }]
  }
}

// 在台湾省中心叠加常驻金色标注（重点显示台湾省）
function placeTaiwanLabel() {
  if (!chart || !TAIWAN_CENTER) return
  // 用 setTimeout(0) 把 setOption 移出 ECharts 主渲染流程（finished 事件内），
  // 否则会触发 "[ECharts] setOption should not be called during main process" 警告
  setTimeout(() => {
    if (!chart || !TAIWAN_CENTER) return
    try {
      const px = chart.convertToPixel({ seriesIndex: 0 }, TAIWAN_CENTER)
      if (!px) return
      chart.setOption({
        graphic: [{
          type: 'text',
          id: 'tw-label',
          left: px[0],
          top: px[1] - 6,
          z: 100,
          style: {
            text: '★ 台湾省',
            fill: '#ffd700',
            font: 'bold 12px sans-serif',
            textAlign: 'center',
            textVerticalAlign: 'bottom',
            shadowColor: 'rgba(0,0,0,0.6)',
            shadowBlur: 4
          }
        }]
      })
    } catch (e) { /* 布局未完成时忽略 */ }
  }, 0)
}

async function render() {
  if (!chart) return
  if (!GEO) {
    try {
      await loadLocalFiles()
    } catch (e) {
      console.error('[ChinaMap] 本地地图资源加载失败', e)
      loadingText.value = '地图资源缺失（geo/china-provinces.json 或 province_jobs.json）'
      mode.value = '资源缺失'
      return
    }
  }
  chart.setOption(buildOption(), true)
  mode.value = `省级 · ${GEO.features.length} 省 · 含0岗位省`
  mapReady.value = true
  placeTaiwanLabel()
}

function onResize() {
  if (chart) {
    chart.resize()
    placeTaiwanLabel()
  }
}

onMounted(async () => {
  if (!mapEl.value) return
  chart = echarts.init(mapEl.value, null, { renderer: 'canvas' })
  chart.on('finished', placeTaiwanLabel)
  window.addEventListener('resize', onResize)
  await render()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  if (chart) { chart.dispose(); chart = null }
})
</script>

<style scoped>
.china-map-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.map-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px 6px;
  flex-shrink: 0;
}
.dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan-glow);
  flex-shrink: 0;
}
.map-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}
.map-tag {
  font-size: 10px;
  color: var(--text-dim);
  border: 1px solid var(--line-bright);
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
}
.map-body {
  flex: 1;
  width: 100%;
  min-height: 0;
}
.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 13px;
  background: rgba(5,10,20,0.6);
}
</style>
