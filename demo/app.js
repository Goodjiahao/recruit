/* =========================================================================
 * app.js  —  18 项标准指标演示页交互与可视化引擎
 * 依赖：echarts (CDN) + mock-data.js (window.MOCK)
 * ========================================================================= */
(function () {
  'use strict';

  const M = window.MOCK;
  const PALETTE = ['#38bdf8', '#5b9dff', '#a78bfa', '#34d399', '#fbbf24',
    '#f472b6', '#fb7185', '#22d3ee', '#facc15', '#a3e635', '#f97316', '#c084fc'];

  let currentBoard = 'all';

  const cardCharts = {};        // id -> echarts instance (card)
  let mapChart = null;
  let mapMetric = 'jobCount';
  let modalChart = null;
  let modalIndicator = null;

  /* ---------------------- 通用格式化 ---------------------- */
  const fmt = (n) => Number(n).toLocaleString('en-US');
  const yuan = (n) => '¥' + fmt(Math.round(n));
  const pct = (n) => (Math.round(n * 10) / 10) + '%';
  const m = (k, v) => ({ k, v });

  function echartsReady() {
    if (!window.echarts) {
      const fb = document.getElementById('fatalBanner');
      if (fb) fb.hidden = false;
      return false;
    }
    return true;
  }

  /* ---------------------- 通用 option 构造器 ---------------------- */
  function barOpt(cats, vals, c1, c2, unit, rotate) {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => fmt(v) + ' ' + unit },
      grid: { left: 6, right: 16, top: 16, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category', data: cats, boundaryGap: true,
        axisLabel: { color: '#9fb2d6', interval: 0, rotate: rotate || 0, fontSize: 11 },
        axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } }, axisTick: { show: false }
      },
      yAxis: {
        type: 'value', axisLabel: { color: '#9fb2d6', formatter: (v) => fmt(v) },
        splitLine: { lineStyle: { color: 'rgba(95,140,220,.12)' } }
      },
      series: [{
        type: 'bar', data: vals, barMaxWidth: 28,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]) },
        emphasis: { itemStyle: { color: c1 } }
      }]
    };
  }

  function hbarOpt(cats, vals, c1, c2, unit) {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => fmt(v) + ' ' + unit },
      grid: { left: 6, right: 24, top: 12, bottom: 4, containLabel: true },
      xAxis: { type: 'value', axisLabel: { color: '#9fb2d6', formatter: (v) => fmt(v) }, splitLine: { lineStyle: { color: 'rgba(95,140,220,.12)' } } },
      yAxis: { type: 'category', data: cats, inverse: true, axisLabel: { color: '#cdd9f2', fontSize: 11 }, axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } }, axisTick: { show: false } },
      series: [{
        type: 'bar', data: vals, barMaxWidth: 18,
        itemStyle: { borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: c2 }, { offset: 1, color: c1 }]) },
        label: { show: true, position: 'right', color: '#9fb2d6', fontSize: 10, formatter: (p) => fmt(p.value) }
      }]
    };
  }

  function pieOpt(datas, unit) {
    return {
      tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>${fmt(p.value)} ${unit} (${p.percent}%)` },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: '#9fb2d6', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['42%', '68%'], center: ['50%', '44%'], avoidLabelOverlap: true,
        itemStyle: { borderColor: '#11203f', borderWidth: 2, borderRadius: 6 },
        label: { color: '#cdd9f2', fontSize: 11, formatter: '{b}\n{d}%' },
        labelLine: { length: 10, length2: 8 },
        data: datas
      }]
    };
  }

  function heatOpt(xCats, yCats, cells, unit) {
    let mn = Infinity, mx = -Infinity;
    cells.forEach((c) => { if (c[2] < mn) mn = c[2]; if (c[2] > mx) mx = c[2]; });
    return {
      tooltip: { position: 'top', formatter: (p) => `${yCats[p.value[1]]} · ${xCats[p.value[0]]}<br/>${yuan(p.value[2])}` },
      grid: { left: 70, right: 16, top: 14, bottom: 56, containLabel: true },
      xAxis: { type: 'category', data: xCats, splitArea: { show: true }, axisLabel: { color: '#9fb2d6', fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } } },
      yAxis: { type: 'category', data: yCats, splitArea: { show: true }, axisLabel: { color: '#cdd9f2', fontSize: 11 }, axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } } },
      visualMap: { min: mn, max: mx, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, itemWidth: 12, itemHeight: 90, textStyle: { color: '#9fb2d6' }, inRange: { color: ['#0b1430', '#1e3a8a', '#2563eb', '#38bdf8', '#34d399', '#fbbf24'] } },
      series: [{ type: 'heatmap', data: cells, label: { show: true, color: '#04111f', fontSize: 10, formatter: (p) => fmt(p.value[2]) }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(56,189,248,.6)' } } }]
    };
  }

  function lineOpt(xCats, seriesArr, unit) {
    return {
      tooltip: { trigger: 'axis', valueFormatter: (v) => fmt(v) + ' ' + unit },
      legend: { top: 0, textStyle: { color: '#9fb2d6', fontSize: 11 }, itemWidth: 14, itemHeight: 8 },
      grid: { left: 6, right: 18, top: 40, bottom: 6, containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xCats, axisLabel: { color: '#9fb2d6', fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } } },
      yAxis: { type: 'value', axisLabel: { color: '#9fb2d6', formatter: (v) => fmt(v) }, splitLine: { lineStyle: { color: 'rgba(95,140,220,.12)' } } },
      series: seriesArr.map((s, i) => ({
        name: s.name, type: 'line', smooth: true, symbol: 'circle', symbolSize: 6, showSymbol: false,
        data: s.data, lineStyle: { width: 2, color: PALETTE[i % PALETTE.length] },
        itemStyle: { color: PALETTE[i % PALETTE.length] },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: PALETTE[i % PALETTE.length] + '33' }, { offset: 1, color: PALETTE[i % PALETTE.length] + '00' }]) }
      }))
    };
  }

  function stackedBarOpt(cats, levelNames, matrix, paletteBase) {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { type: 'scroll', bottom: 0, textStyle: { color: '#9fb2d6', fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
      grid: { left: 6, right: 14, top: 14, bottom: 44, containLabel: true },
      xAxis: { type: 'category', data: cats, axisLabel: { color: '#9fb2d6', interval: 0, rotate: cats.length > 6 ? 30 : 0, fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(95,140,220,.3)' } }, axisTick: { show: false } },
      yAxis: { type: 'value', axisLabel: { color: '#9fb2d6', formatter: (v) => fmt(v) }, splitLine: { lineStyle: { color: 'rgba(95,140,220,.12)' } } },
      series: levelNames.map((lv, i) => ({
        name: lv, type: 'bar', stack: 'total', data: matrix[i],
        itemStyle: { color: PALETTE[(paletteBase + i) % PALETTE.length], borderRadius: i === levelNames.length - 1 ? [4, 4, 0, 0] : 0 }
      }))
    };
  }

  function wordCloudItems(items) {
    const max = Math.max(...items.map((x) => x.weight || x.mention_rate || 1));
    const min = Math.min(...items.map((x) => x.weight || x.mention_rate || 0));
    return items.map((x, i) => {
      const w = x.weight || x.mention_rate || 0;
      const size = 13 + (w - min) / (max - min || 1) * 26;
      return { text: x.keyword || x.company || x.welfare_keyword || x.skill, size, color: PALETTE[i % PALETTE.length] };
    });
  }

  function renderWordCloud(container, items, big) {
    container.innerHTML = '';
    container.className = 'wordcloud';
    const wrap = document.createElement('div');
    wrap.className = 'wordcloud';
    wrap.style.height = big ? '100%' : '100%';
    items.forEach((it) => {
      const s = document.createElement('span');
      s.textContent = it.text;
      s.style.fontSize = it.size.toFixed(1) + 'px';
      s.style.color = it.color;
      s.style.fontWeight = it.size > 28 ? '700' : '500';
      wrap.appendChild(s);
    });
    container.innerHTML = '';
    container.appendChild(wrap);
  }

  /* ---------------------- 指标注册表（18 项） ---------------------- */
  const INDICATORS = [
    /* ---------- 地域板块 (6) ---------- */
    {
      id: 'geo_demand', board: 'geo', title: '招聘需求地域分布', sub: '各省级行政区岗位总量',
      chart: '柱状图', desc: '按省级行政区统计招聘职位总量，反映人才需求的地域集中度与核心经济带分布。',
      option(modal) {
        const d = M.geo.geo_demand.slice(0, modal ? 20 : 12);
        return barOpt(d.map((x) => x.short), d.map((x) => x.job_count), '#38bdf8', '#2563eb', '个', d.length > 8 ? 32 : 0);
      },
      side: () => [m('覆盖省份', M.provinces.length + ' 个'), m('首位省份', M.geo.geo_demand[0].short), m('首位岗位', fmt(M.geo.geo_demand[0].job_count))],
      table: () => M.geo.geo_demand.slice(0, 12).map((x) => ({ dim: x.short, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'geo_salary', board: 'geo', title: '各省份平均薪资', sub: '省级平均月薪水平',
      chart: '柱状图', desc: '对比各省级行政区的平均招聘月薪，展示薪酬水平的地域梯度。',
      option(modal) {
        const d = M.geo.geo_salary.slice(0, modal ? 20 : 12);
        return barOpt(d.map((x) => x.short), d.map((x) => x.avg_salary), '#fbbf24', '#f59e0b', '元', d.length > 8 ? 32 : 0);
      },
      side: () => [m('全国加权均值', yuan(M.weightedSalary)), m('最高省份', M.geo.geo_salary[0].short), m('最高薪资', yuan(M.geo.geo_salary[0].avg_salary))],
      table: () => M.geo.geo_salary.slice(0, 12).map((x) => ({ dim: x.short, val: yuan(x.avg_salary) }))
    },
    {
      id: 'geo_job', board: 'geo', title: '热门招聘岗位 TOP', sub: '岗位需求量排名',
      chart: '条形图', desc: '按招聘职位数量排序的热门岗位榜单，识别市场需求最旺盛的职能方向。',
      option(modal) {
        const d = M.geo.geo_job.slice(0, modal ? 18 : 12).slice().reverse();
        return hbarOpt(d.map((x) => x.job_title), d.map((x) => x.job_count), '#5b9dff', '#38bdf8', '个');
      },
      side: () => [m('榜单岗位数', M.geo.geo_job.length + ' 类'), m('榜首岗位', M.geo.geo_job[0].job_title), m('榜首需求', fmt(M.geo.geo_job[0].job_count))],
      table: () => M.geo.geo_job.slice(0, 12).map((x, i) => ({ dim: (i + 1) + '. ' + x.job_title, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'geo_area', board: 'geo', title: '城市区域招聘分布', sub: '核心城市各区岗位量',
      chart: '条形图', desc: '以招聘需求最高的核心城市为例，展示其下辖区县的岗位分布密度。',
      option(modal) {
        const d = M.geo.geo_area.slice().reverse();
        return hbarOpt(d.map((x) => x.area), d.map((x) => x.job_count), '#a78bfa', '#7c3aed', '个');
      },
      side: () => [m('示例城市', '北京市'), m('覆盖城区', M.geo.geo_area.length + ' 区'), m('核心城区', M.geo.geo_area[0].area)],
      table: () => M.geo.geo_area.map((x) => ({ dim: x.area, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'geo_edu', board: 'geo', title: '各省份学历要求分布', sub: '省份 × 学历门槛',
      chart: '堆叠柱', desc: '选取招聘需求最高的省份，对比其各学历门槛的岗位构成，反映区域人才质量差异。',
      option() {
        const top = M.geo.geo_edu.map((p) => ({ p, total: p.edu.reduce((s, e) => s + e.job, 0) }))
          .sort((a, b) => b.total - a.total).slice(0, 8).map((x) => x.p);
        const levels = M.EDU_LEVELS;
        const matrix = levels.map((lv) => top.map((p) => { const e = p.edu.find((x) => x.edu === lv); return e ? e.job : 0; }));
        return stackedBarOpt(top.map((p) => p.short), levels, matrix, 0);
      },
      side: () => [m('对比省份', '8 个'), m('学历层级', M.EDU_LEVELS.length + ' 级'), m('维度', '省份 × 学历')],
      table: () => {
        const top = M.geo.geo_edu.map((p) => ({ p, total: p.edu.reduce((s, e) => s + e.job, 0) })).sort((a, b) => b.total - a.total).slice(0, 6).map((x) => x.p);
        return top.map((p) => ({ dim: p.short, val: fmt(p.edu.reduce((s, e) => s + e.job, 0)) + ' 个' }));
      }
    },
    {
      id: 'geo_exp', board: 'geo', title: '各省份经验要求分布', sub: '省份 × 经验门槛',
      chart: '堆叠柱', desc: '选取招聘需求最高的省份，对比其各经验门槛的岗位构成，反映区域用工成熟度。',
      option() {
        const top = M.geo.geo_exp.map((p) => ({ p, total: p.exp.reduce((s, e) => s + e.job, 0) }))
          .sort((a, b) => b.total - a.total).slice(0, 8).map((x) => x.p);
        const levels = M.EXP_LEVELS;
        const matrix = levels.map((lv) => top.map((p) => { const e = p.exp.find((x) => x.exp === lv); return e ? e.job : 0; }));
        return stackedBarOpt(top.map((p) => p.short), levels, matrix, 3);
      },
      side: () => [m('对比省份', '8 个'), m('经验层级', M.EXP_LEVELS.length + ' 档'), m('维度', '省份 × 经验')],
      table: () => {
        const top = M.geo.geo_exp.map((p) => ({ p, total: p.exp.reduce((s, e) => s + e.job, 0) })).sort((a, b) => b.total - a.total).slice(0, 6).map((x) => x.p);
        return top.map((p) => ({ dim: p.short, val: fmt(p.exp.reduce((s, e) => s + e.job, 0)) + ' 个' }));
      }
    },

    /* ---------- 人才板块 (5) ---------- */
    {
      id: 'talent_salary', board: 'talent', title: '学历 × 经验 平均薪资', sub: '二维薪资热力矩阵',
      chart: '热力图', desc: '以学历为行、经验为列构建平均薪资热力矩阵，直观定位高价值人才象限。',
      option() {
        const rows = M.talent.talent_salary;
        const cells = [];
        rows.forEach((r, yi) => r.salaries.forEach((v, xi) => cells.push([xi, yi, v])));
        return heatOpt(M.EXP_LEVELS, M.EDU_LEVELS, cells, '元');
      },
      side: () => {
        let mx = -1, mxe = '', mxr = '';
        M.talent.talent_salary.forEach((r) => r.salaries.forEach((v, xi) => { if (v > mx) { mx = v; mxe = M.EXP_LEVELS[xi]; mxr = r.edu; } }));
        return [m('峰值薪资', yuan(mx)), m('峰值学历', mxr), m('峰值经验', mxe)];
      },
      table: () => M.talent.talent_salary.map((r) => ({ dim: r.edu, val: yuan(Math.max(...r.salaries)) + ' (峰值)' }))
    },
    {
      id: 'talent_edu', board: 'talent', title: '学历要求分布', sub: '全量岗位学历门槛',
      chart: '环形图', desc: '统计全部招聘职位对学历的要求占比，刻画就业市场的学历门槛结构。',
      option() {
        const d = M.talent.talent_edu.map((x) => ({ name: x.edu_req, value: x.job_count }));
        return pieOpt(d, '个');
      },
      side: () => {
        const tot = M.talent.talent_edu.reduce((s, x) => s + x.job_count, 0);
        const hiEdu = M.talent.talent_edu
          .filter((x) => ['本科', '硕士', '博士'].includes(x.edu_req))
          .reduce((s, x) => s + x.job_count, 0);
        const b = M.talent.talent_edu.find((x) => x.edu_req === '本科');
        return [
          m('总岗位', fmt(tot)),
          m('本科及以上占比', pct(hiEdu / tot * 100)),
          m('本科岗位', b ? fmt(b.job_count) : '—')
        ];
      },
      table: () => M.talent.talent_edu.map((x) => ({ dim: x.edu_req, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'talent_exp', board: 'talent', title: '经验要求分布', sub: '全量岗位经验门槛',
      chart: '环形图', desc: '统计全部招聘职位对工作经验的要求占比，反映市场对资历的偏好。',
      option() {
        const d = M.talent.talent_exp.map((x) => ({ name: x.exp_req, value: x.job_count }));
        return pieOpt(d, '个');
      },
      side: () => {
        const tot = M.talent.talent_exp.reduce((s, x) => s + x.job_count, 0);
        const no = M.talent.talent_exp.find((x) => x.exp_req === '不限');
        return [m('总岗位', fmt(tot)), m('无经验要求占比', pct(no ? no.job_count / tot * 100 : 0)), m('经验档位', M.talent.talent_exp.length + ' 档')];
      },
      table: () => M.talent.talent_exp.map((x) => ({ dim: x.exp_req, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'talent_scale', board: 'talent', title: '招聘规模分布', sub: '单岗招聘人数区间',
      chart: '柱状图', desc: '按单个招聘职位的计划招聘人数分桶，揭示企业以"多岗少人"还是"少岗多人"为主。',
      option(modal) {
        const d = M.talent.talent_scale;
        return barOpt(d.map((x) => x.scale_bucket), d.map((x) => x.job_count), '#34d399', '#059669', '个', 0);
      },
      side: () => {
        const d = M.talent.talent_scale;
        return [m('规模档位', d.length + ' 档'), m('主流规模', d[0].scale_bucket), m('主流岗位', fmt(d[0].job_count))];
      },
      table: () => M.talent.talent_scale.map((x) => ({ dim: x.scale_bucket + ' 人', val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'talent_salary_struct', board: 'talent', title: '薪资结构分布', sub: '月薪区间占比',
      chart: '柱状图', desc: '按月薪区间分桶统计岗位数量，呈现整体薪酬结构的分布形态。',
      option(modal) {
        const d = M.talent.talent_salary_struct;
        return barOpt(d.map((x) => x.salary_bucket), d.map((x) => x.job_count), '#f472b6', '#db2777', '个', 0);
      },
      side: () => {
        const d = M.talent.talent_salary_struct; const tot = d.reduce((s, x) => s + x.job_count, 0);
        const hi = d.filter((x) => ['12-20k', '20-30k', '30k以上'].includes(x.salary_bucket)).reduce((s, x) => s + x.job_count, 0);
        return [m('总岗位', fmt(tot)), m('中高薪(≥12k)占比', pct(hi / tot * 100)), m('薪资档位', d.length + ' 档')];
      },
      table: () => M.talent.talent_salary_struct.map((x) => ({ dim: x.salary_bucket, val: fmt(x.job_count) + ' 个' }))
    },

    /* ---------- 行业板块 (3) ---------- */
    {
      id: 'industry_struct', board: 'industry', title: '行业招聘结构', sub: '行业 × 省份岗位量',
      chart: '堆叠柱', desc: '以行业为维度、省份为堆叠，展示不同行业的地域布局差异。',
      option() {
        const d = M.industry.industry_struct;
        const provinces = d[0].cities.map((c) => c.city);
        const matrix = provinces.map((pv, i) => d.map((ind) => { const c = ind.cities.find((x) => x.city === pv); return c ? c.job_count : 0; }));
        return stackedBarOpt(d.map((x) => x.industry), provinces, matrix, 0);
      },
      side: () => [m('行业数', M.industry.industry_struct.length + ' 个'), m('对比省份', M.industry.industry_struct[0].cities.length + ' 个'), m('维度', '行业 × 省份')],
      table: () => M.industry.industry_struct.slice(0, 6).map((x) => ({ dim: x.industry, val: fmt(x.cities.reduce((s, c) => s + c.job_count, 0)) + ' 个' }))
    },
    {
      id: 'industry_edu', board: 'industry', title: '各行业学历门槛', sub: '行业 × 学历构成',
      chart: '堆叠柱', desc: '对比重点行业的学历要求构成，识别知识密集型与劳动密集型行业差异。',
      option() {
        const d = M.industry.industry_edu.slice(0, 6);
        const levels = M.EDU_LEVELS;
        const matrix = levels.map((lv) => d.map((ind) => { const e = ind.edu.find((x) => x.edu === lv); return e ? e.job_count : 0; }));
        return stackedBarOpt(d.map((x) => x.industry), levels, matrix, 0);
      },
      side: () => [m('对比行业', '6 个'), m('学历层级', M.EDU_LEVELS.length + ' 级'), m('维度', '行业 × 学历')],
      table: () => M.industry.industry_edu.slice(0, 6).map((x) => ({ dim: x.industry, val: fmt(x.edu.reduce((s, e) => s + e.job_count, 0)) + ' 个' }))
    },
    {
      id: 'industry_salary', board: 'industry', title: '各行业平均薪资', sub: '行业薪酬排名',
      chart: '柱状图', desc: '对比各行业的招聘平均月薪，定位高薪赛道。',
      option(modal) {
        const d = M.industry.industry_salary;
        return barOpt(d.map((x) => x.industry), d.map((x) => x.avg_salary), '#fbbf24', '#f59e0b', '元', 0);
      },
      side: () => [m('行业数', M.industry.industry_salary.length + ' 个'), m('最高薪行业', M.industry.industry_salary[0].industry), m('最高薪资', yuan(M.industry.industry_salary[0].avg_salary))],
      table: () => M.industry.industry_salary.map((x) => ({ dim: x.industry, val: yuan(x.avg_salary) }))
    },

    /* ---------- 时间板块 (1) ---------- */
    {
      id: 'time_trend', board: 'time', title: '行业招聘时间趋势', sub: '月度需求波动',
      chart: '折线图', desc: '按月份追踪重点行业的招聘需求变化，识别春招、秋招等季节性波动规律。',
      option(modal) {
        const d = M.time.time_trend;
        const series = d.map((ind) => ({ name: ind.industry, data: ind.series.map((s) => s.job_count) }));
        return lineOpt(M.MONTHS, series, '个');
      },
      side: () => {
        const d = M.time.time_trend; let peak = -1, pk = '';
        d.forEach((ind) => ind.series.forEach((s) => { if (s.job_count > peak) { peak = s.job_count; pk = ind.industry + ' ' + s.month; } }));
        return [m('追踪行业', d.length + ' 个'), m('时间跨度', M.MONTHS[0] + ' ~ ' + M.MONTHS[M.MONTHS.length - 1]), m('峰值', pk)];
      },
      table: () => M.time.time_trend.map((ind) => ({ dim: ind.industry, val: fmt(ind.series.reduce((s, x) => s + x.job_count, 0)) + ' 个(全年)' }))
    },

    /* ---------- 文本板块 (3) ---------- */
    {
      id: 'text_skill', board: 'text', title: '技能要求词云', sub: 'JD 高频关键词',
      chart: '词云', desc: '从职位描述中提取的高频技能关键词，字号越大代表市场需求越旺盛。',
      option() { return null; }, // 词云由 renderWordCloud 处理
      side: () => [m('关键词数', M.text.text_skill.length + ' 个'), m('Top1 技能', M.text.text_skill[0].keyword), m('Top1 权重', fmt(M.text.text_skill[0].weight))],
      table: () => M.text.text_skill.slice(0, 12).map((x) => ({ dim: x.keyword, val: fmt(x.weight) }))
    },
    {
      id: 'text_company', board: 'text', title: '热门招聘企业 TOP', sub: '企业发布量排名',
      chart: '条形图', desc: '按发布的招聘职位数排序的活跃雇主榜单，反映头部企业的用人力度。',
      option(modal) {
        const d = M.text.text_company.slice(0, modal ? 15 : 12).slice().reverse();
        return hbarOpt(d.map((x) => x.company), d.map((x) => x.job_count), '#22d3ee', '#0891b2', '个');
      },
      side: () => [m('企业数', M.text.text_company.length + ' 家'), m('榜首企业', M.text.text_company[0].company), m('榜首岗位', fmt(M.text.text_company[0].job_count))],
      table: () => M.text.text_company.slice(0, 12).map((x, i) => ({ dim: (i + 1) + '. ' + x.company, val: fmt(x.job_count) + ' 个' }))
    },
    {
      id: 'text_welfare', board: 'text', title: '福利待遇提及率', sub: 'JD 福利关键词',
      chart: '条形图', desc: '统计职位描述中各福利待遇关键词的提及率，刻画雇主的吸引力构成。',
      option(modal) {
        const d = M.text.text_welfare.slice().reverse();
        return hbarOpt(d.map((x) => x.welfare_keyword), d.map((x) => Math.round(x.mention_rate * 100)), '#a3e635', '#65a30d', '%');
      },
      side: () => [m('福利项', M.text.text_welfare.length + ' 项'), m('最高提及', M.text.text_welfare[0].welfare_keyword), m('提及率', pct(M.text.text_welfare[0].mention_rate * 100))],
      table: () => M.text.text_welfare.map((x) => ({ dim: x.welfare_keyword, val: pct(x.mention_rate * 100) }))
    }
  ];

  const byId = {};
  INDICATORS.forEach((i) => (byId[i.id] = i));

  /* ---------------------- 顶部关键指标 ---------------------- */
  function renderStats() {
    const strip = document.getElementById('statStrip');
    const cards = [
      { k: '总招聘需求', v: fmt(M.totalJobs), c: 'cyan' },
      { k: '全国加权平均薪资', v: yuan(M.weightedSalary), c: 'violet' },
      { k: '覆盖省级行政区', v: M.provinces.length, c: 'green' },
      { k: '标准指标数', v: INDICATORS.length, c: '' }
    ];
    strip.innerHTML = cards.map((c) => `<div class="stat-card"><div class="k">${c.k}</div><div class="v ${c.c}">${c.v}</div></div>`).join('');
    const ft = document.getElementById('footTime');
    if (ft) ft.textContent = M.updateTime;
  }

  /* ---------------------- 卡片网格 ---------------------- */
  function renderCards() {
    const grid = document.getElementById('cardGrid');
    grid.innerHTML = '';
    INDICATORS.forEach((ind) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.board = ind.board;
      card.dataset.id = ind.id;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', ind.title + ' 详情');
      card.innerHTML = `
        <div class="card-head">
          <span class="board-pill board-${ind.board}">${boardLabel(ind.board)}</span>
          <span class="card-title">${ind.title}<small>${ind.sub}</small></span>
          <span class="chart-type-ico">${ind.chart}</span>
        </div>
        <div class="card-canvas" id="cv-${ind.id}"></div>
        <div class="card-foot">
          <span>${ind.desc.slice(0, 22)}…</span>
          <span class="detail-link">查看详情 ›</span>
        </div>`;
      grid.appendChild(card);
    });
    // 渲染各卡片图表
    INDICATORS.forEach((ind) => {
      const el = document.getElementById('cv-' + ind.id);
      if (ind.chart === '词云') {
        renderWordCloud(el, wordCloudItems(M.text.text_skill), false);
      } else {
        const chart = echarts.init(el, null, { renderer: 'canvas' });
        chart.setOption(ind.option(false));
        cardCharts[ind.id] = chart;
      }
    });
    // 绑定卡片点击
    bindCardClicks();
  }

  function bindCardClicks() {
    const grid = document.getElementById('cardGrid');
    if (!grid) return;
    grid.querySelectorAll('.card').forEach((card) => {
      const open = () => openModal(card.dataset.id);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  function boardLabel(b) {
    return { geo: '地域', talent: '人才', industry: '行业', time: '时间', text: '文本' }[b] || b;
  }

  /* ---------------------- 筛选 ---------------------- */
  function setupFilter() {
    const bar = document.getElementById('filterBar');
    if (!bar) return;
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      bar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentBoard = btn.dataset.board;
      applyFilter();
    });
  }

  function applyFilter() {
    document.querySelectorAll('#cardGrid .card').forEach((card) => {
      const show = currentBoard === 'all' || card.dataset.board === currentBoard;
      card.style.display = show ? '' : 'none';
    });
    // 重新布局可见图表
    requestAnimationFrame(() => {
      INDICATORS.forEach((ind) => {
        if (currentBoard !== 'all' && ind.board !== currentBoard) return;
        const c = cardCharts[ind.id];
        if (c) c.resize();
      });
    });
  }

  /* ---------------------- 详情弹窗 ---------------------- */
  function openModal(id) {
    const ind = byId[id];
    if (!ind) { console.warn('openModal: unknown id', id); return; }
    modalIndicator = ind;
    const mask = document.getElementById('modalMask');
    if (!mask) return;

    try {
      document.getElementById('modalBoard').textContent = boardLabel(ind.board);
      document.getElementById('modalBoard').className = 'board-pill board-' + ind.board;
      document.getElementById('modalTitle').textContent = ind.title;
      document.getElementById('modalDesc').textContent = ind.desc;

      const chartEl = document.getElementById('modalChart');
      if (modalChart) { try { modalChart.dispose(); } catch (_) {} modalChart = null; }
      if (ind.chart === '词云') {
        renderWordCloud(chartEl, wordCloudItems(M.text.text_skill), true);
      } else if (echartsReady()) {
        modalChart = echarts.init(chartEl, null, { renderer: 'canvas' });
        modalChart.setOption(ind.option(true));
      } else {
        chartEl.innerHTML = '<p style="display:grid;place-items:center;height:100%;color:#9fb2d6;font-size:13px">图表库加载中…</p>';
      }

      const side = document.getElementById('modalSide');
      side.innerHTML = (ind.side ? ind.side() : []).map((s) => `<div class="side-metric"><div class="k">${s.k}</div><div class="v">${s.v}</div></div>`).join('');

      const tbody = document.querySelector('#modalTable tbody');
      tbody.innerHTML = (ind.table ? ind.table() : []).map((r) => `<tr><td>${r.dim}</td><td>${r.val}</td></tr>`).join('');

      mask.hidden = false;
      document.body.style.overflow = 'hidden';
    } catch (e) {
      console.error('openModal error:', e);
    }
  }

  function closeModal() {
    const mask = document.getElementById('modalMask');
    mask.hidden = true;
    document.body.style.overflow = '';
    if (modalChart) { modalChart.dispose(); modalChart = null; }
    modalIndicator = null;
  }

  function setupModal() {
    const close = document.getElementById('modalClose');
    if (close) close.addEventListener('click', closeModal);
    const mask = document.getElementById('modalMask');
    if (mask) mask.addEventListener('click', (e) => { if (e.target.id === 'modalMask') closeModal(); });
    document.addEventListener('keydown', (e) => {
      const m2 = document.getElementById('modalMask'); if (!m2) return;
      if (e.key === 'Escape' && !m2.hidden) closeModal();
    });
  }

  /* ---------------------- 中国地图 ---------------------- */
  function provinceMetric(p, metric) {
    if (metric === 'jobCount') return p.jobCount;
    if (metric === 'avgSalary') return p.avgSalary;
    if (metric === 'eduRatio') {
      const tot = p.edu.reduce((s, e) => s + e.job, 0);
      const hi = p.edu.filter((e) => ['本科', '硕士', '博士'].includes(e.edu)).reduce((s, e) => s + e.job, 0);
      return Math.round(hi / tot * 100);
    }
    if (metric === 'expRatio') {
      const tot = p.exp.reduce((s, e) => s + e.job, 0);
      const req = tot - (p.exp.find((e) => e.exp === '不限') || { job: 0 }).job;
      return Math.round(req / tot * 100);
    }
    return 0;
  }

  function mapSeriesData(metric) {
    return M.provinces.map((p) => ({ name: p.name, short: p.short, value: provinceMetric(p, metric) }));
  }

  function renderMap(metric) {
    if (!mapChart) return;
    const data = mapSeriesData(metric);
    const isPct = metric === 'eduRatio' || metric === 'expRatio';
    const unit = metric === 'jobCount' ? '个' : metric === 'avgSalary' ? '元' : '%';
    const nameToShort = {};
    M.provinces.forEach((p) => (nameToShort[p.name] = p.short));

    mapChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const v = p.value;
          return `${nameToShort[p.name] || p.name}<br/>${metricLabel(metric)}：<b>${isPct ? v + '%' : fmt(v) + ' ' + unit}</b>`;
        }
      },
      visualMap: {
        min: Math.min(...data.map((d) => d.value)),
        max: Math.max(...data.map((d) => d.value)),
        left: 18, bottom: 24, calculable: true,
        text: [metricLabel(metric), ''], textStyle: { color: '#9fb2d6' },
        inRange: { color: ['#0e2a4d', '#155e9c', '#2d8fd6', '#38bdf8', '#7dd3fc', '#f472b6'] }
      },
      series: [{
        type: 'map', map: 'china', roam: true, zoom: 1.18,
        label: { show: true, fontSize: 8, color: 'rgba(205,217,242,.55)', formatter: (p) => nameToShort[p.name] || '' },
        itemStyle: { borderColor: 'rgba(120,170,255,.35)', borderWidth: 0.6, areaColor: '#0e1c3a' },
        emphasis: {
          label: { show: true, fontSize: 12, color: '#fff', fontWeight: 'bold' },
          itemStyle: { areaColor: '#5b9dff', shadowBlur: 14, shadowColor: 'rgba(91,157,255,.7)' }
        },
        data: data
      }]
    }, true);
  }

  function metricLabel(metric) {
    return { jobCount: '招聘需求', avgSalary: '平均薪资', eduRatio: '本科及以上占比', expRatio: '要求经验占比' }[metric];
  }

  function setupMap() {
    const el = document.getElementById('chinaMap');
    if (!el) return;
    if (!echartsReady()) { el.innerHTML = '<p style="padding:24px;color:#9fb2d6">无法加载 ECharts，地图不可用。</p>'; return; }
    mapChart = echarts.init(el, null, { renderer: 'canvas' });
    mapChart.showLoading({ text: '加载地图数据…', textColor: '#9fb2d6', maskColor: 'rgba(11,20,48,.4)' });

    // 策略1：fetch DataV GeoJSON（HTTP 服务下可用）
    // 策略2：失败后用 <script> 标签加载 echarts 内置 china.js（绕过 file:// CORS 限制）
    // 策略3：全部失败则显示提示
    let resolved = false;

    function finishMap() {
      if (resolved) return;
      resolved = true;
      try { mapChart.hideLoading(); } catch (_) {}
      renderMap(mapMetric);
      mapChart.off('click');
      mapChart.on('click', (params) => {
        if (params.componentType === 'series' && params.name) {
          const p = M.provinces.find((x) => x.name === params.name);
          if (p) openProvinceModal(p);
        }
      });
    }

    // 尝试 fetch
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then((r) => { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then((geo) => {
        echarts.registerMap('china', geo);
        finishMap();
      })
      .catch(() => {
        // fetch 失败（file:// CORS 等）→ 用 <script> 加载 echarts china 地图 JS
        console.warn('Map fetch failed, trying script-tag fallback…');
        if (window.__chinaMapLoaded) {
          finishMap();
          return;
        }
        window.__chinaMapLoaded = false;
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/echarts@5/map/js/china.js';
        s.onload = () => { window.__chinaMapLoaded = true; finishMap(); };
        s.onerror = () => {
          // 最终兜底：显示提示
          try { mapChart.hideLoading(); } catch (_) {}
          el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:#9fb2d6;text-align:center;padding:20px">
              <div style="font-size:36px;opacity:.5">🗺</div>
              <div style="font-size:14px;line-height:1.7">
                中国地图需要联网加载<br/>
                <span style="font-size:12px;color:#6b7da3">
                  当前从 file:// 打开，浏览器限制了跨域请求<br/>
                  请通过 HTTP 服务器访问本页面（如 VS Code Live Server / python -m http.server）
                </span>
              </div>
            </div>`;
        };
        document.head.appendChild(s);
      });

    // 指标切换
    const switchEl = document.getElementById('mapSwitch');
    if (switchEl) switchEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.ms-btn');
      if (!btn) return;
      document.querySelectorAll('#mapSwitch .ms-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mapMetric = btn.dataset.mapmetric;
      renderMap(mapMetric);
    });
  }

  function openProvinceModal(p) {
    modalIndicator = null;
    const mask = document.getElementById('modalMask');
    if (!mask) return;
    try {
      document.getElementById('modalBoard').textContent = '地域 · 下钻';
      document.getElementById('modalBoard').className = 'board-pill board-geo';
      document.getElementById('modalTitle').textContent = p.short + ' · 招聘明细';
      document.getElementById('modalDesc').textContent = '点击地图省份下钻查看：该省招聘需求、平均薪资与城市分布。';

      const chartEl = document.getElementById('modalChart');
      if (modalChart) { try { modalChart.dispose(); } catch (_) {} modalChart = null; }
      if (echartsReady()) {
        modalChart = echarts.init(chartEl, null, { renderer: 'canvas' });
        const cities = p.cities.slice(0, 10).slice().reverse();
        modalChart.setOption(hbarOpt(cities.map((c) => c.city), cities.map((c) => c.job), '#5b9dff', '#38bdf8', '个'));
      } else {
        chartEl.innerHTML = '<p style="display:grid;place-items:center;height:100%;color:#9fb2d6;font-size:13px">图表库加载中…</p>';
      }

      const tot = p.edu.reduce((s, e) => s + e.job, 0);
      const hi = p.edu.filter((e) => ['本科', '硕士', '博士'].includes(e.edu)).reduce((s, e) => s + e.job, 0);
      const expTot = p.exp.reduce((s, e) => s + e.job, 0);
      const expReq = expTot - (p.exp.find((e) => e.exp === '不限') || { job: 0 }).job;
      document.getElementById('modalSide').innerHTML = [
        m('招聘需求', fmt(p.jobCount) + ' 个'),
        m('平均薪资', yuan(p.avgSalary)),
        m('本科及以上', pct(hi / tot * 100)),
        m('要求经验', pct(expReq / expTot * 100))
      ].map((s) => `<div class="side-metric"><div class="k">${s.k}</div><div class="v">${s.v}</div></div>`).join('');

      const tbody = document.querySelector('#modalTable tbody');
      tbody.innerHTML = p.cities.map((c) => `<tr><td>${c.city}</td><td>${fmt(c.job)} 个</td></tr>`).join('');

      mask.hidden = false;
      document.body.style.overflow = 'hidden';
    } catch (e) {
      console.error('openProvinceModal error:', e);
    }
  }

  /* ---------------------- 启动 ---------------------- */
  let cardsRendered = false;

  function renderCardsSafe() {
    if (cardsRendered) return;
    try { renderCards(); cardsRendered = true; } catch (e) { console.error('renderCards failed', e); }
  }

  function boot() {
    if (!M) { console.error('MOCK data missing'); return; }
    renderStats();
    setupFilter();
    setupModal();

    if (echartsReady()) {
      renderCardsSafe();
      setupMap();
    } else {
      // ECharts 尚未加载（CDN 延迟）：先渲染带完整交互属性的卡片骨架
      document.getElementById('cardGrid').innerHTML = INDICATORS.map((ind) => `
        <article class="card" data-board="${ind.board}" data-id="${ind.id}" tabindex="0"
          role="button" aria-label="${ind.title} 详情"><div class="card-head">
          <span class="board-pill board-${ind.board}">${boardLabel(ind.board)}</span>
          <span class="card-title">${ind.title}<small>${ind.sub}</small></span>
          <span class="chart-type-ico">${ind.chart}</span></div>
        <div class="card-canvas" id="cv-${ind.id}"></div>
        <div class="card-foot">
          <span>${ind.desc.slice(0, 28)}${ind.desc.length > 28 ? '…' : ''}</span>
          <span class="detail-link">查看详情 ›</span></div></article>`).join('');
      // 绑定点击（弹窗可用，只是图表暂缺）
      bindCardClicks();
      // 轮询等待 ECharts 加载完成，最多等 15 秒
      let waited = 0;
      const poll = setInterval(() => {
        waited += 200;
        if (echartsReady()) {
          clearInterval(poll);
          // 用完整卡片替换骨架
          const grid = document.getElementById('cardGrid');
          grid.innerHTML = '';
          renderCardsSafe();
          setupMap();
          console.log('ECharts loaded after ' + waited + 'ms — charts initialized');
        } else if (waited > 15000) {
          clearInterval(poll);
          console.warn('ECharts timeout after 15s — running without charts');
        }
      }, 200);
    }
    window.addEventListener('resize', () => {
      Object.values(cardCharts).forEach((c) => { try { c.resize(); } catch (_) {} });
      if (mapChart) try { mapChart.resize(); } catch (_) {}
      if (modalChart) try { modalChart.resize(); } catch (_) {}
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
