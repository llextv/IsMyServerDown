const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = "8000"
const nodemailer = require('nodemailer');
const axios = require('axios');
const ping = require('ping');
require('dotenv').config();

app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD
  }
});


const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'ismyserverdown_bdd'
});



connection.connect(err => {
  if (err) {
    console.error('Mysql error: ', err);
    return;
  }
  console.log('Connected to DB');
});

app.get('/', (req, res) => {
    res.send("Hello world");
})

app.post('/api/register', (req, res) => {
    const { name, ip, os, type } = req.body;

    const sql = `
        INSERT INTO subscriber (pc_name, ip, os, pc_type, register, added)
        VALUES (?, ?, ?, ?, TRUE, FALSE)
    `;

    connection.query(sql, [name, ip, os, type], (err, results) => {
        if (err) {
            if(err.errno == 1062){
                connection.query("SELECT id FROM subscriber WHERE ip = ?", [ip], (err, results) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Unhown error");
                    }
                
                    console.log(results);
                    return res.status(409).json({
                        message: "PC Already register",
                        ip: ip,
                        pc_name: name,
                        id: results[0].id
                    })
                });
                return;
            }
            console.error(err);
            return res.status(500).send("Insert error");
        }

        console.log(results);
        res.status(200).send("OK");
    });
})

function checkAlert(constant){
    let requestsql = `SELECT * FROM alerts WHERE subscriber_ip = ?`;

    connection.query(requestsql, [constant.ip], (err, results) => {
        console.log("query ok");
        console.log(constant.ip);
        if (results && results.length > 0) {
            console.log("84");
            results.forEach((alert) => {
                console.log(alert.action_type);
                if (alert.status === 'enable') {
                    console.log(alert + " enable");
                    console.log(constant);
                    const metricValue = constant[alert.metric_type];
                    if (typeof metricValue !== 'undefined') {
                        if (
                            (alert.max_value !== null && metricValue > alert.max_value) ||
                            (alert.min_value !== null && metricValue < alert.min_value)
                        ) {
                            console.log("alert over");
                            console.log(
                            `Alert for ${alert.metric_type} on subscriber ${constant.ip}: value = ${metricValue}`
                            );
                            let action_type = JSON.parse(alert.action_type);
                            action_type.forEach(element => {
                                if(element.includes("@")){
                                    const mailOptions = {
                                      from: process.env.EMAIL_FROM,
                                      to: element,
                                      subject: 'System alert',
                                      text: `Warning, this is an system alert. More infos: ${alert.metric_type} on ${constant.ip} value = ${metricValue} `
                                    };
                                    transporter.sendMail(mailOptions, (error, info) => {
                                      if (error) {
                                        return console.error('Error email send :', error);
                                      }
                                      console.log('Email sended :', info.response);
                                    });
                                }else if (element.includes("discord.com")) {
                                    axios.post(element, {
                                        username: "System alert",
                                        content: `🚨 **Alert**\n**Subscriber :** ${constant.ip}\n**Metric :** ${alert.metric_type}\n**Value :** ${metricValue}\n**Treshold:** min=${alert.min_value}, max=${alert.max_value}`
                                    }).then(() => {
                                        console.log("Discord webhook ok");
                                    }).catch((err) => {
                                        console.error("error discord webhook", err.message);
                                    });
                                }
                            });
                            
                        }
                    }
                }
            });
        } else {
            // console.log("No alert enable");
        }
            
    })
}

app.post('/api/constant', (req, res) => {
    const {
        cpu_usage,
        cpu_logical_cores,
        cpu_physical_cores,
        ram_total,
        ram_used,
        ram_available,
        ram_usage,
        disk_total,
        disk_used,
        disk_free,
        disk_usage,
        net_sent,
        net_received,
        ip
    } = req.body;

    connection.query("SELECT id FROM subscriber WHERE ip = ?", [ip], (err, results) => {
        if (err || results.length === 0) {
            console.error(err || "Subscriber not found");
            return res.status(404).send("Subscriber not found");
        }
        const subscriber_id = results[0].id;

        const sql = `
            INSERT INTO constants (subscriber_id, metric_type, constant_value, updated_at)
            VALUES 
            (?, 'cpu_usage', ?, NOW()),
            (?, 'cpu_logical_cores', ?, NOW()),
            (?, 'cpu_physical_cores', ?, NOW()),
            (?, 'ram_total', ?, NOW()),
            (?, 'ram_used', ?, NOW()),
            (?, 'ram_available', ?, NOW()),
            (?, 'ram_usage', ?, NOW()),
            (?, 'disk_total', ?, NOW()),
            (?, 'disk_used', ?, NOW()),
            (?, 'disk_free', ?, NOW()),
            (?, 'disk_usage', ?, NOW()),
            (?, 'net_sent', ?, NOW()),
            (?, 'net_received', ?, NOW())
            ON DUPLICATE KEY UPDATE
                constant_value = VALUES(constant_value),
                updated_at = VALUES(updated_at);
        `;

        const params = [
            subscriber_id, cpu_usage,
            subscriber_id, cpu_logical_cores,
            subscriber_id, cpu_physical_cores,
            subscriber_id, ram_total,
            subscriber_id, ram_used,
            subscriber_id, ram_available,
            subscriber_id, ram_usage,
            subscriber_id, disk_total,
            subscriber_id, disk_used,
            subscriber_id, disk_free,
            subscriber_id, disk_usage,
            subscriber_id, net_sent,
            subscriber_id, net_received
        ];

        connection.query(sql, params, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Insert error");
            }
        });
    });
    const mappedConstant = {
        cpu_usage,
        cpu_logical_cores,
        cpu_physical_cores,
        ram_total,
        ram_used,
        ram_available,
        ram_usage,
        disk_total,
        disk_used,
        disk_free,
        disk_usage,
        net_sent,
        net_received,
        ip
    };
    checkAlert(mappedConstant);
    res.status(200).send("Constant data received");
});

