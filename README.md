# 🖥️ IsMyServerDown

**IsMyServerDown** is a server & application monitoring tool that allows you to:

* 🚨 Set alerts in case of crashes or abnormal behavior
* ⚡ Automate quick actions (macros) like restarting a lagging machine
* 📊 Monitor multiple servers/PCs from a single dashboard

---

## ✨ Features

* 📡 Real-time monitoring of servers & applications
* 🔔 Custom alert system (critical/warning notifications)
* 🤖 Automation via quick macros for events
* 📝 Logs of all alerts and actions
* 💻 Multi-platform support (Windows/Linux servers)

---

## 🛠️ Installation Guide

### 1️⃣ Database Setup

Install and configure a MySQL database named **`ismyserverdown_bdd`**.

#### Tables

```sql
-- Users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  op_level INT(50)
);

-- Tasks
CREATE TABLE `task-monitoring` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  ip VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  register TINYINT(1) NOT NULL,
  UNIQUE KEY unique_ip (ip)
);

-- Alerts
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscriber_ip VARCHAR(100) DEFAULT NULL,
  metric_type VARCHAR(50) DEFAULT NULL,
  max_value FLOAT DEFAULT NULL,
  min_value FLOAT DEFAULT NULL,
  action_type VARCHAR(500) DEFAULT '[]',
  status ENUM('enable','disable') DEFAULT 'enable',
  created_at DATETIME DEFAULT NULL
);

-- Subscribers
CREATE TABLE subscriber (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(100) DEFAULT NULL,
  ip VARCHAR(100) DEFAULT NULL,
  os VARCHAR(100) DEFAULT NULL,
  pc_type VARCHAR(100) DEFAULT NULL,
  register TINYINT(1) DEFAULT NULL,
  added TINYINT(1) DEFAULT NULL,
  UNIQUE KEY unique_ip (ip)
);

-- Constants
CREATE TABLE constants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscriber_id VARCHAR(100) DEFAULT NULL,
  metric_type VARCHAR(50) DEFAULT NULL,
  constant_value FLOAT DEFAULT NULL,
  status ENUM('warning','critical','normal') DEFAULT 'normal',
  updated_at DATETIME DEFAULT NULL,
  UNIQUE KEY unique_metric_per_subscriber (subscriber_id, metric_type)
);

-- Alerts logs
CREATE TABLE alerts_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  subscriber_ip VARCHAR(255) NOT NULL,
  message VARCHAR(255) NOT NULL,
  multiplier INT NOT NULL,
  urgency VARCHAR(255) NOT NULL
);
```

---

### 2️⃣ Environment Variables

Create a `.env` file with your configuration:

```env
EMAIL_FROM=
EMAIL_PASSWORD=
DB_HOST=
DB_USER=
DB_PASSWORD=
```

---

### 3️⃣ Install the Agent

* 💾 Download the Windows agent (Python builder)
* ⚙️ Install it on your server or PC to monitor

---

### 4️⃣ Start the Server

* 🚀 Run the Node.js server
* 🖥️ Configure monitored PCs/servers from the database

---

### 5️⃣ Usage

* ➕ Add subscribers (servers/PCs) in the `subscriber` table
* 📌 Configure tasks and metrics in `task-monitoring`
* 🔔 Set alerts and actions in `alerts`
* 📄 Check logs in `alerts_logs`

---

### 📄 License

This project is licensed under the **Apache License 2.0**.

You are free to **use, modify, distribute, and contribute** to this project, but you must:

* Include the original license and copyright notice
* Give proper credit to the original author
* Indicate if changes were made

Learn more about Apache 2.0 here: [https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0)

---
