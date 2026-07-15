# 2025 招聘就业大数据分析平台（recruit）

> 本仓库是「2025 招聘就业大数据分析平台」的**全栈交付工程**：
> 包含大数据链路的末端数据服务层（Spring Boot）、Vue3 + ECharts 可视化大屏，以及基于大模型的 AI 问答模块。
> 数据底座为智联招聘 2025 年公开招聘数据集（**95,484 条岗位、321 个城市**）。

---

## 一、项目简介

| 维度 | 说明 |
|---|---|
| **数据规模** | 智联招聘 2025 年数据，95,484 条岗位、覆盖 321 个城市；19 个原始字段清洗为 16 个分析字段。 |
| **计算链路** | `HDFS CSV → Hive DWD 清洗 → Spark 聚合分析 → MySQL ADS 结果表`（上游大数据平台，已独立于本工程）。 |
| **本工程职责** | ① 读取 MySQL `bigdata` 库中各成员的 ADS 结果表，通过 RESTful 接口为前端提供标准化数据；② Vue3 + ECharts 大屏可视化；③ AI 自然语言问答（DeepSeek）。 |
| **集成契约** | 以 MySQL ADS 结果表（`ads_<板块>_<指标>`）作为「分析层 ↔ 展示层」唯一对接口，靠表名前缀天然隔离各成员成果。 |
| **配置驱动** | 18 个指标共用一套通用接口，由代码内 `MetricRegistry` 注册表驱动；新增指标零新增业务代码，只需在注册表追加一条。 |

**一句话定位**：上游大数据平台算出结果落库，本工程是这条链路的**末端数据服务 + 前端展示 + AI 交互层**。

---

## 二、技术栈

| 层 | 技术 | 版本 / 说明 |
|---|---|---|
| 后端框架 | Spring Boot | **4.1.0** |
| 语言 | Java | **21**（需本机安装 JDK 21） |
| 构建 | Maven Wrapper | 提供 `mvnw` / `mvnw.cmd`，免全局装 Maven |
| 数据访问 | **JdbcTemplate** | Spring Boot 4 Initializr 中 MyBatis 暂不可选，改用 JdbcTemplate（功能等价） |
| 数据源 | MySQL | `bigdata` 库（root / 123456，localhost:3306） |
| 前端 | Vue3 SFC + Vite + ECharts + axios | `frontend/` 工程，深色科技风大屏 |
| AI 模型 | **DeepSeek**（`deepseek-v4-pro`） | 通过官方 OpenAI 兼容接口接入，后端用 JDK 21 `HttpClient` 直连 |
| 开发工具 | IntelliJ IDEA | `.idea/` 已生成（已被 `.gitignore` 忽略） |

---

## 三、整体架构

```
                        大数据平台（上游，已独立于本工程）
  HDFS CSV ──► Hive DWD ──► Spark 聚合 ──► MySQL ADS 结果表（bigdata 库）
                                                        │
                                                        │ 只读查询
                                                        ▼
  前端 Vue3 + ECharts 大屏  ◄──  JSON  ──  Spring Boot 后端（本工程 recruit）
   通用 MetricChart / 省级地图 / AI 浮窗      GET /api/{board}/{metric}
                                            POST /api/ai/chat（DeepSeek）
```

- **后端只读取 ADS 表，不写、不重算**，保证「计算与展示分离」的架构原则。
- 用户可控输入仅路径中的 `board` / `metric`，二者只用于查 `MetricRegistry`，真正进入 SQL 的是 meta 中预置的表名/列名（内部配置），**不存在 SQL 注入面**。
- AI 模块调用 DeepSeek 的 key/model/URL 写死在 `AiController.java`（按需求不隐藏）。

---

## 四、目录结构

