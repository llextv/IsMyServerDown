import psutil
import requests
import json
from datetime import datetime
import platform
import socket

server_url = "http://127.0.0.1:8000"
pc_type = ""
os = platform.system()
local_id = None

def declare_to_server():
    global local_id
    hostname = socket.gethostname()
    ip_locale = socket.gethostbyname(hostname)
    pc_id = platform.node() + datetime.now().isoformat()
    declare_params = {"id": pc_id, "name": platform.node(), "ip": ip_locale, "os": os, "type": pc_type}
    response = requests.post(server_url + "/api/register", json=declare_params)
    print(response)
    if response.status_code == 200 :
        print("Success")
    elif response.status_code == 409:
        print("Already declared")
        local_id = response.json().get("id")
    elif response.status_code == 404:
        print("404 error: ", response)
    else:
        print(response)



def send_constant():
    hostname = socket.gethostname()
    ip_locale = socket.gethostbyname(hostname)
    cpu_usage = psutil.cpu_percent(interval=1)
    cpu_logical_cores = psutil.cpu_count(logical=True)
    cpu_physical_cores = psutil.cpu_count(logical=False)

    mem = psutil.virtual_memory()
    ram_total = mem.total / (1024**3)
    ram_used = mem.used / (1024**3)
    ram_available = mem.available / (1024**3)
    ram_usage = mem.percent

    disk = psutil.disk_usage('/')
    disk_total = disk.total / (1024**3)
    disk_used = disk.used / (1024**3)
    disk_free = disk.free / (1024**3)
    disk_usage = disk.percent

    net_io = psutil.net_io_counters()
    net_sent = net_io.bytes_sent / (1024**2)
    net_received = net_io.bytes_recv / (1024**2)

    
    params_req = {
        "cpu_usage": cpu_usage,
        "cpu_logical_cores": cpu_logical_cores,
        "cpu_physical_cores": cpu_physical_cores,
        "ram_total": ram_total,
        "ram_used": ram_used,
        "ram_available": ram_available,
        "ram_usage": ram_usage,
        "disk_total": disk_total,
        "disk_used": disk_used,
        "disk_free": disk_free,
        "disk_usage": disk_usage,
        "net_sent": net_sent,
        "net_received": net_received,
        "ip": ip_locale
    }
    response = requests.post(server_url + "/api/constant", json=params_req)

    if response.status_code == 200 :
        print("Constant sended")
    elif response.status_code == 404:
        print("404 Error: ", response)
    else:
        print(response)
    
declare_to_server()
print(local_id)
send_constant()