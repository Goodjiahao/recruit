<template>
  <div class="chart-card glass-card">
    <div class="chart-head">
      <span :class="['board-pill', meta.board || 'talent']">{{ boardLabel }}</span>
      <span class="chart-title">{{ meta.title }}</span>
      <span class="chart-unit" v-if="meta.unit">单位：{{ meta.unit }}</span>
    </div>
    <div ref="el" class="chart-body"></div>
    <div v-if="error" class="chart-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import 'echarts-wordcloud'

const props = defineProps({
  meta: { type: Object, required: true },
  rows: { type: Array, default: () => [] }
})

const el = ref(null)
const error = ref('')
let chart = null
let ro = null

/* ---- 科幻风调色板 ---- */
const PALETTE = ['#00e5ff', '#3b82f6', '#a855f7', '#f472b6', '#fbbf24', '#34d399', '#22d3ee', '#fb7185']
const AXIS_COLOR = '#7b8fb8'
const SPLIT_COLOR = 'rgba(56,180,252,0.08)'
const AREA_COLORS = ['rgba(13,26,52,0.4)', 'rgba(19,36,70,0.4)']

/* ---- 板块中文标签 ---- */
const boardMap = { talent: '人才', geo: '地域', industry: '行业', time: '时间', text: '文本' }
const boardLabel = computed(() => (props.meta && boardMap[props.meta.board]) || '分析')

/* ---- 工具函数 ---- */
const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const uniq = (arr) => [...new Set(arr)]

function orderedCats(values, orderHint, reverse = false) {
  const present = uniq(values)
  const hint = (orderHint || []).filter(x => present.includes(x))
  const rest = present.filter(x => !(orderHint || []).includes(x))
  let result = hint.concat(rest)
  if (reverse) result = [...result].reverse()
  return result
}

function baseGrid() {
  return { left: 12, right: 24, top: 24, bottom: 16, containLabel: true }
}
function baseTooltip() {
  return {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(5,10,20,0.92)',
    borderColor: 'rgba(56,180,252,0.2)',
    borderWidth: 1,
    textStyle: { color: '#e0ecff', fontSize: 12 }
  }
}
function axisCommon() {
  return {
    axisLine: { lineStyle: { color: 'rgba(56,180,252,0.18)' } },
    axisTick: { show: false },
    axisLabel: { color: AXIS_COLOR, fontSize: 11 },
    splitLine: { lineStyle: { color: SPLIT_COLOR } }
  }
}

