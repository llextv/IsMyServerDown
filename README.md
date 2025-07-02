
# Welcome to IsMyServerDown repo

Installation Guide:

- Install and setup a MySql database (name: ismyserverdown_bdd)

**Table to include in this database:** 

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  op_level INT(50) 
);

CREATE TABLE `task-monitoring` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(100) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `register` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ip` (`ip`)
);

CREATE TABLE `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscriber_ip` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `metric_type` varchar(50) DEFAULT NULL,
  `max_value` float DEFAULT NULL,
  `min_value` float DEFAULT NULL,
  `action_type` varchar(500) DEFAULT '[]',
  `status` enum('enable','disable') DEFAULT 'enable',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `subscriber` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(100) DEFAULT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `pc_type` varchar(100) DEFAULT NULL,
  `register` tinyint(1) DEFAULT NULL,
  `added` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ip` (`ip`)
);

CREATE TABLE `constants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscriber_id` varchar(100) DEFAULT NULL,
  `metric_type` varchar(50) DEFAULT NULL,
  `constant_value` float DEFAULT NULL,
  `status` enum('warning','critical','normal') DEFAULT 'normal',
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_metric_per_subscriber` (`subscriber_id`,`metric_type`)
)

CREATE TABLE `alerts_logs` (`id` INT NOT NULL AUTO_INCREMENT , `name` VARCHAR(255) NOT NULL , `type` VARCHAR(255) NOT NULL , `subscriber_ip` VARCHAR(255) NOT NULL , `message` VARCHAR(255) NOT NULL , `multiplier` INT NOT NULL , `urgency` VARCHAR(255) NOT NULL , PRIMARY KEY (`id`))
```
- Create a .env with your informations:
```js
EMAIL_FROM=
EMAIL_PASSWORD=
DB_HOST=
DB_USER=
DB_PASSWORD=
```
- Download the Win File of Agent (Python builder) and install it on your server / pc etc ..

- Start the node js server on your server, configure your PC ... from **THE DATABASE FOR THE MOMENT**