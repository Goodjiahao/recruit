# -*- coding: utf-8 -*-
"""
00_build_dwd.py  —— 成员二·人才板块
功能：读取 HDFS 上的原始 CSV（带引号/换行，用 Spark 健壮 CSV 读取），
      清洗后落 Hive 数仓 DWD 表 bigdata.dwd_job（采集→存储 环节）。
运行：spark-submit --master yarn --deploy-mode client 00_build_dwd.py
依赖：无需 MySQL 驱动（只写 Hive）。需 Hive Metastore 已启动。
"""
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, substring, regexp_replace

spark = (SparkSession.builder
         .appName("member2_build_dwd")
         .enableHiveSupport()
         .getOrCreate())

# 0) 确保 Hive 数仓库 bigdata 存在（与 MySQL 结果库同名但相互独立）
spark.sql("CREATE DATABASE IF NOT EXISTS bigdata")

# 1) 读 HDFS 原始 CSV（处理引号、转义、跨行、BOM）
HDFS_CSV = "hdfs://node1:8020/data/input/recruit/智联招聘数据库2025.csv"
raw = (spark.read
       .option("header", True)
       .option("quote", '"')
       .option("escape", '"')
       .option("multiLine", True)
       .option("encoding", "UTF-8")
       .csv(HDFS_CSV))

# 去掉首列可能的 BOM 字符
raw = raw.toDF(*[c.lstrip("﻿") for c in raw.columns])

# 2) 选列、改名、类型转换、计算衍生列；丢弃 4 个全空列
dwd = (raw.select(
            col("企业名称").alias("company"),
            col("招聘岗位").alias("job_title"),
            col("工作城市").alias("city"),
            col("工作区域").alias("area"),
            col("最低月薪").cast("double").alias("min_salary"),
            col("最高月薪").cast("double").alias("max_salary"),
            col("职位描述").alias("job_desc"),
            col("学历要求").alias("edu_req"),
            col("要求经验").alias("exp_req"),
            col("招聘人数").cast("int").alias("hire_count"),
            col("初级分类").alias("industry"),
            col("工作地点").alias("work_location"),
            col("招聘发布日期").alias("publish_date"),
            col("来源").alias("source"))
        .withColumn("avg_salary", (col("min_salary") + col("max_salary")) / 2)
        .withColumn("publish_month",
                    substring(regexp_replace(col("publish_date"), " ", ""), 1, 7))
        # 过滤无效薪资（最低/最高为空或<=0 视为缺失）
        .filter(col("min_salary").isNotNull() & (col("min_salary") > 0)
                & col("max_salary").isNotNull()))

# 3) 落 Hive 数仓 DWD（托管表，存于 /user/hive/warehouse）
dwd.write.mode("overwrite").saveAsTable("bigdata.dwd_job")

print("=== DWD 构建完成，行数:", dwd.count(), " ===")
spark.stop()