function buildOption() {
  const m = props.meta
  const rows = props.rows || []
  if (!rows.length) return null

  switch (m.chartType) {

    /* ========== 横向柱状 ========== */
    case 'barH': {
      // 横向柱状图最多展示 TOP15：geo/demand 放开 limit 后返回全量(321)，图表仅取前 15；
      // 其余 TOP15 指标后端本就 limit=15，此截断无影响。
      const plotRows = rows.length > 15 ? rows.slice(0, 15) : rows
      const cats = plotRows.map(r => r[m.xField])
      const vals = plotRows.map(r => toNum(r[m.valueField]))
      return {
        grid: baseGrid(),
        tooltip: baseTooltip(),
        xAxis: { type: 'value', ...axisCommon(), axisLabel: { formatter: v => Number(v).toLocaleString('zh-CN') } },
        yAxis: { type: 'category', data: cats, inverse: true, ...axisCommon(), axisLabel: { color: AXIS_COLOR, fontSize: 11 } },
        series: [{
          type: 'bar',
          data: vals,
          barWidth: '54%',
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#00e5ff' }
            ])
          },
          label: { show: true, position: 'right', color: '#93a0c4', fontSize: 10, formatter: p => Number(p.value).toLocaleString('zh-CN') },
          emphasis: { itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,229,255,0.35)' } }
        }]
      }
    }

    /* ========== 饼/环状图 ========== */
    case 'pie': {
      const data = rows.map(r => ({ name: r[m.xField], value: toNum(r[m.valueField]) }))
      return {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', backgroundColor: 'rgba(5,10,20,0.92)', borderColor: 'rgba(56,180,252,0.2)', textStyle: { color: '#e0ecff' } },
        legend: { type: 'scroll', bottom: 4, textStyle: { color: AXIS_COLOR, fontSize: 10 }, pageTextStyle: { color: AXIS_COLOR }, itemWidth: 10, itemHeight: 10 },
        color: PALETTE,
        series: [{
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['50%', '46%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#0a0f1e', borderWidth: 2, borderRadius: 4 },
          label: { color: '#cdd9f2', fontSize: 11, formatter: '{b}\n{d}%' },
          labelLine: { length: 8, length2: 8, lineStyle: { color: 'rgba(123,143,184,0.35)' } },
          emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,229,255,0.3)' } },
          data
        }]
      }
    }

    /* ========== 折线图 ========== */
    case 'line': {
      const map = {}
      rows.forEach(r => {
        const k = r[m.xField]
        map[k] = (map[k] || 0) + (toNum(r[m.valueField]) || 0)
      })
      const xs = Object.keys(map).sort((a, b) => Number(a) - Number(b))
      const ys = xs.map(k => map[k])
      return {
        grid: baseGrid(),
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(5,10,20,0.92)', borderColor: 'rgba(56,180,252,0.2)', textStyle: { color: '#e0ecff' } },
        xAxis: { type: 'category', boundaryGap: false, data: xs, ...axisCommon(), axisLabel: { color: AXIS_COLOR } },
        yAxis: { type: 'value', ...axisCommon(), axisLabel: { formatter: v => Number(v).toLocaleString('zh-CN') } },
        series: [{
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          data: ys,
          lineStyle: { width: 3, color: '#00e5ff' },
          itemStyle: { color: '#00e5ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,229,255,0.28)' },
              { offset: 1, color: 'rgba(0,229,255,0.01)' }
            ])
          },
          emphasis: { itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,229,255,0.45)' } }
        }]
      }
    }

    /* ========== 热力图 — 重点修复轴序 + 色条位置 ========== */
    case 'heatmap': {
      const defaultExpOrder = ['经验不限', '无经验', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上']
      const defaultEduOrder = ['初中及以下', '中专/中技', '大专', '本科', '硕士', '博士', 'MBA/EMBA']

      const xCats = orderedCats(rows.map(r => r[m.xField]), m.xOrder || defaultExpOrder)
      const yCats = orderedCats(rows.map(r => r[m.yField]), m.yOrder || defaultEduOrder, true)

      const data = rows.map(r => [xCats.indexOf(r[m.xField]), yCats.indexOf(r[m.yField]), toNum(r[m.valueField])])
      const vals = data.map(d => d[2]).filter(v => v != null)
      const min = vals.length ? Math.min(...vals) : 0
      const max = vals.length ? Math.max(...vals) : 1

      return {
        grid: { left: 72, right: 20, top: 18, bottom: 82, containLabel: false },
        tooltip: {
          position: 'top',
          backgroundColor: 'rgba(5,10,20,0.94)',
          borderColor: 'rgba(56,180,252,0.25)',
          borderWidth: 1,
          textStyle: { color: '#e0ecff', fontSize: 12 },
          formatter: (p) => `${yCats[p.data[1]]} · ${xCats[p.data[0]]}<br/>均值：<b style="color:#00e5ff">${Number(p.data[2]).toLocaleString('zh-CN')}</b>`
        },
        xAxis: {
          type: 'category', data: xCats,
          ...axisCommon(),
          axisLabel: { color: AXIS_COLOR, fontSize: 10, rotate: 0 },
          splitArea: { show: true, areaColor: AREA_COLORS }
        },
        yAxis: {
          type: 'category', data: yCats,
          ...axisCommon(),
          axisLabel: { color: AXIS_COLOR, fontSize: 11 },
          splitArea: { show: true, areaColor: AREA_COLORS }
        },
        visualMap: {
          min, max, calculable: true,
          orient: 'horizontal', left: 'center', bottom: 6,
          textStyle: { color: AXIS_COLOR, fontSize: 10 },
          itemWidth: 14, itemHeight: 70,
          inRange: { color: ['#2f7fd1', '#28b6e8', '#22d3c5', '#6ee7a8', '#f7d44c', '#ff9b5c'] }
        },
        series: [{
          type: 'heatmap',
          data,
          label: {
            show: true,
            color: '#0b1020',
            fontSize: 10,
            formatter: p => (p.data[2] != null ? Math.round(p.data[2]).toString() : '')
          },
          emphasis: { itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,229,255,0.5)' } },
          itemStyle: { borderRadius: 3, borderColor: 'rgba(56,180,252,0.15)', borderWidth: 1 }
        }]
      }
    }

    /* ========== 堆叠柱状图 ========== */
    case 'stackedBar': {
      const agg = {}
      rows.forEach(r => {
        const c = r[m.categoryField]
        const s = r[m.seriesField]
        const v = toNum(r[m.valueField]) || 0
        agg[c] = agg[c] || {}
        agg[c][s] = (agg[c][s] || 0) + v
      })
      const totals = Object.entries(agg).map(([c, o]) => [c, Object.values(o).reduce((a, b) => a + b, 0)])
      totals.sort((a, b) => b[1] - a[1])
      const topCats = totals.slice(0, m.topN || 8).map(t => t[0])
      const seriesNames = uniq(rows.map(r => r[m.seriesField]))
      const series = seriesNames.map((sn, i) => ({
        name: sn,
        type: 'bar',
        stack: 'total',
        emphasis: { focus: 'series' },
        itemStyle: { color: PALETTE[i % PALETTE.length], borderRadius: i === seriesNames.length - 1 ? [4, 4, 0, 0] : 0 },
        data: topCats.map(c => (agg[c] && agg[c][sn]) || 0)
      }))
      return {
        grid: { left: 12, right: 16, top: 40, bottom: 12, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(5,10,20,0.92)', borderColor: 'rgba(56,180,252,0.2)', textStyle: { color: '#e0ecff' } },
        legend: { top: 0, textStyle: { color: AXIS_COLOR, fontSize: 10 }, type: 'scroll', itemWidth: 12, itemHeight: 8 },
        xAxis: { type: 'category', data: topCats, ...axisCommon(), axisLabel: { color: AXIS_COLOR, interval: 0, rotate: topCats.length > 6 ? 28 : 0, fontSize: 10 } },
        yAxis: { type: 'value', ...axisCommon(), axisLabel: { formatter: v => Number(v).toLocaleString('zh-CN') } },
        series
      }
    }

    /* ========== 词云 ========== */
    case 'wordcloud': {
      const data = rows.map(r => ({ name: r[m.xField], value: toNum(r[m.valueField]) }))
      return {
        tooltip: { show: true, backgroundColor: 'rgba(5,10,20,0.92)', borderColor: 'rgba(56,180,252,0.2)', textStyle: { color: '#e0ecff' } },
        series: [{
          type: 'wordCloud',
          sizeRange: [14, 58],
          rotationRange: [-30, 30],
          rotationStep: 15,
          gridSize: 8,
          shape: 'circle',
          width: '100%',
          height: '100%',
          textStyle: {
            fontFamily: 'var(--font-body)',
            color: () => PALETTE[Math.floor(Math.random() * PALETTE.length)]
          },
          data
        }]
      }
    }

    default:
      return null
  }
}

function render() {
  if (!el.value) return
  if (!chart) chart = echarts.init(el.value)
  try {
    const opt = buildOption()
    if (!opt) {
      error.value = '暂无数据'
      chart.clear()
      return
    }
    error.value = ''
    chart.setOption(opt, true)
  } catch (e) {
    error.value = '渲染失败：' + (e && e.message ? e.message : e)
  }
}

onMounted(() => {
  render()
  ro = new ResizeObserver(() => chart && chart.resize())
  ro.observe(el.value)
})

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (chart) { chart.dispose(); chart = null }
})

watch(() => [props.rows, props.meta], () => nextTick(render), { deep: true })
</script>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px 14px 8px;
}
.chart-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
  padding: 0 4px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chart-unit {
  margin-left: auto;
  font-size: 10px;
  color: var(--text-dim);
  flex-shrink: 0;
}
.chart-body {
  flex: 1;
  width: 100%;
  min-height: 260px;
}
.chart-error {
  color: var(--text-dim);
  font-size: 13px;
  text-align: center;
  padding: 40px 0;
}
</style>
