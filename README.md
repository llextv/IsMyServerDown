Create a mysql database:

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  op_level INT(50) 
);

CREATE TABLE subscriber (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(100),
  ip VARCHAR(100),
  os VARCHAR(100),
  pc_type VARCHAR(100),
  register BOOLEAN,
  added BOOLEAN
);

CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id VARCHAR(100),
    metric_type VARCHAR(50),
    max_value FLOAT,
    min_value FLOAT,
    action_type VARCHAR(500) DEFAULT '[]', 
    status ENUM('enable', 'disable') DEFAULT 'enable',
    created_at DATETIME
);

CREATE TABLE constants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id VARCHAR(100),
    metric_type VARCHAR(50),
    constant_value FLOAT,
    status ENUM('warning', 'critical', 'normal') DEFAULT 'normal',
    updated_at DATETIME
);



