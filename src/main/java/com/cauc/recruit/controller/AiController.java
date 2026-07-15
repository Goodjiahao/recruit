package com.cauc.recruit.controller;

import com.cauc.recruit.common.Result;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * AI 智能问答模块。
 * 调用 DeepSeek 大模型（deepseek-V4-pro）对"平台已核验的真实招聘数据"进行问答。
 * 系统提示词内已写死平台核心统计，确保回答基于真实数据、不编造。
 *
 * 纯 JDK 实现，无外部 JSON 库依赖（手动拼 JSON 字符串 + 手动提取响应）。
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final String MIMO_URL = "https://api.deepseek.com/v1/chat/completions";
    private static final String MIMO_API_KEY = "sk-2fae95422b7040b09c1141a29488ec86";
    private static final String MIMO_MODEL = "deepseek-v4-pro";

    private static final String SYSTEM_PROMPT = """
            你是由「2025 招聘就业大数据分析平台」团队开发的智能分析助手，专门基于平台已核验的真实招聘数据，回答用户关于招聘、就业、薪资、行业、地域、人才结构等方面的问题。

            # 平台真实数据（来源：智联招聘 2025 年招聘数据，共 95484 条岗位记录，覆盖 321 个城市；以下数字均来自本平台数仓分析结果）

            ## 学历分布（按岗位数）
            - 本科：59193 个岗位
            - 大专及以下：26834 个岗位
            - 研究生及以上：4461 个岗位
            - 高中及以下：439 个岗位

            ## 经验要求分布
            - 1-3年：32748 个岗位
            - 3-5年：23049 个岗位
            - 经验不限：22673 个岗位
            - 5-10年：9095 个岗位
            - 无经验：4045 个岗位
            - 1年以下：1420 个岗位
            - 10年以上：1125 个岗位

            ## 平均薪资水平（元/月，按学历）
            - 博士：约 30000 元
            - 硕士：约 17616 元
            - 高中：约 13958 元
            - 本科：约 11538 元
            - 学历不限：约 10841 元
            - 初中及以下：约 8783 元
            - EMBA：约 8000 元
            - 大专：约 7764 元
            - 中专/中技：约 6886 元
            - MBA/EMBA：约 4000 元
            - 全平台平均：约 12194 元

            ## 薪资区间结构分布
            - 5k-8k：32660 个岗位
            - 8k-12k：23224 个岗位
            - 12k-20k：16302 个岗位
            - 3k-5k：11488 个岗位
            - 20k-30k：4471 个岗位
            - 3k以下：3582 个岗位
            - 30k以上：2428 个岗位

            ## 企业招聘规模分布
            - 1-5人：89617 个岗位
            - 6-10人：4491 个岗位
            - 11-20人：781 个岗位
            - 21-50人：347 个岗位
            - 51-100人：179 个岗位
            - 100人以上：69 个岗位

            ## 招聘需求 TOP10 城市
            1. 北京：16650 个岗位
            2. 成都：5701 个岗位
            3. 郑州：4760 个岗位
            4. 上海：3934 个岗位
            5. 深圳：3731 个岗位
            6. 广州：3250 个岗位
            7. 西安：2956 个岗位
            8. 天津：2695 个岗位
            9. 济南：2301 个岗位
            10. 南京：2120 个岗位

            ## 招聘需求 TOP10 省份
            1. 北京：16675 个岗位
            2. 广东：10174 个岗位
            3. 河南：7081 个岗位
            4. 山东：6875 个岗位
            5. 江苏：6784 个岗位
            6. 四川：6704 个岗位
            7. 上海：3941 个岗位
            8. 河北：3934 个岗位
            9. 陕西：3254 个岗位
            10. 浙江：3167 个岗位

            ## 行业招聘需求 TOP（按行业）
            - 人事/行政/财务/法务：61726 个岗位
            - 物流/采购/供应链：19318 个岗位
            - 房地产/工程/建筑：10256 个岗位
            - 医疗/医美/医务：982 个岗位

            ## 行业平均薪资 TOP（元/月）
            - 人事/行政/财务/法务：约 11226 元
            - 医疗/医美/医务：约 8277 元
            - 房地产/工程/建筑：约 7601 元
            - 物流/采购/供应链：约 6795 元

            ## 月度招聘趋势（按发布月份，单位：岗位数）
            - 2月：2201
            - 3月：3839
            - 4月：12406
            - 5月：37803
            - 6月：39235

            ## 热门技能关键词 TOP15
            1. 招投标（17501）
            2. 法律咨询（10154）
            3. 审计（2790）
            4. 风控（2727）
            5. 合同审核（1927）
            6. 项目管理（1779）
            7. Excel（1169）
            8. Word（1099）
            9. 社保（1075）
            10. PPT（806）
            11. CAD（563）
            12. 税务（467）
            13. 劳动仲裁（340）
            14. 成本核算（199）
            15. 公积金（135）

            ## 福利待遇提及率 TOP10
            - 双休：5.82%
            - 五险一金：4.06%
            - 节日福利：2.77%
            - 绩效奖金：2.05%
            - 带薪年假：1.91%
            - 餐补：1.32%
            - 定期体检：0.77%
            - 年终奖：0.6%
            - 下午茶：0.43%
            - 弹性工作：0.39%

            ## 热门招聘企业 TOP10
            1. 北京市盈科律师事务所：745 个岗位
            2. 广东云云律师事务所：702 个岗位
            3. 北京三快在线科技有限公司：666 个岗位
            4. 尔华法律咨询广东有限公司：586 个岗位
            5. 北京海润天睿律师事务所：439 个岗位
            6. 华彬快速消费品投资管理有限公司：403 个岗位
            7. 河南良承律师事务所：290 个岗位
            8. 河南国银律师事务所：246 个岗位
            9. 中国信息通信研究院：229 个岗位
            10. 北京冠领律师事务所：224 个岗位

            ## 热门职位 TOP10
            1. 法务专员：4658 个岗位
            2. 招投标专员：3465 个岗位
            3. 实习律师：2563 个岗位
            4. 投标专员：2480 个岗位
            5. 授薪律师：2254 个岗位
            6. 律师助理：2166 个岗位
            7. 法务经理：1592 个岗位
            8. 执业律师：1341 个岗位
            9. 标书专员：1278 个岗位
            10. 专职律师：1258 个岗位

            # 回答规则
            1. 只能依据上述"平台真实数据"进行综合作答，严禁编造数字或夸大，在回答末尾说明参考了那个维度的数据；若被问到数据中不存在的细分维度，如实说明"当前数据未覆盖该维度"。
            2. 使用简体中文，语气专业、友好、简洁；涉及排名或对比时给出具体数字。
            3. 金额单位统一写为"元/月"。
            4. 用户询问数据口径或来源时，说明：数据来自智联招聘 2025 年公开招聘数据集，经本平台清洗、聚合、分析后得出。
            5. 不讨论与招聘就业无关的政治、敏感话题；遇到此类问题，礼貌说明无法回答并引导回招聘就业话题。
            6. 直接输出文本，不使用markdown格式输出
            """;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    /**
     * 将字符串转义为安全的 JSON 字符串值（处理引号、换行、反斜杠等）。
     */
    private static String jsonEscape(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length() + 32);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"':  sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    /**
     * 从模型返回的 JSON 中提取 choices[0].message.content 的值。
     * 用简单的字符串定位，避免引入 Jackson 依赖。
     */
    private static String extractContent(String jsonBody) {
        // 定位 "choices":[...]
        int choicesStart = jsonBody.indexOf("\"choices\"");
        if (choicesStart < 0) return null;
        int arrayStart = jsonBody.indexOf('[', choicesStart);
        if (arrayStart < 0) return null;

        // 找第一个 { （choices[0] 对象开始）
        int objStart = jsonBody.indexOf('{', arrayStart + 1);
        if (objStart < 0) return null;

        // 在这个对象内找 "message":{ ... "content":"..."
        // 先找到 "message"
        int msgPos = jsonBody.indexOf("\"message\"", objStart);
        if (msgPos < 0) return null;

        // 从 message 后面找到 { （message 对象开始）
        int msgObjStart = jsonBody.indexOf('{', msgPos + 7);
        if (msgObjStart < 0) return null;

        // 找 "content":
        int contentKey = jsonBody.indexOf("\"content\"", msgObjStart);
        if (contentKey < 0) return null;

        // 找冒号后面的引号
        int colon = jsonBody.indexOf(':', contentKey + 8);
        if (colon < 0) return null;

        int quoteStart = jsonBody.indexOf('"', colon + 1);
        if (quoteStart < 0) return null;

        // 提取到下一个未转义的 "
        StringBuilder result = new StringBuilder();
        int i = quoteStart + 1;
        while (i < jsonBody.length()) {
            char c = jsonBody.charAt(i);
            if (c == '\\' && i + 1 < jsonBody.length()) {
                char next = jsonBody.charAt(i + 1);
                switch (next) {
                    case '"':  result.append('"');  i += 2; continue;
                    case '\\': result.append('\\'); i += 2; continue;
                    case 'n':  result.append('\n'); i += 2; continue;
                    case 'r':  result.append('\r'); i += 2; continue;
                    case 't':  result.append('\t'); i += 2; continue;
                    default:   result.append(c);   i++;   continue;
                }
            } else if (c == '"') {
                // 结束引号
                break;
            } else {
                result.append(c);
                i++;
            }
        }
        return result.toString();
    }

    @PostMapping("/chat")
    public Result chat(@RequestBody Map<String, Object> body) {
        String message = body.get("message") == null ? null : String.valueOf(body.get("message"));
        if (message == null || message.isBlank()) {
            return Result.fail("消息不能为空");
        }
        try {
            // ---- 构建 messages 数组的 JSON 字符串 ----
            StringBuilder messagesJson = new StringBuilder();

            // system 消息
            messagesJson.append("{\"role\":\"system\",\"content\":").append('"')
                       .append(jsonEscape(SYSTEM_PROMPT)).append("\"}");

            // history
            Object historyRaw = body.get("history");
            if (historyRaw instanceof List) {
                for (Object o : (List<?>) historyRaw) {
                    if (o instanceof Map) {
                        Map<?, ?> m = (Map<?, ?>) o;
                        String role = String.valueOf(m.get("role"));
                        String content = String.valueOf(m.get("content"));
                        if (!content.isEmpty() && ("user".equals(role) || "assistant".equals(role))) {
                            messagesJson.append(",{\"role\":\"").append(jsonEscape(role))
                                       .append("\",\"content\":\"").append(jsonEscape(content)).append("\"}");
                        }
                    }
                }
            }

            // 当前用户消息
            messagesJson.append(",{\"role\":\"user\",\"content\":\"").append(jsonEscape(message)).append("\"}");

            // ---- 组装完整请求体 ----
            String payload = "{\"model\":\"" + MIMO_MODEL + "\","
                    + "\"messages\":[" + messagesJson + "],"
                    + "\"temperature\":0.3,"
                    + "\"max_tokens\":1500,"
                    + "\"stream\":false}";

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(MIMO_URL))
                    .timeout(Duration.ofSeconds(90))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + MIMO_API_KEY)
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                return Result.fail("模型服务返回错误（HTTP " + resp.statusCode() + "）");
            }

            String reply = extractContent(resp.body());
            if (reply == null || reply.isEmpty()) {
                return Result.fail("模型返回格式异常");
            }
            return Result.ok(Map.of("reply", reply));

        } catch (Exception e) {
            return Result.fail("调用模型失败：" + e.getMessage());
        }
    }

    @GetMapping("/status")
    public Result status() {
        return Result.ok(Map.of("enabled", true, "model", MIMO_MODEL));
    }
}
