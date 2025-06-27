import psutil

def declare_to_server():
    pass


# CPU
print(f"CPU Usage: {psutil.cpu_percent(interval=1)}%")
print(f"CPU Cores (logical): {psutil.cpu_count(logical=True)}")
print(f"CPU Cores (physical): {psutil.cpu_count(logical=False)}")

# RAM
mem = psutil.virtual_memory()
print(f"RAM Total: {mem.total / (1024**3):.2f} GB")
print(f"RAM Used: {mem.used / (1024**3):.2f} GB")
print(f"RAM Available: {mem.available / (1024**3):.2f} GB")
print(f"RAM Usage: {mem.percent}%")

# Stockage
disk = psutil.disk_usage('/')
print(f"Disk Total: {disk.total / (1024**3):.2f} GB")
print(f"Disk Used: {disk.used / (1024**3):.2f} GB")
print(f"Disk Free: {disk.free / (1024**3):.2f} GB")
print(f"Disk Usage: {disk.percent}%")

# Connexions réseau
net_io = psutil.net_io_counters()
print(f"Bytes Sent: {net_io.bytes_sent / (1024**2):.2f} MB")
print(f"Bytes Received: {net_io.bytes_recv / (1024**2):.2f} MB")



