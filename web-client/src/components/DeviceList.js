import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../static/css/DeviceList.css";
import GreenhouseMapper from "./GreenhouseMapper";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverIp, setServerIp] = useState("");
  const [activeTab, setActiveTab] = useState("devices");
  const navigate = useNavigate();

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const serverIp = process.env.REACT_APP_SERVER_IP;
      setServerIp(serverIp);

      const response = await axios.get(`http://${serverIp}/devices`);
      setDevices(response.data);
      setError(null);
    } catch (err) {
      console.error("Ошибка при загрузке устройств:", err);
      setError("Не удалось загрузить список устройств");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "devices") {
      fetchDevices();
      const intervalId = setInterval(fetchDevices, 20000);
      return () => clearInterval(intervalId);
    }
  }, [fetchDevices, activeTab]);

  const handleCardClick = (ip) => {
    navigate(`/device/${ip}`);
  };

  const groupDevicesByIp = (devices) => {
    return devices.reduce((acc, device) => {
      if (!acc[device.ip]) acc[device.ip] = [];
      acc[device.ip].push(device);
      return acc;
    }, {});
  };

  const renderSensorCard = (sensor) => (
    <div key={sensor.mac} className="sensor-card">
      <h4>Датчик {sensor.mac?.slice(-5) || "N/A"}</h4>
      <ul className="sensor-details">
        <li>
          <strong>MAC:</strong> <span>{sensor.mac || "--"}</span>
        </li>
        <li className="highlight">
          <strong>Температура:</strong>
          <span>
            {sensor.avg_temperature != null
              ? `${sensor.avg_temperature}°C`
              : "--"}
          </span>
        </li>
        <li className="highlight">
          <strong>Влажность:</strong>
          <span>
            {sensor.avg_humidity != null ? `${sensor.avg_humidity}%` : "--"}
          </span>
        </li>
        <li>
          <strong>Батарея:</strong>
          <span>
            {sensor.avg_battery != null ? `${sensor.avg_battery}%` : "--"}
          </span>
        </li>
        <li>
          <strong>Статус:</strong>
          <span
            className={sensor.is_online ? "status-online" : "status-offline"}
          >
            {sensor.is_online ? "В сети" : "Не в сети"}
          </span>
        </li>
      </ul>
    </div>
  );

  const groupedDevices = groupDevicesByIp(devices);
  const hasValidDevices = Object.keys(groupedDevices).length > 0;

  return (
    <div className="device-list-container">
      {activeTab === "devices" ? (
        <>
          <h2>Список устройств</h2>
          {serverIp && (
            <p className="server-info">Подключено к серверу: {serverIp}</p>
          )}

          {loading ? (
            <p className="loading-message">Загрузка устройств...</p>
          ) : error ? (
            <div className="empty-message">
              <p>{error}</p>
              <button onClick={fetchDevices} className="refresh-button">
                Повторить попытку
              </button>
            </div>
          ) : !hasValidDevices ? (
            <p className="empty-message">Нет доступных устройств с датчиками</p>
          ) : (
            <div className="device-grid">
              {Object.entries(groupedDevices).map(([ip, deviceGroup]) => {
                const sensors = deviceGroup.filter(
                  (device) => device.mac && device.avg_temperature != null,
                );

                if (sensors.length === 0) return null;

                return (
                  <div key={ip} className="device-card">
                    <div
                      className="device-header"
                      onClick={() => handleCardClick(ip)}
                    >
                      <h3>Шлюз: {ip}</h3>
                      <div className="device-meta">
                        <span>Датчиков: {sensors.length}</span>
                        <span>
                          Последнее обновление:{" "}
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="sensors-grid">
                      {sensors.map(renderSensorCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && hasValidDevices && (
            <button
              onClick={fetchDevices}
              className="refresh-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span> Обновление...
                </>
              ) : (
                "Обновить данные"
              )}
            </button>
          )}
        </>
      ) : (
        <GreenhouseMapper devices={devices} />
      )}
    </div>
  );
};

export default DeviceList;
