/*
MySQL Backup
Source Server Version: 5.7.29
Source Database: zhilian_ads
Date: 2026/7/14 15:30:50
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
--  Table structure for `ads_city_salary`
-- ----------------------------
DROP TABLE IF EXISTS `ads_city_salary`;
CREATE TABLE `ads_city_salary` (
  `city` varchar(50) DEFAULT NULL,
  `job_count` int(11) DEFAULT NULL,
  `avg_salary` double DEFAULT NULL,
  `max_salary` double DEFAULT NULL,
  `min_salary` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Table structure for `ads_edu_dist`
-- ----------------------------
DROP TABLE IF EXISTS `ads_edu_dist`;
CREATE TABLE `ads_edu_dist` (
  `education` varchar(50) DEFAULT NULL,
  `job_count` int(11) DEFAULT NULL,
  `pct` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Table structure for `ads_hot_jobs`
-- ----------------------------
DROP TABLE IF EXISTS `ads_hot_jobs`;
CREATE TABLE `ads_hot_jobs` (
  `job_title` varchar(100) DEFAULT NULL,
  `job_count` int(11) DEFAULT NULL,
  `avg_salary` double DEFAULT NULL,
  `city_cnt` int(11) DEFAULT NULL,
  `avg_hire_count` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Records 
-- ----------------------------
INSERT INTO `ads_city_salary` VALUES ('北京','15794','12406','250000','0'), ('成都','5692','9200','200000','0'), ('郑州','4760','9357','100000','0'), ('上海','3908','14178','240000','0'), ('深圳','3704','10727','200000','0'), ('广州','3249','9682','210000','9'), ('西安','2956','8837','250000','9'), ('天津','2686','9254','250000','0'), ('济南','2287','8905','100000','0'), ('南京','2077','9754','80000','0');
INSERT INTO `ads_edu_dist` VALUES ('高中及以下','439','0.48'), ('大专及以下','26834','29.51'), ('本科','59193','65.1'), ('研究生及以上','4461','4.91');
INSERT INTO `ads_hot_jobs` VALUES ('法务专员','4658','7644','196','1'), ('招投标专员','3465','6071','142','2'), ('实习律师','2563','4077','76','3'), ('投标专员','2480','6281','111','2'), ('授薪律师','2254','10589','77','2'), ('律师助理','2166','5201','83','3'), ('法务经理','1592','15623','106','1'), ('执业律师','1341','14870','75','5'), ('标书专员','1278','5778','82','2'), ('专职律师','1258','14028','60','5'), ('法务主管','1257','11589','105','1'), ('提成律师','1175','20973','43','11'), ('商务投标专员','1109','6410','84','1'), ('标书制作专员','1056','5587','95','1'), ('法务','992','10217','87','1'), ('公司法务','909','8404','96','1'), ('招标代理专员','699','6723','73','2'), ('工程招投标专员','543','6203','66','1'), ('法务助理','539','5988','69','2'), ('招标专员','461','6200','60','2'), ('法律顾问','439','10126','53','3'), ('实习律师/律师助理','409','3769','41','3'), ('合伙人律师','391','36563','36','4'), ('标书文员','389','5330','56','1'), ('法务总监','373','23645','46','1'), ('律师','350','16919','43','4'), ('招标项目经理','344','8593','32','2'), ('独立律师','343','18032','29','8'), ('工伤事故办案律师（合作）','336','12500','1','1'), ('招投标主管','333','8554','45','1');
