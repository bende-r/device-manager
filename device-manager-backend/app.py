from flask import Flask, jsonify, request, render_template
import requests
import socket
import json

app = Flask(__name__)

# Global list to store discovered devices
devices = []

# Discovery function to scan for devices
def discover_devices():
    global devices
    devices = []  # Reset the list of devices on each discovery
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.settimeout(2)
    
    # Send discovery message
    message = "DISCOVER_DEVICES"
    sock.sendto(message.encode(), ("<broadcast>", 5002))

    try:
        while True:
            data, addr = sock.recvfrom(1024)
            device_info = json.loads(data.decode())
            device_info['ip'] = addr[0]  # Add the IP address of the device
            devices.append(device_info)
    except socket.timeout:
        pass  # Discovery ends after the timeout

# Trigger discovery on app startup
@app.before_first_request
def initial_discovery():
    discover_devices()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/discover', methods=['GET'])
def trigger_discovery():
    discover_devices()
    return jsonify({"devices": devices})

@app.route('/devices', methods=['GET'])
def get_devices():
    all_devices_data = []
    for device in devices:
        try:
            response = requests.get(f"http://{device['ip']}:{device['port']}/")
            response.raise_for_status()
            all_devices_data.append(response.json())
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500
    return jsonify(all_devices_data), 200

@app.route('/devices/<mac>', methods=['GET'])
def get_device(mac):
    device = next((d for d in devices if d['mac'] == mac), None)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    
    try:
        response = requests.get(f"http://{device['ip']}:{device['port']}/devices/{mac}")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scan', methods=['GET'])
def scan_devices():
    scanned_devices = []
    for device in devices:
        try:
            response = requests.get(f"http://{device['ip']}:{device['port']}/scan")
            response.raise_for_status()
            scanned_devices.extend(response.json())  # Append results from each device
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500
    return jsonify(scanned_devices), 200

@app.route('/add_device', methods=['POST'])
def add_device():
    mac = request.form.get("mac")
    if not mac:
        return jsonify({"error": "MAC address is required"}), 400

    added_devices = []
    for device in devices:
        try:
            response = requests.post(f"http://{device['ip']}:{device['port']}/devices", params={"mac": mac})
            response.raise_for_status()
            added_devices.append(response.json())
        except requests.exceptions.RequestException as e:
            return jsonify({"error": str(e)}), 500
    return jsonify(added_devices), 201

@app.route('/devices/<mac>/statistics', methods=['GET'])
def get_device_statistics(mac):
    device = next((d for d in devices if d['mac'] == mac), None)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    
    try:
        response = requests.get(f"http://{device['ip']}:{device['port']}/devices/{mac}/statistics")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)












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
