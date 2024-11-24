from flask import Flask, jsonify, request, render_template
import requests

app = Flask(__name__)

# IP-адрес и порт Одноплатника (измените на ваш актуальный IP)
ODINPLATNIK_BASE_URL = "http://192.168.1.8:5000"

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/devices', methods=['GET'])
def get_devices():
    try:
        response = requests.get(f"{ODINPLATNIK_BASE_URL}/")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/devices/<mac>', methods=['GET'])
def get_device(mac):
    try:
        response = requests.get(f"{ODINPLATNIK_BASE_URL}/devices/{mac}")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scan', methods=['GET'])
def scan_devices():
    try:
        response = requests.get(f"{ODINPLATNIK_BASE_URL}/scan")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_device', methods=['POST'])
def add_device():
    mac = request.form.get("mac")
    if not mac:
        return jsonify({"error": "MAC address is required"}), 400
    try:
        response = requests.post(f"{ODINPLATNIK_BASE_URL}/devices", params={"mac": mac})
        response.raise_for_status()
        return jsonify(response.json()), 201
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

@app.route('/devices/<mac>/statistics', methods=['GET'])
def get_device_statistics(mac):
    try:
        response = requests.get(f"{ODINPLATNIK_BASE_URL}/devices/{mac}/statistics")
        response.raise_for_status()
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)