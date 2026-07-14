/* =========================================================================
 * mock-data.js  —  18 项标准指标模拟数据（占位）
 * 说明：真实数据由各组员 Spark→MySQL(ADS) 产出，尚未就绪；
 *      本文件生成确定性的模拟数据，用于演示页面效果。
 * 所有随机数均使用固定种子，保证多次打开结果一致。
 * ========================================================================= */
(function () {
  'use strict';

  // ---- 确定性伪随机 (mulberry32) ----
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20250714);
  const ri = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  // ---- 34 个省级行政区（与 DataV GeoJSON 的 properties.name 对齐）----
  // tier: 1=一线核心, 2=新一线/强省, 3=普通省份（用于让数值更真实）
  const PROVINCES = [
    { name: '北京市', short: '北京', tier: 1 },
    { name: '上海市', short: '上海', tier: 1 },
    { name: '广东省', short: '广东', tier: 1 },
    { name: '江苏省', short: '江苏', tier: 2 },
    { name: '浙江省', short: '浙江', tier: 2 },
    { name: '山东省', short: '山东', tier: 2 },
    { name: '四川省', short: '四川', tier: 2 },
    { name: '湖北省', short: '湖北', tier: 2 },
    { name: '福建省', short: '福建', tier: 2 },
    { name: '湖南省', short: '湖南', tier: 2 },
    { name: '河南省', short: '河南', tier: 2 },
    { name: '河北省', short: '河北', tier: 2 },
    { name: '安徽省', short: '安徽', tier: 2 },
    { name: '陕西省', short: '陕西', tier: 2 },
    { name: '辽宁省', short: '辽宁', tier: 2 },
    { name: '重庆市', short: '重庆', tier: 2 },
    { name: '天津市', short: '天津', tier: 2 },
    { name: '江西省', short: '江西', tier: 3 },
    { name: '云南省', short: '云南', tier: 3 },
    { name: '广西壮族自治区', short: '广西', tier: 3 },
    { name: '山西省', short: '山西', tier: 3 },
    { name: '黑龙江省', short: '黑龙江', tier: 3 },
    { name: '吉林省', short: '吉林', tier: 3 },
    { name: '贵州省', short: '贵州', tier: 3 },
    { name: '内蒙古自治区', short: '内蒙古', tier: 3 },
    { name: '新疆维吾尔自治区', short: '新疆', tier: 3 },
    { name: '甘肃省', short: '甘肃', tier: 3 },
    { name: '海南省', short: '海南', tier: 3 },
    { name: '宁夏回族自治区', short: '宁夏', tier: 3 },
    { name: '青海省', short: '青海', tier: 3 },
    { name: '西藏自治区', short: '西藏', tier: 3 },
    { name: '台湾省', short: '台湾', tier: 3 },
    { name: '香港特别行政区', short: '香港', tier: 3 },
    { name: '澳门特别行政区', short: '澳门', tier: 3 }
  ];

  // 各省代表城市（用于地图下钻明细）
  const CITY_OF = {
    北京: ['北京'], 上海: ['上海'], 广东: ['广州', '深圳', '东莞', '佛山', '珠海'],
    江苏: ['南京', '苏州', '无锡', '常州'], 浙江: ['杭州', '宁波', '温州', '金华'],
    山东: ['济南', '青岛', '烟台', '潍坊'], 四川: ['成都', '绵阳', '宜宾'],
    湖北: ['武汉', '宜昌', '襄阳'], 福建: ['福州', '厦门', '泉州'],
    湖南: ['长沙', '株洲', '岳阳'], 河南: ['郑州', '洛阳', '南阳'],
    河北: ['石家庄', '保定', '唐山'], 安徽: ['合肥', '芜湖', '蚌埠'],
    陕西: ['西安', '咸阳', '宝鸡'], 辽宁: ['大连', '沈阳', '鞍山'],
    重庆: ['重庆'], 天津: ['天津'], 江西: ['南昌', '赣州'],
    云南: ['昆明', '大理'], 广西: ['南宁', '柳州', '桂林'],
    山西: ['太原', '大同'], 黑龙江: ['哈尔滨', '大庆'],
    吉林: ['长春', '吉林'], 贵州: ['贵阳', '遵义'],
    内蒙古: ['呼和浩特', '包头'], 新疆: ['乌鲁木齐', '克拉玛依'],
    甘肃: ['兰州', '天水'], 海南: ['海口', '三亚'],
    宁夏: ['银川'], 青海: ['西宁'], 西藏: ['拉萨'],
    台湾: ['台北'], 香港: ['香港'], 澳门: ['澳门']
  };

  const EDU_LEVELS = ['不限', '初中及以下', '高中', '大专', '本科', '硕士', '博士'];
  const EXP_LEVELS = ['不限', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'];
  const SALARY_BUCKETS = ['3k以下', '3-5k', '5-8k', '8-12k', '12-20k', '20-30k', '30k以上'];
  const SCALE_BUCKETS = ['1-5人', '6-10人', '11-20人', '21-50人', '51-100人', '100人以上'];
  const INDUSTRIES = ['互联网/IT', '人事/行政', '财务/法务', '医疗/医美', '房地产/建筑',
    '物流/供应链', '教育培训', '金融', '制造业', '传媒/广告'];
  const JOB_TITLES = ['销售代表', '软件工程师', '人事专员', '会计', '产品经理',
    '运营专员', '客服', '前端开发', '市场专员', '护士', '新媒体运营', '仓库管理员',
    '机械工程师', '教师', '财务助理', 'Java开发', '行政前台', '店长', '数据分析师', '司机'];
  const SKILLS = ['Java', 'Python', 'SQL', 'Excel', '沟通力', '团队协作', '项目管理',
    '数据分析', '英语', '责任心', '学习能力', 'PPT', '市场营销', 'CAD', '护理',
    '文案写作', '客户维护', '抗压能力', '领导力', 'Photoshop'];
  const WELFARE = ['五险一金', '带薪年假', '绩效奖金', '节日福利', '餐饮补贴',
    '弹性工作', '定期体检', '员工旅游', '股票期权', '免费班车', '住房补贴', '晋升空间'];

  // tier 权重 → 决定省份岗位基数
  const TIER_W = { 1: 1.0, 2: 0.62, 3: 0.28 };

  // ---- 生成各省聚合数据 ----
  const provinces = PROVINCES.map((p) => {
    const base = Math.round(ri(1800, 4200) * TIER_W[p.tier]);
    // 学历分布（本科+硕士+博士占比随 tier 升高）
    const hiEduBias = p.tier === 1 ? 0.62 : p.tier === 2 ? 0.46 : 0.33;
    const edu = EDU_LEVELS.map((e, i) => {
      let w;
      if (e === '不限') w = 0.18;
      else if (e === '大专') w = 0.30 - hiEduBias * 0.12;
      else if (e === '本科') w = hiEduBias * 0.7;
      else if (e === '硕士') w = hiEduBias * 0.22;
      else if (e === '博士') w = hiEduBias * 0.06;
      else if (e === '高中') w = 0.12;
      else w = 0.06; // 初中及以下
      return { edu: e, job: Math.max(1, Math.round(base * w)) };
    });
    // 经验分布
    const exp = EXP_LEVELS.map((e) => {
      let w = { '不限': 0.22, '1年以下': 0.14, '1-3年': 0.30, '3-5年': 0.20, '5-10年': 0.10, '10年以上': 0.04 }[e];
      return { exp: e, job: Math.max(1, Math.round(base * w)) };
    });
    const jobCount = edu.reduce((s, x) => s + x.job, 0);
    const avgSalary = Math.round((p.tier === 1 ? 13500 : p.tier === 2 ? 10200 : 8200) + ri(-900, 1100));
    // 城市下钻
    const cities = (CITY_OF[p.short] || [p.short]).map((c) => ({
      city: c,
      job: Math.max(1, Math.round(jobCount * (0.3 + rnd() * 0.6))),
      avgSalary: avgSalary + ri(-800, 800)
    })).sort((a, b) => b.job - a.job);
    return {
      name: p.name, short: p.short, tier: p.tier,
      jobCount, avgSalary, edu, exp, cities
    };
  });

  const totalJobs = provinces.reduce((s, p) => s + p.jobCount, 0);
  const weightedSalary = Math.round(
    provinces.reduce((s, p) => s + p.avgSalary * p.jobCount, 0) / totalJobs
  );

  // 将模拟总量缩放至项目真实规模 (95,484)，保持内部一致性与项目口径对齐
  const TARGET_TOTAL = 95484;
  const SCALE = TARGET_TOTAL / totalJobs;
  provinces.forEach((p) => {
    p.jobCount = Math.max(1, Math.round(p.jobCount * SCALE));
    p.edu.forEach((e) => (e.job = Math.max(1, Math.round(e.job * SCALE))));
    p.exp.forEach((e) => (e.job = Math.max(1, Math.round(e.job * SCALE))));
    p.cities.forEach((c) => (c.job = Math.max(1, Math.round(c.job * SCALE))));
  });
  const totalJobsScaled = provinces.reduce((s, p) => s + p.jobCount, 0);

  // 由 provinces 派生各 geo 指标的"省份级"数据集（地图用）
  function topCitiesGlobal(n) {
    return provinces.flatMap(p => p.cities)
      .sort((a, b) => b.job - a.job).slice(0, n);
  }

  // ---- geo 板块 6 项 ----
  const geo = {
    geo_demand: provinces.map(p => ({ name: p.name, short: p.short, job_count: p.jobCount }))
      .sort((a, b) => b.job_count - a.job_count),
    geo_salary: provinces.map(p => ({ name: p.name, short: p.short, avg_salary: p.avgSalary }))
      .sort((a, b) => b.avg_salary - a.avg_salary),
    geo_job: topCitiesGlobal(15).map((c, i) => ({ job_title: c.city + '相关岗', job_count: c.job }))
      .sort((a, b) => b.job_count - a.job_count)
      .map((d, i) => ({ rank: i + 1, job_title: JOB_TITLES[i % JOB_TITLES.length], job_count: d.job_count })),
    geo_area: (() => {
      const bj = provinces.find(p => p.short === '北京');
      const areas = ['朝阳区', '海淀区', '丰台区', '通州区', '昌平区', '顺义区', '西城区', '东城区', '大兴区', '石景山'];
      const tot = bj ? bj.jobCount : 3000;
      return areas.map((a, i) => ({ area: a, job_count: Math.max(20, Math.round(tot * (0.22 - i * 0.018))) }));
    })(),
    geo_edu: provinces.map(p => ({ name: p.name, short: p.short, edu: p.edu })),
    geo_exp: provinces.map(p => ({ name: p.name, short: p.short, exp: p.exp }))
  };

  // ---- talent 板块 5 项 ----
  function matrixEduExp() {
    // 学历(行) × 经验(列) → 平均薪资
    return EDU_LEVELS.map(e => ({
      edu: e,
      salaries: EXP_LEVELS.map(x => {
        const base = { '不限': 7000, '初中及以下': 6000, '高中': 7200, '大专': 9000, '本科': 11500, '硕士': 15000, '博士': 20000 }[e];
        const expMul = { '不限': 1, '1年以下': 0.95, '1-3年': 1.1, '3-5年': 1.35, '5-10年': 1.7, '10年以上': 2.1 }[x];
        return Math.round(base * expMul + ri(-400, 400));
      })
    }));
  }
  const talent = {
    talent_salary: matrixEduExp(),
    talent_edu: EDU_LEVELS.map((e, i) => ({ edu_req: e, job_count: Math.max(50, ri(300, 3200) - i * 120) }))
      .sort((a, b) => b.job_count - a.job_count),
    talent_exp: EXP_LEVELS.map((e) => ({ exp_req: e, job_count: Math.max(40, ri(400, 4200)) }))
      .sort((a, b) => b.job_count - a.job_count),
    talent_scale: SCALE_BUCKETS.map((s, i) => ({ scale_bucket: s, sort_order: i + 1, job_count: i === 0 ? ri(8000, 12000) : Math.max(30, Math.round(9000 / (i * 2.4))) }))
      .sort((a, b) => a.sort_order - b.sort_order),
    talent_salary_struct: SALARY_BUCKETS.map((s, i) => ({ salary_bucket: s, sort_order: i + 1, job_count: Math.max(30, ri(200, 2600) - i * 80) }))
      .sort((a, b) => a.sort_order - b.sort_order)
  };

  // ---- industry 板块 3 项 ----
  const industry = {
    industry_struct: INDUSTRIES.map(ind => ({
      industry: ind,
      cities: provinces.slice(0, 6).map(p => ({ city: p.short, job_count: Math.max(20, ri(80, 1600)) }))
    })),
    industry_edu: INDUSTRIES.map(ind => ({
      industry: ind,
      edu: EDU_LEVELS.map(e => ({ edu: e, job_count: Math.max(10, ri(50, 900)) }))
    })),
    industry_salary: INDUSTRIES.map(ind => ({
      industry: ind,
      avg_salary: Math.round(ri(7000, 18000)),
      job_count: ri(300, 9000)
    })).sort((a, b) => b.avg_salary - a.avg_salary)
  };

  // ---- time 板块 1 项 ----
  const MONTHS = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
  const time = {
    time_trend: (() => {
      const topInd = INDUSTRIES.slice(0, 5);
      // 行业有季节波动（春招/秋招高峰）
      const season = [0.78, 0.92, 1.0, 0.95, 0.9, 0.86, 0.88, 0.95, 1.05, 1.12, 1.0, 0.85];
      return topInd.map((ind, idx) => ({
        industry: ind,
        series: MONTHS.map((m, mi) => ({
          month: m,
          job_count: Math.max(120, Math.round((600 + idx * 90) * season[mi] * (0.9 + rnd() * 0.2)))
        }))
      }));
    })()
  };

  // ---- text 板块 3 项 ----
  const text = {
    text_skill: SKILLS.map((k) => ({ keyword: k, weight: ri(120, 1600) }))
      .sort((a, b) => b.weight - a.weight),
    text_company: (() => {
      const names = ['腾讯', '字节跳动', '阿里巴巴', '美团', '比亚迪', '华为', '京东',
        '小米', '拼多多', '网易', '携程', '顺丰', '格力', '伊利', '招商银行'];
      return names.map((c, i) => ({ company: c, job_count: ri(200, 3500) - i * 60 }))
        .sort((a, b) => b.job_count - a.job_count);
    })(),
    text_welfare: WELFARE.map((w) => ({ welfare_keyword: w, mention_rate: +(ri(28, 96) / 100).toFixed(2) }))
      .sort((a, b) => b.mention_rate - a.mention_rate)
  };

  window.MOCK = {
    provinces, totalJobs: totalJobsScaled, weightedSalary,
    updateTime: '2026-07-14 09:30:00',
    EDU_LEVELS, EXP_LEVELS, SALARY_BUCKETS, SCALE_BUCKETS, INDUSTRIES, MONTHS,
    geo, talent, industry, time, text
  };
})();
