import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../static/css/DeviceDetail.css";

const DeviceDetail = () => {
  const { ip } = useParams();
  const navigate = useNavigate();
  const [sensors, setSensors] = useState([]);
  const [scannedDevices, setScannedDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  const fetchDeviceDetails = useCallback(async () => {
    try {
      const response = await axios.get(`http://${ip}:5000/`);
      setSensors(response.data);
      setError(null);
    } catch (err) {
      console.error("Ошибка при загрузке данных устройства:", err);
      setError("Не удалось загрузить данные устройства");
      setSensors([]);
    } finally {
      setLoading(false);
    }
  }, [ip]);

  useEffect(() => {
    fetchDeviceDetails();

    const intervalId = setInterval(fetchDeviceDetails, 20000);
    return () => clearInterval(intervalId);
  }, [fetchDeviceDetails]);

  const handleScan = async () => {
    setScanning(true);
    setScannedDevices([]);
    try {
      const response = await axios.get(`http://${ip}:5000/scan`);
      setScannedDevices(response.data);
    } catch (err) {
      console.error("Ошибка при сканировании устройств:", err);
      setError("Ошибка сканирования. Проверьте подключение.");
    } finally {
      setScanning(false);
    }
  };

  const handleAddDevice = async (mac) => {
    try {
      await axios.post(`http://${ip}:5000/devices`, null, { params: { mac } });
      alert(`Датчик ${mac} успешно запрошен к добавлению!`);
      await fetchDeviceDetails();
      setScannedDevices((prev) => prev.filter((d) => d.mac !== mac));
    } catch (err) {
      console.error("Ошибка при добавлении устройства:", err);
      alert(`Ошибка при добавлении датчика ${mac}`);
    }
  };

  const navigateToGraph = (mac) => {
    navigate(`/device/${ip}/sensor/${mac}`);
  };

  const renderSensorCard = (sensor, isScanned = false) => (
    <div
      key={sensor.mac || `sensor-${Date.now()}`}
      className={`sensor-card ${
        !isScanned && !sensor.is_online ? "offline-sensor" : ""
      }`}
    >
      <h3>
        {isScanned
          ? "Новый датчик"
          : `Датчик ${sensor.mac?.slice(-5) || "N/A"}`}
      </h3>

      {!isScanned && !sensor.is_online && (
        <p className="offline-warning">
          Датчик не в сети. Отображаются последние известные данные.
        </p>
      )}

      <ul className="sensor-details">
        <li>
          <strong>MAC:</strong> <span>{sensor.mac || "--"}</span>
        </li>

        {!isScanned && (
          <>
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
          </>
        )}

        {isScanned && sensor.RSSI && (
          <li>
            <strong>Сигнал (RSSI):</strong>
            <span>{sensor.RSSI} dBm</span>
          </li>
        )}

        {!isScanned && (
          <li>
            <strong>Статус:</strong>
            <span
              style={{
                color: sensor.is_online ? "#4cc9f0" : "#f72585",
                fontWeight: "bold",
              }}
            >
              {sensor.is_online ? "В сети" : "Не в сети"}
            </span>
          </li>
        )}
      </ul>

      {isScanned
        ? !sensors.some((s) => s.mac === sensor.mac) && (
            <button
              onClick={() => handleAddDevice(sensor.mac)}
              className="add-device-button"
            >
              Добавить датчик
            </button>
          )
        : sensor.mac && (
            <button
              onClick={() => navigateToGraph(sensor.mac)}
              className="fetch-stats-button"
              disabled={!sensor.is_online && !sensor.avg_temperature}
            >
              Показать график
            </button>
          )}
    </div>
  );

  return (
    <div className="device-detail-container">
      <h2 className="device-detail-title">Детали шлюза: {ip}</h2>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchDeviceDetails}>Повторить попытку</button>
        </div>
      )}

      {loading ? (
        <p className="loading-text">Загрузка датчиков...</p>
      ) : sensors.length === 0 ? (
        <p className="no-sensors-text">
          Нет подключенных датчиков к этому шлюзу.
        </p>
      ) : (
        <div className="sensor-grid">
          {sensors.map((sensor) => renderSensorCard(sensor))}
        </div>
      )}

      <div className="scan-controls">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="action-button"
        >
          {scanning ? (
            <>
              <span className="spinner"></span> Сканирование...
            </>
          ) : (
            "Сканировать новые датчики"
          )}
        </button>
      </div>

      {scannedDevices.length > 0 ? (
        <div className="scanned-devices">
          <h3>Найденные при сканировании устройства</h3>
          <div className="sensor-grid">
            {scannedDevices.map((device) => renderSensorCard(device, true))}
          </div>
        </div>
      ) : (
        !scanning && (
          <p className="no-sensors-text">
            Нет новых устройств, доступных для добавления поблизости от шлюза.
          </p>
        )
      )}
    </div>
  );
};

export default DeviceDetail;
