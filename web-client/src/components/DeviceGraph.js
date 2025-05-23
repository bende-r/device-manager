import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { format, subDays } from "date-fns";
import "../static/css/DeviceGraph.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
);

const DeviceGraph = () => {
  const { ip, mac } = useParams();
  const [chartData, setChartData] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const defaultEndDate = new Date();
    const defaultStartDate = subDays(defaultEndDate, 7);
    setStartDate(format(defaultStartDate, "yyyy-MM-dd"));
    setEndDate(format(defaultEndDate, "yyyy-MM-dd"));
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axios.get(
        `http://${ip}:5000/devices/${mac}/statistics`,
        { params },
      );

      const statsData = response.data;
      setStats(calculateStatistics(statsData));

      const formattedStats = formatChartData(statsData);
      const labels = formattedStats.map((entry) =>
        format(new Date(entry.timestamp), "dd.MM.yyyy HH:mm"),
      );

      setChartData({
        labels,
        datasets: [
          {
            label: "Температура (°C)",
            data: formattedStats.map((entry) => entry.temperature),
            borderColor: "#3a86ff",
            backgroundColor: "rgba(58, 134, 255, 0.1)",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
          },
          {
            label: "Влажность (%)",
            data: formattedStats.map((entry) => entry.humidity),
            borderColor: "#ff006e",
            backgroundColor: "rgba(255, 0, 110, 0.1)",
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 3,
          },
        ],
      });
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Не удалось загрузить данные. Проверьте подключение.");
    } finally {
      setLoading(false);
    }
  }, [ip, mac, startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [fetchStatistics, startDate, endDate]);

  const formatChartData = (data) => {
    const formatted = [];
    for (let i = 0; i < data.length; i++) {
      const current = data[i];
      const next = data[i + 1];
      formatted.push(current);

      if (next) {
        const currentTime = new Date(current.timestamp);
        const nextTime = new Date(next.timestamp);
        if ((nextTime - currentTime) / (1000 * 60 * 60) > 1) {
          formatted.push({
            timestamp: nextTime.toISOString(),
            temperature: null,
            humidity: null,
          });
        }
      }
    }
    return formatted;
  };

  const calculateStatistics = (data) => {
    if (!data || data.length === 0) return null;

    const tempValues = data.map((d) => d.temperature).filter((v) => v !== null);
    const humValues = data.map((d) => d.humidity).filter((v) => v !== null);

    if (tempValues.length === 0 || humValues.length === 0) return null;

    return {
      temperature: {
        avg: tempValues.reduce((a, b) => a + b, 0) / tempValues.length,
        min: Math.min(...tempValues),
        max: Math.max(...tempValues),
      },
      humidity: {
        avg: humValues.reduce((a, b) => a + b, 0) / humValues.length,
        min: Math.min(...humValues),
        max: Math.max(...humValues),
      },
      period: {
        start: format(new Date(data[0].timestamp), "dd.MM.yyyy HH:mm"),
        end: format(
          new Date(data[data.length - 1].timestamp),
          "dd.MM.yyyy HH:mm",
        ),
      },
    };
  };

  const resetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  const chartRef = React.useRef();

  return (
    <div className="graph-page-container">
      <div className="graph-header">
        <h2>График датчика {mac}</h2>
        <div className="device-info">
          <span>Шлюз: {ip}</span>
        </div>
      </div>

      <div className="controls-section">
        <div className="date-filters">
          <div className="filter-group">
            <label htmlFor="start-date">Начальная дата:</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="end-date">Конечная дата:</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <button
            onClick={resetZoom}
            className="reset-zoom-btn"
            disabled={!chartData}
          >
            Сбросить масштаб
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchStatistics}>Повторить попытку</button>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          {stats && (
            <div className="stats-section">
              <h3>Статистика за период</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Температура (°C)</h4>
                  <div className="stat-row">
                    <span>Средняя:</span>
                    <span>{stats.temperature.avg.toFixed(1)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Минимальная:</span>
                    <span>{stats.temperature.min.toFixed(1)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Максимальная:</span>
                    <span>{stats.temperature.max.toFixed(1)}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Влажность (%)</h4>
                  <div className="stat-row">
                    <span>Средняя:</span>
                    <span>{stats.humidity.avg.toFixed(1)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Минимальная:</span>
                    <span>{stats.humidity.min.toFixed(1)}</span>
                  </div>
                  <div className="stat-row">
                    <span>Максимальная:</span>
                    <span>{stats.humidity.max.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="chart-section">
            {chartData ? (
              <Line
                ref={chartRef}
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        font: {
                          size: 14,
                          weight: "bold",
                        },
                        padding: 20,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      callbacks: {
                        label: (context) => {
                          let label = context.dataset.label || "";
                          if (label) label += ": ";
                          if (context.raw !== null) {
                            label += Number(context.raw).toFixed(1);
                          } else {
                            label += "нет данных";
                          }
                          return label;
                        },
                      },
                    },
                    zoom: {
                      zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: "x",
                      },
                      pan: {
                        enabled: true,
                        mode: "x",
                      },
                      limits: {
                        x: { min: "original", max: "original" },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 10,
                      },
                    },
                    y: {
                      grid: { color: "#f0f0f0" },
                      ticks: { precision: 1 },
                    },
                  },
                  interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                  },
                }}
              />
            ) : (
              <p className="no-data-message">Нет данных для отображения</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceGraph;
