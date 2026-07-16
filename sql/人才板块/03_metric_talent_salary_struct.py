# -*- coding: utf-8 -*-
"""
03_metric_talent_salary_struct.py  —— 成员二·指标 J（简单）
结果表：ads_talent_salary_struct（salary_bucket, sort_order, job_count）
图表：doughnut（整体薪资结构，按区间分桶）
运行：spark-submit --master yarn --deploy-mode client \
        --jars /export/server/apache-hive-3.1.2-bin/lib/mysql-connector-java-5.1.32.jar 03_metric_talent_salary_struct.py
"""
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, when, current_timestamp

JDBC_URL = "jdbc:mysql://node1:3306/bigdata?useSSL=false&characterEncoding=utf8"
JDBC_PROP = {"user": "root", "password": "123456", "driver": "com.mysql.jdbc.Driver"}

spark = (SparkSession.builder.appName("metric_talent_salary_struct")
         .enableHiveSupport().getOrCreate())

df = spark.table("bigdata.dwd_job").filter(col("avg_salary").isNotNull())

bucket = (when(col("avg_salary") < 3000, "3k以下")
          .when(col("avg_salary") < 5000, "3k-5k")
          .when(col("avg_salary") < 8000, "5k-8k")
          .when(col("avg_salary") < 12000, "8k-12k")
          .when(col("avg_salary") < 20000, "12k-20k")
          .when(col("avg_salary") < 30000, "20k-30k")
          .otherwise("30k以上"))

sort_order = (when(col("avg_salary") < 3000, 1)
              .when(col("avg_salary") < 5000, 2)
              .when(col("avg_salary") < 8000, 3)
              .when(col("avg_salary") < 12000, 4)
              .when(col("avg_salary") < 20000, 5)
              .when(col("avg_salary") < 30000, 6)
              .otherwise(7))

res = (df.withColumn("salary_bucket", bucket)
         .withColumn("sort_order", sort_order)
         .groupBy("salary_bucket", "sort_order")
         .agg(count("*").alias("job_count"))
         .select("salary_bucket", "sort_order", "job_count")
         .withColumn("update_time", current_timestamp()))

res.write.mode("overwrite").option("truncate", "true").jdbc(JDBC_URL, "ads_talent_salary_struct", properties=JDBC_PROP)
print("=== ads_talent_salary_struct 写入完成，行数:", res.count(), " ===")
spark.stop()
