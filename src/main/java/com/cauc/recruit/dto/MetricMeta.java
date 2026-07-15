package com.cauc.recruit.dto;

import java.util.List;

/**
 * 返回给前端的指标元信息（不含表名等内部细节）。
 * 前端据此渲染图表，是前后端之间关于"如何展示"的唯一契约。
 */
public record MetricMeta(
        String board,
        String metric,
        String title,
        String chartType,
        String xField,
        String yField,
        String valueField,
        String seriesField,
        String categoryField,
        Integer topN,
        List<String> xOrder,
        List<String> yOrder,
        String unit
) {
}
