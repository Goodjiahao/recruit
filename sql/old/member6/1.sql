/*
MySQL Backup
Source Server Version: 5.7.29
Source Database: zhilian_ads
Date: 2026/7/14 15:30:50
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
--  Table structure for `ads_city_demand_rank`
-- ----------------------------
DROP TABLE IF EXISTS `ads_city_demand_rank`;
CREATE TABLE `ads_city_demand_rank` (
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `job_count` int(11) DEFAULT NULL COMMENT '岗位数量',
  `rank` int(11) DEFAULT NULL COMMENT '需求排名',
  `pct` double DEFAULT NULL COMMENT '占比百分比'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Records 
-- ----------------------------
INSERT INTO `ads_city_demand_rank` VALUES ('北京','68','1','16.83');
INSERT INTO `ads_city_demand_rank` VALUES ('郑州','45','2','11.14');
INSERT INTO `ads_city_demand_rank` VALUES ('成都','33','3','8.17');
INSERT INTO `ads_city_demand_rank` VALUES ('上海','30','4','7.43');
INSERT INTO `ads_city_demand_rank` VALUES ('济南','21','5','5.20');
INSERT INTO `ads_city_demand_rank` VALUES ('南京','20','6','4.95');
INSERT INTO `ads_city_demand_rank` VALUES ('深圳','20','6','4.95');
INSERT INTO `ads_city_demand_rank` VALUES ('武汉','20','6','4.95');
INSERT INTO `ads_city_demand_rank` VALUES ('天津','16','9','3.96');
INSERT INTO `ads_city_demand_rank` VALUES ('西安','14','10','3.47');
INSERT INTO `ads_city_demand_rank` VALUES ('杭州','13','11','3.22');
INSERT INTO `ads_city_demand_rank` VALUES ('广州','12','12','2.97');
INSERT INTO `ads_city_demand_rank` VALUES ('沈阳','12','12','2.97');
INSERT INTO `ads_city_demand_rank` VALUES ('长沙','11','14','2.72');
INSERT INTO `ads_city_demand_rank` VALUES ('福州','10','15','2.48');
INSERT INTO `ads_city_demand_rank` VALUES ('苏州','10','15','2.48');
INSERT INTO `ads_city_demand_rank` VALUES ('哈尔滨','9','17','2.23');
INSERT INTO `ads_city_demand_rank` VALUES ('南通','9','17','2.23');
INSERT INTO `ads_city_demand_rank` VALUES ('青岛','8','19','1.98');
INSERT INTO `ads_city_demand_rank` VALUES ('合肥','7','20','1.73');
INSERT INTO `ads_city_demand_rank` VALUES ('其他城市','34','21','8.42');