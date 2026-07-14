# 招聘就业大数据分析平台 · 后端服务（recruit）

> 本仓库是「2025 招聘就业大数据分析平台」的**后端服务**与**交付物集成工程**，
> 负责从 MySQL 读取各成员经 Spark/Hive 分析落库的 ADS 结果表，通过 RESTful 接口为前端 Vue + ECharts 大屏提供标准化数据。

---

## 一、项目目标

| 目标 | 说明 |
|---|---|
| **数据服务化** | 连接本机 MySQL `bigdata` 库，读取已由 Spark 分析落库的 18 张 ADS 结果表，对外提供查询接口。 |
| **配置驱动** | 18 个指标共用一套通用接口，仅靠 `t_metric_meta` 配置表驱动；新增指标**零新增业务代码**，只需插一行配置。 |
| **前后端分离** | 后端只做数据接口，前端（Vue3 + ECharts）负责可视化展示，二者通过 JSON 接口契约解耦。 |
| **集成契约统一** | 以 MySQL ADS 结果表作为「分析层 ↔ 展示层」唯一对接口，靠 `ads_<板块>_<指标>` 表名前缀天然隔离 6 个成员的成果。 |
| **（预留）AI 问答** | 预留 `/api/ai/chat` 接口与前端空面板，视工作量决定是否接入大模型，实现自然语言问答互动。 |

**一句话定位**：上游是大数据平台（HDFS → Hive DWD → Spark 聚合 → MySQL ADS），本工程是这条链路的**末端数据服务层**。

---

## 二、技术栈

| 层 | 技术 | 版本 / 说明 |
|---|---|---|
| 后端框架 | Spring Boot | **4.1.0** |
| 语言 | Java | **21**（`pom.xml` 中 `java.version=21`，需本机安装 JDK 21） |
| 构建 | Maven | 提供 `mvnw` / `mvnw.cmd`（无需全局安装 Maven） |
| 数据访问 | **JdbcTemplate** | 因 Spring Boot 4 Initializr 中 MyBatis 暂不可选，改用 JdbcTemplate，功能等价 |
| 数据源 | MySQL | `bigdata` 库（root / 123456） |
| 前端（规划） | Vue3 SFC + Vite + ECharts + axios | 独立 `frontend/` 工程（当前为空，原型见 `demo/`） |
| 开发工具 | IntelliJ IDEA | 工程的 `.idea/` 已生成 |

---

## 三、整体架构

```
                        大数据平台（上游，已独立于本工程）
  HDFS CSV ──► Hive DWD ──► Spark 聚合 ──► MySQL ADS 结果表（bigdata 库）
                                                        │
                                                        │ 只读查询
                                                        ▼
  前端 Vue3 + ECharts 大屏  ◄──  JSON  ──  Spring Boot 后端（本工程 recruit）
   demo/ 深色原型              接口        GET /api/{board}/{metric}
                                        （配置驱动，JdbcTemplate 读 ADS 表）
```

- **本工程只读取 ADS 表，不写、不重算**，保证「计算与展示分离」的架构原则。
- 用户可控输入仅路径中的 `board` / `metric`，二者只用于查 `t_metric_meta`，真正进入 SQL 的是 meta 中预置的表名/列名（内部配置），**不存在 SQL 注入面**。

---

## 四、项目结构

```
recruit/
├── pom.xml                          # Maven 构建（Spring Boot 4.1.0 + Java 21）
├── mvnw / mvnw.cmd                  # Maven Wrapper，免装 Maven 直接构建
├── README.md                        # 本文件
├── .idea/                           # IDEA 工程配置（自动生成）
├── doc/
│   └── 目标文档.md                   # 持续性目标/进度文档（目标、决策、里程碑、风险）
├── demo/                            # 前端原型（深色大屏静态演示，仅参考用）
│   ├── index.html                   # 大屏入口
│   ├── app.js                       # ECharts 图表配置（柱状/饼/热力/地图…）
│   ├── mock-data.js                 # 模拟数据（接口联调前的占位数据）
│   ├── styles.css                   # 深色主题样式
│   ├── lib/                         # ECharts 等前端库
│   └── assets/                      # 静态资源
├── frontend/                        # 【待建】前端工程（Vue3 + Vite + ECharts）
├── sql/                             # 各成员交付的 ADS 结果表 SQL（集成来源）
│   ├── member1.sql ~ member5.sql    # 成员 1~5 交付的建表 + 数据
│   ├── member6.sql                  # 成员 6 原始合并宽表（不符合「三张表」契约）
│   ├── member6/                     # 成员 6 自行补发的拆分（仅 7 城，不完整）
│   │   ├── 1.sql / 2.sql / 3.sql
│   └── member6_split.sql            # ★标准化拆分：ads_geo_demand / ads_geo_edu / ads_geo_exp（21 城完整，推荐采用）
└── src/
    ├── main/
    │   ├── java/com/cau/recruit/
    │   │   └── RecruitApplication.java        # 【已生成】Spring Boot 启动类
    │   └── resources/
    │       └── application.properties         # 【已生成】应用配置（待补数据源）
    └── test/java/com/cau/recruit/
        └── RecruitApplicationTests.java       # 【已生成】启动测试
```

