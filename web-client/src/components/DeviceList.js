import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../static/css/DeviceList.css";

const DeviceList = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverIp, setServerIp] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Загружаем конфигурацию и получаем IP-адрес сервера
    const fetchConfigAndDevices = async () => {
      setLoading(true);
      try {
        const config = await import("../config.json");
        console.log(config.serverIp);
        setServerIp(config.serverIp);

        // Выполняем запрос к серверу
        const response = await axios.get(`http://${serverIp}/devices`);
        setDevices(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке устройств или конфигурации:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigAndDevices();
    const intervalId = setInterval(fetchConfigAndDevices, 20000); // Обновление каждые 20 секунд
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
                    <div key={sensorIndex} className={`sensor-card`}>
                      <h4>Датчик</h4>
                      <ul className="sensor-details">
                        <li>
                          <strong>MAC:</strong> {sensor.mac || "--"}
                        </li>
                        <li className="highlight">
                          <strong>Температура:</strong>{" "}
                          {sensor.avg_temperature || "--"}°C
                        </li>
                        <li className="highlight">
                          <strong>Влажность:</strong>{" "}
                          {sensor.avg_humidity || "--"}%
                        </li>
                        <li>
                          <strong>Батарея:</strong> {sensor.avg_battery || "--"}
                          %
                        </li>
                        <li>
                          <strong>Статус:</strong>{" "}
                          {sensor.is_online ? "В сети" : "Не в сети"}
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
