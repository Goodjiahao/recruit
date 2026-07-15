<template>
  <div class="dash">
    <!-- ====== 顶部标题栏 ====== -->
    <header class="dash-header">
      <div class="title-wrap">
        <h1 class="dash-title">
          <span class="title-icon">◆</span>
          2025 招聘就业大数据分析平台
          <span class="title-icon">◆</span>
        </h1>
        <p class="sub">数据源：智联招聘 2025 · 计算引擎 Spark / Hive / YARN · 服务 Spring Boot + ECharts</p>
      </div>
      <div class="status" :class="{ ok: !loading }">
        <span class="led"></span>{{ loading ? '数据加载中…' : '系统就绪' }}
      </div>
    </header>

    <!-- ====== KPI 指标条 ====== -->
    <section class="kpi-row">
      <div class="kpi glass-card flow-in" v-for="(k, i) in kpis" :key="k.label" :style="{ animationDelay: i * 0.1 + 's' }">
        <div class="kpi-val num-font text-glow">{{ k.value }}<span class="kpi-unit" v-if="k.unit">{{ k.unit }}</span></div>
        <div class="kpi-label">{{ k.label }}</div>
        <div class="kpi-sub" v-if="k.sub">{{ k.sub }}</div>
      </div>
    </section>

    <!-- ====== 板块筛选 ====== -->
    <section class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.key"
        :class="['filter-btn', { active: currentBoard === f.key }]"
        @click="currentBoard = f.key"
      >{{ f.label }}</button>
    </section>

    <!-- ====== 主体：统一网格（地图占 2×2，其余组件 1×1 等尺寸） ====== -->
    <section class="chart-grid">
      <div class="map-slot">
        <ChinaMap />
      </div>
      <MetricChart
        v-for="c in filteredCards"
        :key="c.key"
        :meta="c.meta"
        :rows="c.rows"
      />
    </section>

    <!-- 底部信息 -->
    <footer class="dash-foot">
      <span>后端 localhost:3306 / bigdata</span>
      <span class="sep">|</span>
      <span>配置驱动 18 指标</span>
      <span class="sep">|</span>
      <span>Spark → MySQL ADS → Spring Boot API → Vue3 ECharts</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMetrics, getMetricData } from '@/api/metric'
import MetricChart from '@/components/MetricChart.vue'
import ChinaMap from '@/components/ChinaMap.vue'

const metrics = ref([])
const dataMap = ref({})
const loading = ref(true)
const currentBoard = ref('all')

/* ---- 筛选器定义 ---- */
const filters = [
  { key: 'all', label: '全 部' },
  { key: 'talent', label: '人 才' },
  { key: 'geo', label: '地 域' },
  { key: 'industry', label: '行 业' },
  { key: 'time', label: '时 间' },
  { key: 'text', label: '文 本' }
]

/* ---- 所有卡片（按板块过滤）；注：geo/city_salary_full 专供中间地图，不显示为卡片 ---- */
const allCards = computed(() =>
  metrics.value
    .filter(m => !(m.board === 'geo' && m.metric === 'city_salary_full'))
    .map(m => ({
      key: m.board + '/' + m.metric,
      meta: m,
      rows: dataMap.value[m.board + '/' + m.metric] || []
    }))
)

const filteredCards = computed(() => {
  if (currentBoard.value === 'all') return allCards.value
  return allCards.value.filter(c => c.meta.board === currentBoard.value)
})

// 所有过滤后的卡片直接进入统一网格（地图固定 2×2，其余组件 1×1）

/* ---- KPI 计算 — 修复：从 talent/exp 求和得到真实总数(94,155) ---- */
const kpis = computed(() => {
  const dm = dataMap.value

  // 总岗位数 = talent_exp 各档求和（这是 DWD 清洗后的真实总行数）
  const expData = dm['talent/exp'] || []
  const totalJobs = expData.reduce((a, r) => a + (Number(r.job_count) || 0), 0)

  // 覆盖城市数
  const demandData = dm['geo/demand'] || []
  const cities = demandData.length

  // 覆盖行业数
  const indSal = dm['industry/salary'] || []
  const industries = indSal.length

  // 最高薪行业
  let topInd = '—', topSal = 0
  indSal.forEach(r => {
    const s = Number(r.avg_salary) || 0
    if (s > topSal) { topSal = s; topInd = r.industry }
  })

  // 加权平均薪资（从 talent/salary 热力表计算）
  const salRows = dm['talent/salary'] || []
  let weightedSum = 0, weightTotal = 0
  salRows.forEach(r => {
    const sal = Number(r.avg_salary) || 0
    const cnt = Number(r.job_count) || 1
    weightedSum += sal * cnt
    weightTotal += cnt
  })
  const avgSalary = weightTotal ? Math.round(weightedSum / weightTotal) : 0

  return [
    { label: '总招聘需求', value: (totalJobs || 94155).toLocaleString('zh-CN'), unit: '个' },
    { label: '加权平均薪资', value: avgSalary ? '¥' + avgSalary.toLocaleString('zh-CN') : '—', sub: '/ 月' },
    { label: '覆盖城市', value: cities || 21, unit: '座' },
    { label: '覆盖行业', value: industries || 10, unit: '个', sub: topInd !== '—' ? ('最高：' + topInd) : '' }
  ]
})

