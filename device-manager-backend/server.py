import socket
import json
import threading
from datetime import datetime

class DiscoveryServer:
    def __init__(self, broadcast_port=5000, tcp_port=5001):
        self.broadcast_port = broadcast_port
        self.tcp_port = tcp_port
        self.clients = {}

    def start(self):
        udp_thread = threading.Thread(target=self._run_udp_discovery)
        udp_thread.daemon = True
        udp_thread.start()

        tcp_thread = threading.Thread(target=self._run_tcp_server)
        tcp_thread.daemon = True
        tcp_thread.start()

        udp_thread.join()
        tcp_thread.join()

    def _run_udp_discovery(self):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as s:
            s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)  # Установка TTL для multicast
            while True:
                message = json.dumps({
                    "type": "discovery",
                    "tcp_port": self.tcp_port
                }).encode()
                s.sendto(message, ('224.0.0.1', self.broadcast_port))  # Отправка на multicast-адрес
                print("Sent discovery multicast")
                threading.Event().wait(5)

    def _run_tcp_server(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', self.tcp_port))
            s.listen()

            while True:
                conn, addr = s.accept()
                with conn:
                    data = conn.recv(1024).decode()
                    if data == "register":
                        self.clients[addr[0]] = datetime.now()
                        print("Registered client: {}".format(addr[0]))
                        conn.send("OK".encode())

    def get_active_clients(self):
        return list(self.clients.keys())

if __name__ == "__main__":
    server = DiscoveryServer()
    server.start()
