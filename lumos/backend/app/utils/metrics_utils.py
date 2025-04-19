import psutil
import time
from collections import deque
from threading import Lock

latencies = deque(maxlen=100)
latencies_lock = Lock()
start_time = time.time()

def record_latency(latency: float):
    with latencies_lock:
        latencies.append(latency)

def get_metrics():
    with latencies_lock:
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        recent_latencies = list(latencies)
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory_percent = psutil.virtual_memory().percent
    uptime = time.time() - start_time
    return {
        "average_latency": avg_latency,
        "cpu_percent": cpu_percent,
        "memory_percent": memory_percent,
        "uptime": uptime,
        "latencies": recent_latencies
    }