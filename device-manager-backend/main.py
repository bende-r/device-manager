from server import DiscoveryServer

server = DiscoveryServer()
server.start()

# Чтобы получить список клиентов в любой момент:
clients = server.get_active_clients()
print(f"Connected clients: {clients}")