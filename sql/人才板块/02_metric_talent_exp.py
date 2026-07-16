# -*- coding: utf-8 -*-
"""
02_metric_talent_exp.py  —— 成员二·指标 G（简单）
结果表：ads_talent_exp（exp_req, job_count）
图表：doughnut（经验要求分布）
运行：spark-submit --master yarn --deploy-mode client \
        --jars /export/server/apache-hive-3.1.2-bin/lib/mysql-connector-java-5.1.32.jar 02_metric_talent_exp.py
"""
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, desc, current_timestamp

JDBC_URL = "jdbc:mysql://node1:3306/bigdata?useSSL=false&characterEncoding=utf8"
JDBC_PROP = {"user": "root", "password": "123456", "driver": "com.mysql.jdbc.Driver"}

spark = (SparkSession.builder.appName("metric_talent_exp")
         .enableHiveSupport().getOrCreate())

res = (spark.table("bigdata.dwd_job")
       .filter(col("exp_req").isNotNull())
       .groupBy("exp_req")
       .agg(count("*").alias("job_count"))
       .orderBy(desc("job_count"))
       .select(col("exp_req"), "job_count")
       .withColumn("update_time", current_timestamp()))

res.write.mode("overwrite").option("truncate", "true").jdbc(JDBC_URL, "ads_talent_exp", properties=JDBC_PROP)
print("=== ads_talent_exp 写入完成，行数:", res.count(), " ===")
spark.stop()