function task_monitoring(){
    const sql = "SELECT * FROM `task-monitoring` ;";
    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        
        console.log("result ", results);
        
        results.forEach((task, index) => {
            let ip = results[index]['ip'];
            if(ip == undefined) return;
            console.log("task: ", task);
            if(task["type"] == "ping"){
                ping.promise.probe(ip, {
                    timeout: 3,
                    //extra: ['-c', '2'], //dont work on windows
                }).then((res) => {
                    console.log(res);
                    if (res.alive) {
                        console.log(`${ip} is ok (${res.time} ms)`);
                        const alert_sql = `SELECT * FROM alerts WHERE subscriber_ip = ? AND metric_type = ?;`
                        connection.query(alert_sql, [ip, "ping"], (err, results) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            if(results == undefined || results.length == 0) return;
                            console.log("alert: ", results);
                            let action_type = JSON.parse(results[0]["action_type"]);
                            let min = JSON.parse(results[0].min_value);
                            let max = JSON.parse(results[0].max_value);
                            if(res.min < min || res.max > max){
                                if(action_type == undefined) return;
                                action_type.forEach((action, index) => {
                                    console.log(action);
                                    if(action.includes("@")){
                                        const mailOptions = {
                                          from: process.env.EMAIL_FROM,
                                          to: action,
                                          subject: 'System alert',
                                          text: `Warning, this is an system alert. More infos: ping on ${ip} have ${res.min}, ${res.max}`
                                        };
                                        transporter.sendMail(mailOptions, (error, info) => {
                                          if (error) {
                                            return console.error('Error email send :', error);
                                          }
                                          console.log('Email sended :', info.response);
                                        });
                                    }else if (action.includes("discord.com")) {
                                        axios.post(action, {
                                            username: "System alert",
                                            content: `🚨 **Alert**\n**Subscriber :** ${ip}\n**Metric :** ping\n**Value :** have ${res.min}, ${res.max}\n**Treshold:** min=${min}, max=${max}`
                                        }).then(() => {
                                            console.log("Discord webhook ok");
                                        }).catch((err) => {
                                            console.error("error discord webhook", err.message);
                                        });
                                    }
                                })
                            }
                            
                            
                        });

                    } else {
                        console.log(`${ip} dont respond`);
                        const alert_sql = `SELECT * FROM alerts WHERE subscriber_ip = ? AND metric_type = ?;`
                        connection.query(alert_sql, [ip, "ping"], (err, results) => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            if(results == undefined || results.length == 0) return;
                            console.log("alert: ", results);
                            let action_type = JSON.parse(results[0]["action_type"]);
                            if(action_type == undefined) return;
                            action_type.forEach((action, index) => {
                                console.log(action);
                                if(action.includes("@")){
                                    const mailOptions = {
                                      from: process.env.EMAIL_FROM,
                                      to: action,
                                      subject: 'System alert',
                                      text: `Warning, this is an system alert. More infos: ping on ${ip} dont respond`
                                    };
                                    transporter.sendMail(mailOptions, (error, info) => {
                                      if (error) {
                                        return console.error('Error email send :', error);
                                      }
                                      console.log('Email sended :', info.response);
                                    });
                                }else if (action.includes("discord.com")) {
                                    axios.post(action, {
                                        username: "System alert",
                                        content: `🚨 **Alert**\n**Subscriber :** ${ip}\n**Metric :** ping\n**Value :** dont respond\n**Treshold:** min=${results[0].min_value}, max=${results[0].max_value}`
                                    }).then(() => {
                                        console.log("Discord webhook ok");
                                    }).catch((err) => {
                                        console.error("error discord webhook", err.message);
                                    });
                                }
                            })
                            
                        });
                    }
                }).catch(err => {
                    console.error("Erreur ping :", err);
                });
            }
        })
    });
}


setInterval(() => {
    task_monitoring();
}, 10000) // change to 300000


app.listen(port, () => {
    console.log("Listening on port: ", port);
})

