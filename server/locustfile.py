from locust import HttpUser, task, between
import random

class DiscoveryServerUser(HttpUser):
    wait_time = between(1, 3)  # Пауза между запросами
    
    def on_start(self):
        """Инициализация тестового пользователя"""
        # Сохраняем тестовый MAC-адрес для использования в запросах
        self.test_mac = "4c:65:a8:da:a3:46"
        
    @task(3)
    def get_devices(self):
        """Получение списка всех устройств"""
        self.client.get("/devices")
    
    @task(2)
    def trigger_discovery(self):
        """Запуск обнаружения устройств"""
        self.client.get("/discover")
    
    @task(2)
    def get_device_info(self):
        """Получение информации о конкретном устройстве"""
        self.client.get(f"/devices/{self.test_mac}")
    
    @task(1)
    def get_device_statistics(self):
        """Получение статистики устройства"""
        self.client.get(f"/devices/{self.test_mac}/statistics")
    
    @task(1)
    def scan_devices(self):
        """Сканирование устройств"""
        self.client.get("/scan")
    
    # @task(1)
    # def add_device(self):
    #     """Добавление нового устройства"""
    #     # Генерируем случайный MAC-адрес
    #     random_mac = ':'.join(['%02x'%random.randint(0, 255) for _ in range(6)])
    #     self.client.post("/add_device", data={"mac": random_mac})



# import socket
# import threading
# import time
# import random
# import argparse
# from concurrent.futures import ThreadPoolExecutor
# import statistics

# class LoadTestClient:
#     def __init__(self, broadcast_port=5000, server_ip='127.0.0.1'):
#         self.broadcast_port = broadcast_port
#         self.server_ip = server_ip
#         self.tcp_port = None
#         self.connection_time = None
        
#     def connect_to_server(self):
#         start_time = time.time()
#         try:
#             # Получаем TCP порт через broadcast
#             with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
#                 s.bind(('', self.broadcast_port))
#                 data, _ = s.recvfrom(1024)
#                 self.tcp_port = eval(data.decode())['tcp_port']

#             # Подключаемся через TCP
#             with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
#                 s.connect((self.server_ip, self.tcp_port))
#                 s.send("register".encode())
#                 response = s.recv(1024).decode()
#                 if response == "OK":
#                     self.connection_time = time.time() - start_time
#                     return True
#         except Exception as e:
#             print(f"Connection error: {e}")
#             return False

# class LoadTester:
#     def __init__(self, num_clients, ramp_up_time, test_duration):
#         self.num_clients = num_clients
#         self.ramp_up_time = ramp_up_time
#         self.test_duration = test_duration
#         self.connection_times = []
#         self.successful_connections = 0
#         self.failed_connections = 0
#         self._lock = threading.Lock()

#     def run_client(self):
#         client = LoadTestClient()
#         if client.connect_to_server():
#             with self._lock:
#                 self.successful_connections += 1
#                 if client.connection_time:
#                     self.connection_times.append(client.connection_time)
#         else:
#             with self._lock:
#                 self.failed_connections += 1

#     def run_test(self):
#         print(f"Starting load test with {self.num_clients} clients")
#         print(f"Ramp up time: {self.ramp_up_time} seconds")
#         print(f"Test duration: {self.test_duration} seconds")

#         start_time = time.time()
        
#         # Создаем пул потоков для клиентов
#         with ThreadPoolExecutor(max_workers=self.num_clients) as executor:
#             # Запускаем клиентов с учетом времени разгона
#             delay_between_clients = self.ramp_up_time / self.num_clients
            
#             futures = []
#             for i in range(self.num_clients):
#                 futures.append(executor.submit(self.run_client))
#                 time.sleep(delay_between_clients)

#             # Ждем завершения теста
#             time.sleep(self.test_duration)

#         # Собираем статистику
#         test_duration = time.time() - start_time
        
#         self._print_results(test_duration)

#     def _print_results(self, test_duration):
#         print("\nTest Results:")
#         print("-" * 50)
#         print(f"Total test duration: {test_duration:.2f} seconds")
#         print(f"Successful connections: {self.successful_connections}")
#         print(f"Failed connections: {self.failed_connections}")
        
#         if self.connection_times:
#             print(f"\nConnection Time Statistics:")
#             print(f"Average: {statistics.mean(self.connection_times):.3f} seconds")
#             print(f"Median: {statistics.median(self.connection_times):.3f} seconds")
#             print(f"Min: {min(self.connection_times):.3f} seconds")
#             print(f"Max: {max(self.connection_times):.3f} seconds")
#             if len(self.connection_times) > 1:
#                 print(f"Standard deviation: {statistics.stdev(self.connection_times):.3f}")
        
#         print(f"\nThroughput: {self.successful_connections / test_duration:.2f} connections/second")

# if __name__ == "__main__":
#     parser = argparse.ArgumentParser(description='Load Test for Discovery Server')
#     parser.add_argument('--clients', type=int, default=100, help='Number of clients to simulate')
#     parser.add_argument('--ramp-up', type=int, default=30, help='Ramp up time in seconds')
#     parser.add_argument('--duration', type=int, default=60, help='Test duration in seconds')
    
#     args = parser.parse_args()
    
#     tester = LoadTester(args.clients, args.ramp_up, args.duration)
#     tester.run_test()