```
recruit/
├── pom.xml                          # Maven 构建（Spring Boot 4.1.0 + Java 21）
├── mvnw / mvnw.cmd                  # Maven Wrapper，免装 Maven 直接构建
├── README.md                        # 本文件
├── .gitignore                       # 已忽略 target / node_modules / frontend/dist 等
├── demo/                            # 前端静态原型（深色大屏演示，仅参考）
├── doc/
│   └── 目标文档.md                   # 持续性目标 / 进度 / 里程碑 / 风险
├── frontend/                        # 前端工程（Vue3 + Vite + ECharts）
│   ├── src/
│   │   ├── App.vue                  # 根组件，挂载 Dashboard + ChatWidget
│   │   ├── main.js
│   │   ├── api/metric.js            # axios 封装（baseURL=/api，超时 90s）
│   │   ├── views/Dashboard.vue      # 大屏总布局（统一网格，地图 2×2）
│   │   └── components/
│   │       ├── MetricChart.vue      # 通用图表（柱/饼/线/热力/词云，配置驱动）
│   │       ├── ChinaMap.vue         # 中国地图（省级岗位数，本地写死视角）
│   │       └── ChatWidget.vue       # 右下角 AI 对话浮窗（可拖拽，ESC 关闭）
│   ├── public/geo/                  # 本地固化地理资源【必须随仓库上传】
│   │   ├── china-cities.json        # 城市级边界（备用）
│   │   ├── china-provinces.json     # 34 个省级行政区边界（地图主用）
│   │   └── province_jobs.json       # 省级岗位数聚合（写死）
│   ├── vite.config.js               # /api 代理到 8080；构建配置
│   └── package.json
├── sql/                             # 数据脚本与成员交付
│   ├── member1.sql ~ member5.sql    # 成员 1~5 交付的建表 + 数据
│   ├── member6.sql                  # 成员 6 原始合并宽表（不符合契约，旧）
│   ├── member6_new.sql              # ★地域板准：ads_city_demand / ads_city_education / ads_city_experience
│   ├── member6_split.sql            # 早期标准化拆分（21 城，已弃用）
│   ├── ads_geo_demand_fixed.sql     # geo/demand 指标修正 SQL
│   ├── ads_city_salary_full.sql     # 全量城市薪资结果表
│   ├── generate_ads_geo_demand.py   # 由 CSV 重算 ads_geo_demand（321 城全量）
│   ├── generate_ads_city_salary.py  # 由 CSV 重算 ads_city_salary（过滤脏数据）
│   ├── load_member6_new.py          # 幂等加载 member6_new.sql
│   ├── build_local_geojson.py       # 下载固化城市边界 → china-cities.json
│   ├── build_local_province_geojson.py  # 下载固化省级边界 → china-provinces.json
│   ├── build_province_jobs.py       # 城市岗位数聚合到省级 → province_jobs.json
│   ├── build_ai_context.py          # 查库抽取平台真实数据 → ai_context.txt
│   ├── ai_context.txt               # 写死进 AI 系统提示词的真实统计数据
│   └── explore_csv.py               # CSV 字段探查辅助脚本
└── src/
    └── main/
        ├── java/com/cau/recruit/
        │   ├── RecruitApplication.java        # Spring Boot 启动类
        │   ├── common/Result.java             # 统一响应信封 {code, msg, data}
        │   ├── config/
        │   │   ├── MetricRegistry.java        # 18 指标注册表（配置驱动核心）
        │   │   └── CorsConfig.java            # 跨域（允许 Vite 5173）
        │   ├── controller/
        │   │   ├── MetricController.java      # GET /api/metrics + GET /api/{board}/{metric}
        │   │   └── AiController.java          # POST /api/ai/chat（DeepSeek，纯 JDK 实现）
        │   └── resources/application.properties  # 数据源等配置
        └── test/java/com/cau/recruit/
            └── RecruitApplicationTests.java
```

---

## 五、数据库约定

- **库名**：`bigdata`（MySQL，localhost:3306，本机数据库）。
- **结果表命名**：`ads_<板块>_<指标>`，如 `ads_talent_salary`、`ads_geo_demand`。靠板块前缀（talent / geo / industry / time / text）隔离各成员成果。
- **指标注册表（驱动源）**：交付的 SQL 中不含 `t_metric_meta` 表，故「配置驱动」由代码内 `MetricRegistry.java` 实现——每个指标一行（板块 / 指标 / 标题 / 表名 / 图表类型 / 字段映射 / 排序）。新建/调整指标只改这一处，无需新增 Controller。
- **连接方式**（`application.properties`）：
  ```
  jdbc:mysql://localhost:3306/bigdata?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8&allowPublicKeyRetrieval=true
  user=root  password=123456
  ```