### 后端代码结构（规划 / 待补齐）

> 以下为按「配置驱动」设计、**尚未写入**的包结构，`RecruitApplication` 已存在：

```
src/main/java/com/cau/recruit/
├── RecruitApplication.java         # 启动类（已生成）
├── common/
│   └── Result.java                 # 统一响应信封 {code, msg, data}
├── entity/
│   └── MetricMeta.java             # t_metric_meta 配置表映射
├── repository/
│   └── MetricRepository.java       # JdbcTemplate 通用查询（读 meta → 动态拼 SQL → 查 ADS 表）
└── controller/
    ├── MetricController.java        # GET /api/{board}/{metric}
    └── AiController.java            # /api/ai/chat（预留，暂不接模型）
```

---

## 五、数据库约定

- **库名**：`bigdata`（MySQL，host 待定：node1 本机或 Windows 本机导入库）。
- **结果表命名**：`ads_<板块>_<指标>`，例如 `ads_talent_salary`、`ads_geo_demand`。靠板块前缀（talent / geo / region / industry / time / text）隔离 6 个成员成果。
- **配置表**：`t_metric_meta` —— 每个指标一行，含板块、指标代号、结果表名、维度列、指标列、图表类型、排序等，是通用接口的「驱动源」。
- **每张 ADS 表必须含 `update_time` 列**，作为集成契约的一部分。
- **连接方式**（待填 `application.properties`）：
  ```
  jdbc:mysql://<host>:3306/bigdata?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
  user=root  password=123456
  ```

> ⚠️ 组员 SQL 注意点：成员 6 原 `member6.sql` 将地域板块三指标塞进一张宽表 `ads_city_analysis`，不符合契约；
> 已生成 `member6_split.sql` 按标准拆分为 `ads_geo_demand` / `ads_geo_edu` / `ads_geo_exp` 三张长表（21 城完整、补 `update_time`），**集成时以 `member6_split.sql` 为准**。

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

- 后端依据 `{board}` + `{metric}` 查 `t_metric_meta`，取出结果表名/列，动态拼 SELECT 返回 `List<Map>`。
- **AI 问答（预留）**：`POST /api/ai/chat`，当前仅占位，按工作量决定是否接入大模型。

---

## 七、当前进度与待办

| 状态 | 事项 |
|---|---|
| ✅ 已完成 | 工程骨架（pom、启动类、测试类、`.idea`） |
| ✅ 已完成 | 组员 SQL 收集（member1~6） |
| ⏳ 待补齐 | `pom.xml` 加入 `spring-boot-starter-jdbc` 依赖 |
| ⏳ 待补齐 | `application.properties` 配置数据源 |
| ⏳ 待补齐 | 业务代码：Result / MetricMeta / MetricRepository / MetricController / AiController（预留） |
| ⏳ 待补齐 | 前端 `frontend/` 工程（深色大屏 + 通用组件 + 地图注册） |
| ⏳ 阻塞 | 等全员 SQL 到齐后统一落库，确认真实列名/类型 |
| ⏳ 阻塞 | 确认后端连接的 MySQL 主机（node1 还是 Windows 本机） |

> 进度详情见 [`doc/目标文档.md`](doc/目标文档.md)。

---

## 八、快速开始（后端）

```bash
# 1. 确保本机已安装 JDK 21
java -version

# 2. 在工程根目录用 Maven Wrapper 启动（无需全局装 Maven）
./mvnw spring-boot:run          # Linux / macOS (Git Bash)
# 或
mvnw.cmd spring-boot:run        # Windows

# 3. 接口自测
curl http://localhost:8080/api/talent/salary
```

> 当前骨架尚未接入数据源与业务代码，直接启动只会跑空壳；待第七节的待补齐项完成后方可联调。

---

## 九、相关文档

- [`doc/目标文档.md`](doc/目标文档.md) —— 持续性目标 / 进度 / 里程碑 / 风险跟踪
- 上游分析规范：`E:\实训\结项项目\标准结果表与接口组件模板.md`（18 组 ADS schema + 接口组件模板）
- 数据质量基线：`E:\实训\结项项目\团队代码规范与质量把控手册.md`
