import React, { useState } from "react";
import axios from "axios";
import { discoverServer } from "./serverDiscovery"; // Импорт функции обнаружения сервера

const ScanDevices = () => {
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState(null); // Состояние для хранения информации о сервере
  const [error, setError] = useState(null); // Состояние для обработки ошибок

  const handleScan = async () => {
    setLoading(true);
    setError(null);

    try {
      // Автоматическое определение сервера
      const server = await discoverServer();
      setServerInfo(server);

      // Выполнение сканирования с использованием найденного сервера
      const response = await axios.get(
        `http://${server.ip}:${server.port}/scan`
      );
      setScanResults(response.data);
    } catch (err) {
      console.error("Ошибка при сканировании или обнаружении сервера:", err);
      setError("Не удалось обнаружить сервер или выполнить сканирование.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Сканирование устройств</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {serverInfo ? (
        <p>
          Обнаружен сервер:{" "}
          <strong>
            {serverInfo.ip}:{serverInfo.port}
          </strong>
        </p>
      ) : (
        <p>Сервер не обнаружен. Нажмите "Начать сканирование" для поиска.</p>
      )}
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