> ⚠️ **成员 6 数据以 `member6_new.sql` 为准**：原 `member6.sql` 将地域板块三指标塞进一张宽表，不符合契约；`member6_new.sql` 已按标准拆分为 `ads_city_demand` / `ads_city_education` / `ads_city_experience` 三张标准长表（全量城市）。早期 `member6_split.sql`（21 城）已弃用。

---

## 六、接口约定

**统一响应信封**
```json
{ "code": 0, "msg": "success", "data": [ { "dim": "...", "value": 123 }, ... ] }
```

**通用指标接口（配置驱动）**
```
GET /api/{board}/{metric}
例：GET /api/talent/salary      → 学历×经验→薪资热力图数据
    GET /api/geo/demand         → 城市需求排名
```

- 后端依据 `{board}` + `{metric}` 查 `MetricRegistry`，取出结果表名/字段映射，动态拼 `SELECT *` 返回 `List<Map>`。
- `limit` 参数：`limit > 0` 时截断返回条数；`limit = 0` 或不传返回全量（如地图省级全量）。

**AI 问答接口**
```
POST /api/ai/chat
请求体：{ "message": "北京平均薪资多少？", "history": [ { "role":"user", "content":"..." }, { "role":"assistant", "content":"..." } ] }
响应体：{ "code": 0, "msg": "success", "data": { "reply": "..." } }

GET /api/ai/status   →  { "enabled": true, "model": "deepseek-v4-pro" }
```

---

## 七、AI 问答模块（DeepSeek）

AI 模块已**正式接入 DeepSeek 大模型**，基于平台真实招聘数据做自然语言问答。

### 接入方式
- **后端**：`AiController.java` 使用 JDK 21 自带的 `java.net.http.HttpClient` 调用 DeepSeek 官方 OpenAI 兼容接口。
- **模型**：`deepseek-v4-pro`（⚠️ **大小写敏感**，DeepSeek 官方只认全小写，写成 `deepseek-V4-pro` 会被拒）。
- **配置写死在代码中**（按需求不隐藏，便于评审直接查看）：
  ```java
  private static final String MIMO_URL     = "https://api.deepseek.com/v1/chat/completions";
  private static final String MIMO_API_KEY = "sk-2fae95422b7040b09c1141a29488ec86";
  private static final String MIMO_MODEL   = "deepseek-v4-pro";
  ```
- **系统提示词写死平台真实数据**：`SYSTEM_PROMPT` 内嵌了学历分布、经验分布、薪资、地域 TOP、行业、月度趋势、技能词云、福利、热门企业/职位等统计（数据来自 `sql/ai_context.txt`，由 `build_ai_context.py` 从 `bigdata` 库抽取生成），并约束模型只能依据真实数据作答、不编造。
- **纯 JDK 实现，无外部 JSON 库依赖**：因 `pom.xml` 使用 `spring-boot-starter-webmvc`（Boot4 轻量 starter），不含 Jackson databind，且本机 Maven 无法下载依赖；故 `AiController` 用手写 `jsonEscape()` + `extractContent()` 做 JSON 序列化与响应解析（提取 `choices[0].message.content`），零外部依赖。

### 前端浮窗
- `frontend/src/components/ChatWidget.vue`：右下角圆形霓虹悬浮按钮，点击展开玻璃拟态对话面板。
- 支持**拖拽移动**（拖标题栏，限制在视口内）。
- 关闭方式：**按 `ESC` 键关闭**（面板右上角常驻「ESC 关闭」提示，输入框 placeholder 亦注明）。
- 多轮对话：前端维护 `history` 传给后端，实现上下文记忆。
- 请求超时 90s（推理模型响应较慢）。

### ⚠️ 注意事项
- AI 接口**需要联网**访问 `api.deepseek.com`；离线环境下 `/api/ai/chat` 会返回调用失败提示，不影响其余大屏功能。
- API Key 已**明文写死在代码中**，上传仓库即公开；正式部署前请确认该 Key 的额度与有效期，或改为环境变量配置。

---

## 八、前端可视化说明

