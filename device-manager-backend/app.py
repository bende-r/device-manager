from flask import Flask, jsonify, request, render_template
import requests
import threading
import socket
import json
import logging
import time
import signal
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
        self.running = True

    def setup_routes(self):
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
                    response = requests.get(f"http://{device['ip']}:5000/")
                    print(response.json())
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
                response = requests.get(f"http://{device['ip']}:5000/devices/{mac}")
                response.raise_for_status()
                return jsonify(response.json()), 200
            except requests.exceptions.RequestException as e:
                return jsonify({"error": str(e)}), 500

        @self.app.route('/scan', methods=['GET'])
        def scan_devices():
            scanned_devices = []
            for device in self.devices:
                try:
                    response = requests.get(f"http://{device['ip']}:5000/scan")
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
                        f"http://{device['ip']}:5000/devices",
                        params={"mac": mac}
                    )
                    response.raise_for_status()
                    added_devices.append(response.json())
                except requests.exceptions.RequestException as e:
                    return jsonify({"error": str(e)}), 500
            return jsonify(added_devices), 201

        @self.app.route('/devices/<mac>/statistics', methods=['GET'])
        def get_device_statistics(mac):
            print(  self.devices)
            device = next((d for d in self.devices if d.get('mac') == mac), None)
            print (device)
            if not device:
                return jsonify({"error": "Device not found"}), 404
            try:
                response = requests.get(
                    f"http://{device['ip']}:5000/devices/{mac}/statistics"
                )
                response.raise_for_status()
                return jsonify(response.json()), 200
            except requests.exceptions.RequestException as e:
                return jsonify({"error": str(e)}), 500


    def update_devices(self):
        active_clients = self.discovery_server.get_active_clients()
        current_ips = {device['ip'] for device in self.devices}

        for client_ip in active_clients:
            if client_ip not in current_ips:
                self.devices.append({
                    'ip': client_ip,
                    'port': 5000,
                    'mac' : None
                })
                logger.info(f"New device discovered: {client_ip}")

        self.devices = [device for device in self.devices if device['ip'] in active_clients]

    def start_discovery_server(self):
        discovery_thread = threading.Thread(target=self.discovery_server.start)
        discovery_thread.daemon = True
        discovery_thread.start()
        logger.info("Discovery server started in a separate thread")

    def start(self):
        try:
            self.start_discovery_server()

            def update_loop():
                while self.running:
                    self.update_devices()
                    time.sleep(10)

            update_thread = threading.Thread(target=update_loop)
            update_thread.daemon = True
            update_thread.start()

            self.app.run(host="127.0.0.1", port=self.flask_port)
            return True

        except Exception as e:
            logger.error(f"Error starting server: {e}")
            return False

    def stop(self):
        logger.info("Stopping FlaskDiscoveryServer...")
        self.running = False
        try:
            self.discovery_server.stop()
        except Exception as e:
            logger.error(f"Error stopping discovery server: {e}")

def main():
    server = FlaskDiscoveryServer(flask_port=5001, discovery_port=5000)

    def signal_handler(sig, frame):
        logger.info("Received signal to stop. Shutting down server...")
        server.stop()
        exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        server.start()
    except KeyboardInterrupt:
        logger.info("Shutting down server due to keyboard interrupt...")
        server.stop()
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        server.stop()

if __name__ == "__main__":
    main()