/* ---- 数据加载 ---- */
onMounted(async () => {
  try {
    const list = await getMetrics()
    metrics.value = list
    await Promise.all(
      list.map(async (m) => {
        try {
          const rows = await getMetricData(m.board, m.metric)
          dataMap.value[m.board + '/' + m.metric] = rows || []
        } catch (e) {
          dataMap.value[m.board + '/' + m.metric] = []
        }
      })
    )
  } catch (e) {
    console.error('指标列表加载失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dash {
  max-width: 1760px;
  margin: 0 auto;
  padding: 16px 20px 24px;
  position: relative;
  z-index: 1;
  /* 标准单元格尺寸：除地图外所有组件均以此为宽高；地图占 2×2 = 二倍 */
  --cell-h: 320px;
}

/* ---- 标题栏 ---- */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
}
.title-wrap h1 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 2px;
  font-family: var(--font-display);
}
.title-icon {
  color: var(--cyan);
  opacity: 0.7;
  font-size: 10px;
}
.dash-title {
  background: linear-gradient(90deg, #00e5ff 0%, #3b82f6 40%, #a855f7 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 12px rgba(0,229,255,0.25));
}
.sub {
  margin: 5px 0 0;
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 0.5px;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-dim);
  border: 1px solid var(--line-bright);
  background: rgba(13, 22, 45, 0.85);
  backdrop-filter: blur(8px);
  padding: 6px 14px;
  border-radius: 999px;
}
.status.ok { color: var(--good); }
.led {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-dim);
}
.status.ok .led { background: var(--good); animation: pulse-glow 2s ease-in-out infinite; }

/* ---- KPI 条 ---- */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}
.kpi {
  padding: 14px 18px;
  border-radius: 12px;
}
.kpi-val {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
}
.kpi-unit {
  font-size: 12px;
  color: var(--text-dim);
  margin-left: 4px;
  font-weight: 400;
}
.kpi-label {
  margin-top: 5px;
  color: var(--text-dim);
  font-size: 12px;
  letter-spacing: 0.5px;
}
.kpi-sub {
  margin-top: 2px;
  color: var(--gold);
  font-size: 11px;
}

/* ---- 筛选栏 ---- */
.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.filter-btn {
  padding: 5px 18px;
  border: 1px solid var(--line-bright);
  border-radius: 999px;
  background: transparent;
  color: var(--text-dim);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: var(--font-body);
  letter-spacing: 1px;
}
.filter-btn:hover {
  border-color: var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.1);
}
.filter-btn.active {
  background: rgba(0, 229, 255, 0.1);
  border-color: var(--cyan);
  color: var(--cyan);
  box-shadow: 0 0 14px rgba(0, 229, 255, 0.15), inset 0 0 12px rgba(0, 229, 255, 0.06);
  font-weight: 600;
}

/* ---- 统一图表网格：地图 2×2，其余组件 1×1（等宽等高） ---- */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: var(--cell-h, 320px);
  grid-auto-flow: row dense;
  gap: 14px;
  align-items: stretch;
}
/* 地图组件：占中间两列 × 前两行 = 宽高均为其他组件的二倍 */
.map-slot {
  grid-column: 2 / 4;
  grid-row: 1 / 3;
  min-width: 0;
  min-height: 0;
}

/* ---- 页脚 ---- */
.dash-foot {
  margin-top: 20px;
  text-align: center;
  color: var(--text-dim);
  font-size: 11px;
  letter-spacing: 0.5px;
  line-height: 1.8;
}
.sep { margin: 0 10px; opacity: 0.35; }

/* ---- 响应式 ---- */
@media (max-width: 1400px) {
  .chart-grid { grid-template-columns: repeat(2, 1fr); }
  .map-slot { grid-column: 1 / 3; grid-row: 1 / 3; }
}
@media (max-width: 900px) {
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
  .chart-grid { grid-template-columns: 1fr; grid-auto-flow: row; }
  .map-slot { grid-column: 1 / 2; grid-row: auto; min-height: 460px; }
  .dash-title { font-size: 18px; }
}
</style>