- **风格**：深色科技风大屏，玻璃拟态 + 霓虹描边，与整体主题统一。
- **布局**：统一 CSS Grid 网格，除地图外组件等长宽，地图组件长宽均为其他组件的 2 倍（2×2）。
- **通用图表 `MetricChart.vue`**：配置驱动，覆盖柱状 / 饼图 / 环形 / 折线 / 热力图 / 词云等；根据后端返回的 `chartType` 自动渲染。
- **热力图（学历 × 经验 → 薪资）**：纵轴学历从低到高排列（MBA 在最高位），横轴「经验不限」置于最左；色阶已提亮，无近黑深色。
- **中国地图（省级岗位数，写死视角）`ChinaMap.vue`**：
  - 只读本地 `public/geo/china-provinces.json`（34 个省级行政区边界，含台湾省/港/澳）+ `public/geo/province_jobs.json`（省级岗位数聚合），**不依赖外网、不依赖后端 geo 接口**，稳定可复现。
  - 全 34 个省级行政区均渲染，**无岗位省份也显示**。
  - `visualMap.min = 50`：岗位 **< 50 与 = 0 同色**，统一落入最低色。
  - **台湾省金色描边 + 发光阴影 + 常驻金色标注「★ 台湾省」**，重点显示。
  - 数据底座：由 `ads_city_demand` 的 321 城经城市→省 adcode 映射聚合，覆盖 99.2% 岗位（台湾=0、澳门=0、香港=26，北京居首）。

---

## 九、快速开始

### 0. 准备数据（一次性）
将各成员 SQL 在**本机 MySQL `bigdata` 库**执行建表并灌数（地域板块以 `member6_new.sql` 为准）：
```sql
CREATE DATABASE IF NOT EXISTS bigdata CHARACTER SET utf8mb4;
USE bigdata;
SOURCE E:/实训/结项项目/recruit/sql/member1.sql;
-- … member2 ~ member5、member6_new.sql
-- 如需刷新 geo 全量数据，执行 ads_geo_demand_fixed.sql
```

### 1. 启动后端
```bash
# 确保本机已安装 JDK 21
java -version

# 工程根目录，用 Maven Wrapper 启动（无需全局装 Maven）
./mvnw spring-boot:run          # Linux / macOS (Git Bash)
# 或
mvnw.cmd spring-boot:run        # Windows
```
启动后自测：
```bash
curl http://localhost:8080/api/metrics                 # 指标清单
curl http://localhost:8080/api/talent/salary           # 单指标数据
curl -X POST http://localhost:8080/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"北京平均薪资多少？","history":[]}'  # AI 问答
```

### 2. 启动前端
```bash
cd frontend
npm install
npm run dev            # 开发模式，默认 http://localhost:5173
# 或构建静态产物
npm run build          # 输出到 frontend/dist，可用任意静态服务器托管
```
浏览器打开 5173 端口即可看到大屏（Vite 已配置 `/api` 代理到后端 8080，无需额外跨域处理）。
右下角 AI 浮窗：点击展开，输入问题对话，**按 `ESC` 关闭**。

---

## 十、相关文档与上传须知

- 目标 / 进度跟踪：[`doc/目标文档.md`](doc/目标文档.md)
- 上游分析规范：`E:\实训\结项项目\标准结果表与接口组件模板.md`（18 组 ADS schema + 接口组件模板）
- 数据质量基线：`E:\实训\结项项目\团队代码规范与质量把控手册.md`

**Git 上传注意**：
1. `.gitignore` 已忽略 `target/`、`frontend/node_modules/`、`frontend/dist/`、`*.iml` 等；**但 `frontend/public/geo/*.json` 是地图运行时依赖的本地固化资源，必须随仓库上传，请勿加入忽略**。
2. AI 的 API Key 明文写在 `AiController.java` 中，上传即公开，请确认可接受后再推送到公开仓库。
3. 成员 6 数据以 `member6_new.sql` 为准，`member6_split.sql` 与原始 `member6.sql` 已弃用，可不纳入或仅作存档。

---

> 文档维护：本 README 反映当前可运行交付状态（前端已完成、AI 已接入 DeepSeek）。如发现与代码不符之处，以代码为准并同步更新此处。
