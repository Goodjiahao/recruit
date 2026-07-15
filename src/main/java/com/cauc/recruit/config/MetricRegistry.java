package com.cauc.recruit.config;

import com.cauc.recruit.dto.MetricMeta;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 指标注册表（配置驱动的数据源）。
 * 集中维护 18 个指标 → ADS 表的映射，作为通用接口的"驱动源"。
 * 新增指标只需在下方 List.of(...) 中追加一条 MetricDef。
 */
@Component
public class MetricRegistry {

    private final List<MetricDef> defs;

    public MetricRegistry() {
        this.defs = List.of(
                // ===================== 人才板块 (talent) =====================
                new MetricDef("talent", "salary", "学历 × 经验 → 平均薪资",
                        "ads_talent_salary", "heatmap",
                        "exp_level", "edu_level", "avg_salary", null, null, null,
                        null, null,
                        List.of("经验不限", "无经验", "1年以下", "1-3年", "3-5年", "5-10年", "10年以上"),
                        List.of("MBA/EMBA", "EMBA", "博士", "硕士", "本科", "大专", "中专/中技", "高中", "初中及以下", "学历不限"), "元", null),

                new MetricDef("talent", "exp", "经验要求分布",
                        "ads_talent_exp", "pie",
                        "exp_req", null, "job_count", null, null, null,
                        null, null, null, null, "个", null),

                new MetricDef("talent", "salary_struct", "薪资区间结构分布",
                        "ads_talent_salary_struct", "barH",
                        "salary_bucket", null, "job_count", null, null, null,
                        "sort_order", null, null, null, "个", null),

                new MetricDef("talent", "edu", "学历分布",
                        "ads_edu_dist", "pie",
                        "education", null, "job_count", null, null, null,
                        null, null, null, null, "个", null),

                new MetricDef("talent", "scale", "招聘规模分布",
                        "ads_talent_scale", "barH",
                        "scale_bucket", null, "job_count", null, null, null,
                        "sort_order", null, null, null, "个", null),

                new MetricDef("talent", "hot", "热门招聘岗位 TOP15",
                        "ads_hot_jobs", "barH",
                        "job_title", null, "job_count", null, null, null,
                        "job_count DESC", 15, null, null, "个", null),

                // ===================== 地域板块 (geo) =====================
                new MetricDef("geo", "demand", "城市需求排名 TOP",
                        "ads_city_demand", "barH",
                        "city", null, "job_count", null, null, null,
                        "job_count DESC", 0, null, null, "个", null),

                new MetricDef("geo", "city_salary", "各城市平均薪资 TOP15",
                        "ads_city_salary", "barH",
                        "city", null, "avg_salary", null, null, null,
                        "avg_salary DESC", 15, null, null, "元", null),

                // 专供中间地图：返回全量 321 城（limit=0），侧边 TOP15 柱状图仍用上面的指标
                new MetricDef("geo", "city_salary_full", "各城市平均薪资（全量）",
                        "ads_city_salary", "barH",
                        "city", null, "avg_salary", null, null, null,
                        "avg_salary DESC", 0, null, null, "元", null),

                new MetricDef("geo", "area", "区域(区县)岗位分布 TOP15",
                        "ads_geo_area", "barH",
                        "area", null, "job_count", null, null, null,
                        "job_count DESC", 15, null, null, "个", "area"),

                new MetricDef("geo", "edu", "城市学历结构（TOP8 城市）",
                        "ads_city_education", "stackedBar",
                        null, null, "job_count", "education", "city", 8,
                        null, null, null, null, "个", null),

                new MetricDef("geo", "exp", "城市经验结构（TOP8 城市）",
                        "ads_city_experience", "stackedBar",
                        null, null, "job_count", "experience", "city", 8,
                        null, null, null, null, "个", null),

                // ===================== 行业板块 (industry) =====================
                new MetricDef("industry", "salary", "各行业平均薪资 TOP15",
                        "industry_salary_stat", "barH",
                        "industry", null, "avg_salary", null, null, null,
                        "avg_salary DESC", 15, null, null, "元", null),

                new MetricDef("industry", "job", "各行业岗位数量 TOP15",
                        "industry_job_stat", "barH",
                        "industry", null, "job_count", null, null, null,
                        "job_count DESC", 15, null, null, "个", "industry"),

                new MetricDef("industry", "edu", "各行业学历分布（TOP8 行业）",
                        "industry_edu_stat", "stackedBar",
                        null, null, "job_count", "education", "industry", 8,
                        null, null, null, null, "个", null),

                // ===================== 时间板块 (time) =====================
                new MetricDef("time", "trend", "月度招聘需求趋势",
                        "ads_time_trend", "line",
                        "mon", null, "job_count", null, null, null,
                        "mon ASC", null, null, null, "个", "mon"),

                // ===================== 文本板块 (text) =====================
                new MetricDef("text", "skill", "技能要求词云",
                        "skill_word_cloud", "wordcloud",
                        "word", null, "count", null, null, null,
                        "count DESC", null, null, null, "次", null),

                new MetricDef("text", "company", "头部招聘企业 TOP15",
                        "top_company", "barH",
                        "company_name", null, "job_count", null, null, null,
                        "job_count DESC", 15, null, null, "个", null),

                new MetricDef("text", "welfare", "福利提及率 TOP15",
                        "welfare_mention_rate", "barH",
                        "welfare_name", null, "mention_rate", null, null, null,
                        "mention_rate DESC", 15, null, null, "%", null)
        );
    }

    /** 返回给前端的元信息列表 */
    public List<MetricMeta> getAllMeta() {
        return defs.stream().map(d -> new MetricMeta(
                d.board(), d.metric(), d.title(), d.chartType(),
                d.xField(), d.yField(), d.valueField(),
                d.seriesField(), d.categoryField(), d.topN(),
                d.xOrder(), d.yOrder(), d.unit()
        )).toList();
    }

    /** 按板块+指标查找定义 */
    public Optional<MetricDef> find(String board, String metric) {
        return defs.stream()
                .filter(d -> d.board().equals(board) && d.metric().equals(metric))
                .findFirst();
    }
}
