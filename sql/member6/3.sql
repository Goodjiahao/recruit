/*
MySQL Backup
Source Server Version: 5.7.29
Source Database: zhilian_ads
Date: 2026/7/14 15:30:50
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
--  Table structure for `ads_city_exp_structure`
-- ----------------------------
DROP TABLE IF EXISTS `ads_city_exp_structure`;
CREATE TABLE `ads_city_exp_structure` (
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `experience` varchar(50) DEFAULT NULL COMMENT '经验要求',
  `job_count` int(11) DEFAULT NULL COMMENT '岗位数量',
  `pct` double DEFAULT NULL COMMENT '占比百分比'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Records 
-- ----------------------------
INSERT INTO `ads_city_exp_structure` VALUES ('北京','3-5年','40','33.33');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','1-3年','29','24.17');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','5-10年','17','14.17');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','经验不限','14','11.67');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','无经验','10','8.33');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','10年以上','5','4.17');
INSERT INTO `ads_city_exp_structure` VALUES ('北京','1年以下','5','4.17');
INSERT INTO `ads_city_exp_structure` VALUES ('郑州','1-3年','31','45.59');
INSERT INTO `ads_city_exp_structure` VALUES ('郑州','经验不限','20','29.41');
INSERT INTO `ads_city_exp_structure` VALUES ('郑州','3-5年','13','19.12');
INSERT INTO `ads_city_exp_structure` VALUES ('郑州','无经验','3','4.41');
INSERT INTO `ads_city_exp_structure` VALUES ('郑州','5-10年','1','1.47');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','1-3年','27','48.21');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','3-5年','14','25.00');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','经验不限','7','12.50');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','5-10年','5','8.93');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','无经验','2','3.57');
INSERT INTO `ads_city_exp_structure` VALUES ('成都','1年以下','1','1.79');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','1-3年','21','41.18');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','3-5年','11','21.57');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','经验不限','8','15.69');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','无经验','5','9.80');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','5-10年','4','7.84');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','10年以上','1','1.96');
INSERT INTO `ads_city_exp_structure` VALUES ('上海','1年以下','1','1.96');
INSERT INTO `ads_city_exp_structure` VALUES ('济南','1-3年','9','42.86');
INSERT INTO `ads_city_exp_structure` VALUES ('济南','3-5年','8','38.10');
INSERT INTO `ads_city_exp_structure` VALUES ('济南','经验不限','3','14.29');
INSERT INTO `ads_city_exp_structure` VALUES ('济南','无经验','1','4.76');
INSERT INTO `ads_city_exp_structure` VALUES ('南京','1-3年','10','50.00');
INSERT INTO `ads_city_exp_structure` VALUES ('南京','3-5年','7','35.00');
INSERT INTO `ads_city_exp_structure` VALUES ('南京','经验不限','2','10.00');
INSERT INTO `ads_city_exp_structure` VALUES ('南京','5-10年','1','5.00');
INSERT INTO `ads_city_exp_structure` VALUES ('深圳','1-3年','10','50.00');
INSERT INTO `ads_city_exp_structure` VALUES ('深圳','3-5年','5','25.00');
INSERT INTO `ads_city_exp_structure` VALUES ('深圳','经验不限','3','15.00');
INSERT INTO `ads_city_exp_structure` VALUES ('深圳','无经验','2','10.00');