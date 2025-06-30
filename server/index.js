const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = "8000"
const nodemailer = require('nodemailer');
const axios = require('axios');
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

function checkAlert(suscriber_id, constant){
    let requestsql = `SELECT * FROM alerts WHERE subscriber_id = ?`;

    connection.query(requestsql, [suscriber_id], (err, results) => {
        if (results && results.length > 0) {
            results.forEach((alert) => {
                if (alert.status === 'enable') {
                    const metricValue = constant[alert.metric_type];
                    if (typeof metricValue !== 'undefined') {
                        if (
                            (alert.max_value !== null && metricValue > alert.max_value) ||
                            (alert.min_value !== null && metricValue < alert.min_value)
                        ) {
                            console.log(
                            `Alert for ${alert.metric_type} on subscriber ${suscriber_id}: value = ${metricValue}`
                            );
                            let action_type = JSON.parse(alert.action_type);
                            action_type.forEach(element => {
                                if(element.contains("@")){
                                    const mailOptions = {
                                      from: process.env.EMAIL_FROM,
                                      to: element,
                                      subject: 'System alert',
                                      text: `Warning, this is an system alert. More infos: ${alert.metric_type} on ${suscriber_id} value = ${metricValue} `
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
                                        content: `🚨 **Alert**\n**Subscriber :** ${subscriber_id}\n**Metric :** ${alert.metric_type}\n**Value :** ${metricValue}\n**Treshold:** min=${alert.min_value}, max=${alert.max_value}`
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



app.listen(port, () => {
    console.log("Listening on port: ", port);
})

