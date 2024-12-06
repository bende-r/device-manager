import socket
import threading
import json
from datetime import datetime

class DiscoveryServer:
    def __init__(self, broadcast_port=5000, tcp_port=5001):
        self.broadcast_port = broadcast_port
        self.tcp_port = tcp_port
        self.clients = {}
        self.running = False  # Флаг для управления состоянием сервера

    def start(self):
        self.running = True

        # Запускаем UDP и TCP серверы в отдельных потоках
        self.udp_thread = threading.Thread(target=self._run_udp_discovery)
        self.udp_thread.daemon = True
        self.udp_thread.start()

        self.tcp_thread = threading.Thread(target=self._run_tcp_server)
        self.tcp_thread.daemon = True
        self.tcp_thread.start()

    def _run_udp_discovery(self):
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            s.bind(('', 0))

            while self.running:
                message = json.dumps({
                    "type": "discovery",
                    "tcp_port": self.tcp_port
                }).encode()
                s.sendto(message, ('192.168.1.255', self.broadcast_port))
                print("Sent discovery broadcast")
                threading.Event().wait(5)

    def _run_tcp_server(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', self.tcp_port))
            s.listen()

            while self.running:
                try:
                    conn, addr = s.accept()
                    with conn:
                        data = conn.recv(1024).decode()
                        if data == "register":
                            self.clients[addr[0]] = datetime.now()
                            print("Registered client: {}".format(addr[0]))
                            conn.send("OK".encode())
                except socket.error:
                    break  # Закрываем сокет и выходим из цикла при остановке сервера

    def stop(self):
        """Останавливает сервер, завершает потоки UDP и TCP."""
        self.running = False
        # Закрываем сокеты, чтобы прервать блокировку accept
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect(('localhost', self.tcp_port))
            s.close()
        print("Discovery server stopped")

    def get_active_clients(self):
        return list(self.clients.keys())

if __name__ == "__main__":
    server = DiscoveryServer()
    try:
        server.start()
    except KeyboardInterrupt:
        print("Shutting down Discovery Server...")
        server.stop()