import React, { useState } from "react";
import axios from "axios";

const ScanDevices = () => {
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5001/scan");
      setScanResults(response.data);
    } catch (error) {
      console.error("Ошибка при сканировании:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Сканирование устройств</h2>
      <button onClick={handleScan} disabled={loading}>
        {loading ? "Сканирование..." : "Начать сканирование"}
      </button>
      <ul>
        {scanResults.map((device, index) => (
          <li key={index}>
            <strong>MAC:</strong> {device.mac || "N/A"}, <strong>IP:</strong>{" "}
            {device.ip || "N/A"}, <strong>RSSI:</strong> {device.RSSI || "N/A"},{" "}
            <strong>Тип:</strong> {device.type || "N/A"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScanDevices;
