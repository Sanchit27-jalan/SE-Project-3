import random
import string
import socket


def random_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]
    
def random_port():
    return random.randint(2000, 9000)

def random_name():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))