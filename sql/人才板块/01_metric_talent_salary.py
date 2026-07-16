# -*- coding: utf-8 -*-
"""
01_metric_talent_salary.py  —— 成员二·指标 B（核心）
结果表：ads_talent_salary（edu_level, exp_level, avg_salary, job_count）
图表：heatmap（学历 × 经验 → 平均月薪）
运行：spark-submit --master yarn --deploy-mode client \
        --jars /export/server/apache-hive-3.1.2-bin/lib/mysql-connector-java-5.1.32.jar 01_metric_talent_salary.py
"""
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, avg, count, round as rounding, current_timestamp

JDBC_URL = "jdbc:mysql://node1:3306/bigdata?useSSL=false&characterEncoding=utf8"
JDBC_PROP = {"user": "root", "password": "123456", "driver": "com.mysql.jdbc.Driver"}

spark = (SparkSession.builder.appName("metric_talent_salary")
         .enableHiveSupport().getOrCreate())

df = (spark.table("bigdata.dwd_job")
      .filter(col("avg_salary").isNotNull()
              & col("edu_req").isNotNull()
              & col("exp_req").isNotNull()))

res = (df.groupBy("edu_req", "exp_req")
         .agg(rounding(avg("avg_salary"), 2).alias("avg_salary"),
              count("*").alias("job_count"))
         .select(col("edu_req").alias("edu_level"),
                 col("exp_req").alias("exp_level"),
                 "avg_salary", "job_count")
         .withColumn("update_time", current_timestamp()))

res.write.mode("overwrite").option("truncate", "true").jdbc(JDBC_URL, "ads_talent_salary", properties=JDBC_PROP)
print("=== ads_talent_salary 写入完成，行数:", res.count(), " ===")
spark.stop()
