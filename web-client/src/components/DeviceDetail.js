import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/css/DeviceDetail.css";

const DeviceDetail = () => {
  const { ip } = useParams(); // Получение IP устройства из маршрута
  const navigate = useNavigate(); // Navigation hook for page redirection
  const [sensors, setSensors] = useState([]); // Датчики устройства
  const [scannedDevices, setScannedDevices] = useState([]); // Список отсканированных устройств
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false); // Индикатор сканирования

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      try {
        const response = await axios.get(`http://${ip}:5000/`);
        setSensors(response.data); // Обновляем список датчиков
      } catch (error) {
        console.error("Ошибка при загрузке данных устройства:", error);
      }
    };

    fetchDeviceDetails();
    setLoading(false); // Сбрасываем начальную загрузку

    // Устанавливаем интервал для периодического обновления
    const intervalId = setInterval(fetchDeviceDetails, 20000); // Обновление каждые 20 секунд
    return () => clearInterval(intervalId); // Очистка интервала при размонтировании компонента
  }, [ip]);

  const handleScan = async () => {
    setScanning(true);
    try {
      // Запрос на сканирование устройств
      const response = await axios.get(`http://${ip}:5000/scan`);
      setScannedDevices(response.data); // Ожидаем список отсканированных устройств
    } catch (error) {
      console.error("Ошибка при сканировании устройств:", error);
    } finally {
      setScanning(false);
    }
  };

  const handleAddDevice = async (mac) => {
    try {
      // Запрос на добавление устройства
      const response = await axios.post(`http://${ip}:5000/devices`, null, {
        params: { mac },
      });
      alert(`Датчик ${mac} успешно добавлен!`);
      // Обновляем список датчиков
      setSensors((prevSensors) => [...prevSensors, response.data]);
    } catch (error) {
      console.error("Ошибка при добавлении устройства:", error);
      alert(`Ошибка при добавлении датчика ${mac}.`);
    }
  };

  const navigateToGraph = (mac) => {
    navigate(`/device/${ip}/sensor/${mac}`);
  };

  return (
    <div className="device-detail-container">
      <h2 className="device-detail-title">Детали устройства: {ip}</h2>
      {loading ? (
        <p className="loading-text">Загрузка...</p>
      ) : sensors.length === 0 ? (
        <p className="no-sensors-text">Нет подключенных датчиков.</p>
      ) : (
        <div className="sensor-grid">
          {sensors.map((sensor, index) => (
            <div
              key={index}
              className={`sensor-card ${
                sensor.is_online ? "" : "offline-sensor"
              }`}
            >
              <h3>Датчик</h3>
              {!sensor.is_online && (
                <p className="offline-warning">
                  <strong>Последние показания</strong>
                </p>
              )}
              <ul className="sensor-details">
                <li>
                  <strong>MAC:</strong> {sensor.mac || "--"}
                </li>
                <li className="highlight">
                  <strong>Температура:</strong> {sensor.avg_temperature || "--"}
                  °C
                </li>
                <li className="highlight">
                  <strong>Влажность:</strong> {sensor.avg_humidity || "--"}%
                </li>
                <li>
                  <strong>Батарея:</strong> {sensor.avg_battery || "--"}%
                </li>
                <li>
                  <strong>Статус:</strong>{" "}
                  {sensor.is_online ? "В сети" : "Не в сети"}
                </li>
              </ul>
              <button
                onClick={() => navigateToGraph(sensor.mac)}
                className="fetch-stats-button"
              >
                Показать график
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="scan-controls">
        <button onClick={handleScan} disabled={scanning}>
          {scanning ? "Сканирование..." : "Сканировать датчики"}
        </button>
      </div>

      {scannedDevices.length > 0 && (
        <div className="scanned-devices">
          <h3>Отсканированные устройства</h3>
          <div className="sensor-grid">
            {scannedDevices.map((device, index) => (
              <div key={index} className="sensor-card">
                <p>
                  <strong>MAC:</strong> {device.mac || "--"}
                </p>
                <p>
                  <strong>RSSI:</strong> {device.RSSI || "--"}
                </p>
                {!sensors.some((sensor) => sensor.mac === device.mac) && (
                  <button onClick={() => handleAddDevice(device.mac)}>
                    Добавить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
