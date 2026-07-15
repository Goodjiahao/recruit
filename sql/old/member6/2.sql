/*
MySQL Backup
Source Server Version: 5.7.29
Source Database: zhilian_ads
Date: 2026/7/14 15:30:50
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
--  Table structure for `ads_city_edu_structure`
-- ----------------------------
DROP TABLE IF EXISTS `ads_city_edu_structure`;
CREATE TABLE `ads_city_edu_structure` (
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `education` varchar(50) DEFAULT NULL COMMENT '学历要求',
  `job_count` int(11) DEFAULT NULL COMMENT '岗位数量',
  `pct` double DEFAULT NULL COMMENT '占比百分比'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Records 
-- ----------------------------
INSERT INTO `ads_city_edu_structure` VALUES ('北京','本科','65','56.03');
INSERT INTO `ads_city_edu_structure` VALUES ('北京','硕士','28','24.14');
INSERT INTO `ads_city_edu_structure` VALUES ('北京','大专','20','17.24');
INSERT INTO `ads_city_edu_structure` VALUES ('北京','学历不限','3','2.59');
INSERT INTO `ads_city_edu_structure` VALUES ('郑州','本科','56','64.37');
INSERT INTO `ads_city_edu_structure` VALUES ('郑州','大专','26','29.89');
INSERT INTO `ads_city_edu_structure` VALUES ('郑州','硕士','4','4.60');
INSERT INTO `ads_city_edu_structure` VALUES ('郑州','中专/中技','1','1.15');
INSERT INTO `ads_city_edu_structure` VALUES ('成都','本科','39','69.64');
INSERT INTO `ads_city_edu_structure` VALUES ('成都','大专','12','21.43');
INSERT INTO `ads_city_edu_structure` VALUES ('成都','硕士','5','8.93');
INSERT INTO `ads_city_edu_structure` VALUES ('上海','本科','30','68.18');
INSERT INTO `ads_city_edu_structure` VALUES ('上海','硕士','8','18.18');
INSERT INTO `ads_city_edu_structure` VALUES ('上海','大专','5','11.36');
INSERT INTO `ads_city_edu_structure` VALUES ('上海','学历不限','1','2.27');
INSERT INTO `ads_city_edu_structure` VALUES ('济南','本科','16','76.19');
INSERT INTO `ads_city_edu_structure` VALUES ('济南','大专','3','14.29');
INSERT INTO `ads_city_edu_structure` VALUES ('济南','硕士','2','9.52');
INSERT INTO `ads_city_edu_structure` VALUES ('南京','本科','13','65.00');
INSERT INTO `ads_city_edu_structure` VALUES ('南京','硕士','4','20.00');
INSERT INTO `ads_city_edu_structure` VALUES ('南京','大专','3','15.00');
INSERT INTO `ads_city_edu_structure` VALUES ('深圳','本科','14','70.00');
INSERT INTO `ads_city_edu_structure` VALUES ('深圳','硕士','3','15.00');
INSERT INTO `ads_city_edu_structure` VALUES ('深圳','大专','3','15.00');