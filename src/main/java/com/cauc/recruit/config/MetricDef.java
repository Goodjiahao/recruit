package com.cauc.recruit.config;

import java.util.List;

/**
 * 指标定义（后端配置驱动的核心）。
 * 每个指标一行，描述其对应的 ADS 表、图表类型与字段映射，
 * 新增指标只需在此追加一条，无需新增 Controller。
 */
public record MetricDef(
        String board,          // 板块（URL 第一段）
        String metric,         // 指标（URL 第二段）
        String title,          // 中文展示标题
        String tableName,      // ADS 结果表名
        String chartType,      // barH | pie | line | heatmap | wordcloud | stackedBar
        String xField,         // 分类/维度字段（bar/pie/line/wordcloud 的 name 字段）
        String yField,         // 热力图 y 轴字段
        String valueField,     // 数值度量字段
        String seriesField,    // 堆叠柱图的系列字段
        String categoryField,  // 堆叠柱图的分组（x 轴）字段
        Integer topN,          // 堆叠柱图取前 N 个分组
        String orderBy,        // SQL ORDER BY（内部配置，非外部输入）
        Integer limit,         // SQL LIMIT（内部配置）
        List<String> xOrder,   // 分类顺序提示（用于坐标轴排序）
        List<String> yOrder,   // 热力图 y 轴顺序提示
        String unit,           // 单位（元 / 个 / %）
        String groupBy         // 分组聚合字段；非空时按此列 GROUP BY 并 SUM(valueField)
) {
}
