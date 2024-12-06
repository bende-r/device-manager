import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://127.0.0.1:5001/devices");
        setDevices(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке устройств:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const intervalId = setInterval(fetchDevices, 20000); // Обновление каждые 20 секунд
    return () => clearInterval(intervalId); // Очистка интервала
  }, []);

  const handleCardClick = (ip) => {
    navigate(`/device/${ip}`);
  };

  // Группировка устройств по IP
  const groupedDevices = devices.reduce((acc, device) => {
    if (!acc[device.ip]) {
      acc[device.ip] = [];
    }
    acc[device.ip].push(device);
    return acc;
  }, {});

  return (
    <div>
      <h2>Список устройств</h2>
      {Object.keys(groupedDevices).length === 0 && !loading ? (
        <p>Нет доступных устройств.</p>
      ) : (
        <div className="device-grid">
          {Object.keys(groupedDevices).map((ip, index) => {
            const sensors = groupedDevices[ip].filter(
              (sensor) => sensor.mac && sensor.avg_temperature != null
            ); // Учитываем только устройства с валидными датчиками

            return (
              <div key={index} className="device-container">
                <div
                  className="device-header"
                  onClick={() => handleCardClick(ip)}
                  style={{ cursor: "pointer" }}
                >
                  <h3>IP Устройства: {ip}</h3>
                  <p>
                    <strong>Количество датчиков:</strong> {sensors.length}
                  </p>
                </div>
                <div className="sensors-grid">
                  {sensors.map((sensor, sensorIndex) => (
                    <div
                      key={sensorIndex}
                      className={`sensor-card ${
                        sensor.is_online ? "" : "offline-sensor"
                      }`}
                    >
                      <h4>Датчик</h4>
                      <p>
                        <strong>MAC:</strong> {sensor.mac || "--"}
                      </p>
                      <p>
                        <strong>Температура:</strong>{" "}
                        {sensor.avg_temperature || "--"}°C
                      </p>
                      <p>
                        <strong>Влажность:</strong>{" "}
                        {sensor.avg_humidity || "--"}%
                      </p>
                      <p>
                        <strong>Батарея:</strong> {sensor.avg_battery || "--"}%
                      </p>
                      <p>
                        <strong>Статус:</strong>{" "}
                        {sensor.is_online ? "В сети" : "Не в сети"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {loading && <p>Обновление данных...</p>}
    </div>
  );
};

export default DeviceList;
