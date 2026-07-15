package com.cauc.recruit.controller;

import com.cauc.recruit.common.Result;
import com.cauc.recruit.config.MetricDef;
import com.cauc.recruit.config.MetricRegistry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 通用指标数据接口（配置驱动）。
 * - GET /api/metrics              : 返回全部指标元信息（前端据此渲染）
 * - GET /api/{board}/{metric}     : 返回单个指标的数据行（List<Map>）
 *
 * 说明：SQL 中的表名 / 排序 / 限制 / 分组均来自内部 MetricRegistry 配置，非外部输入，
 * 路径变量 board/metric 仅用于查表，不存在 SQL 注入面。
 */
@RestController
@RequestMapping("/api")
public class MetricController {

    private final MetricRegistry registry;
    private final JdbcTemplate jdbc;

    public MetricController(MetricRegistry registry, JdbcTemplate jdbc) {
        this.registry = registry;
        this.jdbc = jdbc;
    }

    @GetMapping("/metrics")
    public Result metrics() {
        return Result.ok(registry.getAllMeta());
    }

    @GetMapping("/{board}/{metric}")
    public Result data(@PathVariable String board, @PathVariable String metric) {
        MetricDef def = registry.find(board, metric).orElse(null);
        if (def == null) {
            return Result.fail("指标不存在: " + board + "/" + metric);
        }
        try {
            StringBuilder sql = new StringBuilder();
            // 若配置了 groupBy，则按该列分组并对 valueField 求和，避免明细行重复
            if (def.groupBy() != null && !def.groupBy().isBlank()) {
                sql.append("SELECT `").append(def.groupBy())
                   .append("`, SUM(`").append(def.valueField())
                   .append("`) AS `").append(def.valueField())
                   .append("` FROM `").append(def.tableName())
                   .append("` GROUP BY `").append(def.groupBy()).append("`");
            } else {
                sql.append("SELECT * FROM `").append(def.tableName()).append("`");
            }
            if (def.orderBy() != null && !def.orderBy().isBlank()) {
                sql.append(" ORDER BY ").append(def.orderBy());
            }
            // limit<=0 表示"无限制"（返回全量），用于 geo/demand 这类需全量供给 KPI 的指标
            if (def.limit() != null && def.limit() > 0) {
                sql.append(" LIMIT ").append(def.limit());
            }
            List<Map<String, Object>> rows = jdbc.queryForList(sql.toString());
            return Result.ok(rows);
        } catch (Exception e) {
            return Result.fail("查询失败: " + e.getMessage());
        }
    }
}
