"""
把 member6_new.sql 同步进本机 MySQL(bigdata)。
该文件是 member6 交付的地域板 Q/P/R 三张标准表：
  ads_city_demand(城市需求排名) / ads_city_education(城市学历结构) / ads_city_experience(城市经验结构)
用法: 系统 Python(自带 pymysql) 执行即可，幂等(DROP/CREATE/INSERT)。
"""
import re
import pymysql

SQL_PATH = r"E:\实训\结项项目\recruit\sql\member6_new.sql"
CONN = dict(host="127.0.0.1", port=3306, user="root", password="123456",
            database="bigdata", charset="utf8mb4", connect_timeout=10)


def main():
    raw = open(SQL_PATH, encoding="utf-8").read()
    # 去掉行内/整行 -- 注释，再按分号拆分语句
    raw = re.sub(r"--[^\n]*", "", raw)
    stmts = [s.strip().rstrip(";") for s in raw.split(";") if s.strip()]

    conn = pymysql.connect(**CONN)
    cur = conn.cursor()
    n_ok, n_fail = 0, 0
    for st in stmts:
        try:
            cur.execute(st)
            n_ok += 1
        except Exception as e:
            n_fail += 1
            print("  [FAIL]", e, "\n   SQL尾:", st[-80:])
    conn.commit()
    conn.close()

    print(f"执行完成: 成功 {n_ok} 条, 失败 {n_fail} 条")

    # 核对行数
    c = pymysql.connect(**CONN)
    cu = c.cursor()
    for t in ["ads_city_demand", "ads_city_education", "ads_city_experience"]:
        cu.execute(f"SELECT COUNT(*) FROM {t}")
        print(f"  {t}: {cu.fetchone()[0]} 行")
    c.close()


if __name__ == "__main__":
    main()
