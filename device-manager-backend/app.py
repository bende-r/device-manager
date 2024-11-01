from flask import Flask, jsonify, request, render_template
import requests
import threading
import socket
import json
import logging
from server import DiscoveryServer

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class FlaskDiscoveryServer:
    def __init__(self, flask_port=5001, discovery_port=5000):
        self.app = Flask(__name__)
        self.devices = []
        self.discovery_server = DiscoveryServer(broadcast_port=discovery_port)
        self.flask_port = flask_port
        self.setup_routes()

    def setup_routes(self):
        @self.app.before_request
        def initial_discovery():
            self.update_devices()

        @self.app.route('/')
        def home():
            return render_template('index.html')

        @self.app.route('/discover', methods=['GET'])
        def trigger_discovery():
            self.update_devices()
            return jsonify({"devices": self.devices})

        @self.app.route('/devices', methods=['GET'])
        def get_devices():
            all_devices_data = []
            for device in self.devices:
                logger.debug(f"Requesting data from device: {device}")
                try:
                    response = requests.get(f"http://{device['ip']}:{device['port']}/")
                    response.raise_for_status()
                    all_devices_data.append(response.json())
                except requests.exceptions.RequestException as e:
                    logger.error(f"Error requesting device data: {e}")
                    return jsonify({"error": str(e)}), 500
            return jsonify(all_devices_data), 200

        @self.app.route('/devices/<mac>', methods=['GET'])
        def get_device(mac):
            device = next((d for d in self.devices if d.get('mac') == mac), None)
            if not device:
                return jsonify({"error": "Device not found"}), 404

            try:
                response = requests.get(f"http://{device['ip']}:{device['port']}/devices/{mac}")
                response.raise_for_status()
                return jsonify(response.json()), 200
            except requests.exceptions.RequestException as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route('/scan', methods=['GET'])
        def scan_devices():
            scanned_devices = []
            for device in self.devices:
                try:
                    response = requests.get(f"http://{device['ip']}:{device['port']}/scan")
                    response.raise_for_status()
                    scanned_devices.extend(response.json())
                except requests.exceptions.RequestException as e:
                    return jsonify({"error": str(e)}), 500
            return jsonify(scanned_devices), 200

        @self.app.route('/add_device', methods=['POST'])
        def add_device():
            mac = request.form.get("mac")
            if not mac:
                return jsonify({"error": "MAC address is required"}), 400

            added_devices = []
            for device in self.devices:
                try:
                    response = requests.post(
                        f"http://{device['ip']}:{device['port']}/devices",
                        params={"mac": mac}
                    )
                    response.raise_for_status()
                    added_devices.append(response.json())
                except requests.exceptions.RequestException as e:
                    return jsonify({"error": str(e)}), 500
            return jsonify(added_devices), 201

        @self.app.route('/devices/<mac>/statistics', methods=['GET'])
        def get_device_statistics(mac):
            device = next((d for d in self.devices if d.get('mac') == mac), None)
            if not device:
                return jsonify({"error": "Device not found"}), 404

            try:
                response = requests.get(
                    f"http://{device['ip']}:{device['port']}/devices/{mac}/statistics"
                )
                response.raise_for_status()
                return jsonify(response.json()), 200
            except requests.exceptions.RequestException as e:
                return jsonify({"error": str(e)}), 500

    def update_devices(self):
        """Обновляет список устройств из сервера обнаружения"""
        active_clients = self.discovery_server.get_active_clients()
        current_ips = {device['ip'] for device in self.devices}

        # Добавляем новые устройства
        for client_ip in active_clients:
            if client_ip not in current_ips:
                self.devices.append({
                    'ip': client_ip,
                    'port': 5000,  # Предполагаемый порт клиента
                    'mac': None  # MAC-адрес можно получить при первом подключении
                })
                logger.info(f"New device discovered: {client_ip}")

        # Удаляем отключенные устройства
        self.devices = [device for device in self.devices
                        if device['ip'] in active_clients]

    def start(self):
        """Запускает сервер обнаружения и Flask-приложение"""
        try:
            # Запускаем сервер обнаружения
            if not self.discovery_server.start():
                logger.error("Failed to start discovery server")
                return False

            # Запускаем периодическое обновление списка устройств
            def update_loop():
                while True:
                    self.update_devices()
                    threading.Event().wait(10)  # Обновляем каждые 10 секунд

            update_thread = threading.Thread(target=update_loop)
            update_thread.daemon = True
            update_thread.start()

            # Запускаем Flask-приложение
            self.app.run(host="0.0.0.0", port=self.flask_port)
            return True

        except Exception as e:
            logger.error(f"Error starting server: {e}")
            return False

    def stop(self):
        """Останавливает сервер"""
        try:
            self.discovery_server.stop()
        except Exception as e:
            logger.error(f"Error stopping server: {e}")


def main():
    server = FlaskDiscoveryServer(flask_port=5001, discovery_port=5000)
    try:
        server.start()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        server.stop()
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        server.stop()


if __name__ == "__main__":
    main()

# from flask import Flask, jsonify, request, render_template
# import requests

# app = Flask(__name__)

# # IP-адрес и порт Одноплатника (измените на ваш актуальный IP)
# ODINPLATNIK_BASE_URL = "http://192.168.1.8:5000"

# @app.route('/')
# def home():
#     return render_template('index.html')

# @app.route('/devices', methods=['GET'])
# def get_devices():
#     try:
#         response = requests.get(f"{ODINPLATNIK_BASE_URL}/")
#         response.raise_for_status()
#         return jsonify(response.json()), 200
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/devices/<mac>', methods=['GET'])
# def get_device(mac):
#     try:
#         response = requests.get(f"{ODINPLATNIK_BASE_URL}/devices/{mac}")
#         response.raise_for_status()
#         return jsonify(response.json()), 200
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/scan', methods=['GET'])
# def scan_devices():
#     try:
#         response = requests.get(f"{ODINPLATNIK_BASE_URL}/scan")
#         response.raise_for_status()
#         return jsonify(response.json()), 200
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/add_device', methods=['POST'])
# def add_device():
#     mac = request.form.get("mac")
#     if not mac:
#         return jsonify({"error": "MAC address is required"}), 400
#     try:
#         response = requests.post(f"{ODINPLATNIK_BASE_URL}/devices", params={"mac": mac})
#         response.raise_for_status()
#         return jsonify(response.json()), 201
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": str(e)}), 500

# @app.route('/devices/<mac>/statistics', methods=['GET'])
# def get_device_statistics(mac):
#     try:
#         response = requests.get(f"{ODINPLATNIK_BASE_URL}/devices/{mac}/statistics")
#         response.raise_for_status()
#         return jsonify(response.json()), 200
#     except requests.exceptions.RequestException as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5001)
