import React, { useEffect, useState } from "react";
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
import { format } from "date-fns";
import "../static/css/DeviceGraph.css";

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const DeviceGraph = () => {
  const { ip, mac } = useParams(); // Retrieve IP and MAC from route parameters
  const [chartData, setChartData] = useState(null); // Chart data
  const [startDate, setStartDate] = useState(""); // Start date filter
  const [endDate, setEndDate] = useState(""); // End date filter

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await axios.get(
          `http://${ip}:5000/devices/${mac}/statistics`,
          { params }
        );

        const stats = response.data;

        const formattedStats = [];
        for (let i = 0; i < stats.length; i++) {
          const currentEntry = stats[i];
          const nextEntry = stats[i + 1];

          formattedStats.push(currentEntry);

          if (nextEntry) {
            const currentTime = new Date(currentEntry.timestamp);
            const nextTime = new Date(nextEntry.timestamp);

            // Check if the time difference exceeds 1 hour
            if ((nextTime - currentTime) / (1000 * 60 * 60) > 1) {
              formattedStats.push({
                timestamp: nextTime.toISOString(),
                temperature: null,
                humidity: null,
              });
            }
          }
        }

        const labels = formattedStats.map((entry) =>
          format(new Date(entry.timestamp), "dd-MM-yyyy HH:mm")
        );
        const temperatures = formattedStats.map((entry) => entry.temperature);
        const humidity = formattedStats.map((entry) => entry.humidity);

        setChartData({
          labels,
          datasets: [
            {
              label: "Температура (°C)",
              data: temperatures,
              fill: false,
              borderColor: "rgba(75,192,192,1)",
              tension: 0.4,
            },
            {
              label: "Влажность (%)",
              data: humidity,
              fill: false,
              borderColor: "rgba(255,99,132,1)",
              tension: 0.4,
            },
          ],
        });
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };

    fetchStatistics();
  }, [ip, mac, startDate, endDate]);

  return (
    <div className="graph-page-container">
      <h2>График температуры и влажности для датчика {mac}</h2>
      <div className="date-filters">
        <label>
          Начальная дата:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          Конечная дата:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>
      {chartData ? (
        <div className="chart-container">
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: {
                    font: {
                      size: 16,
                      weight: "bold",
                    },
                    color: "#333",
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      return `${context.dataset.label}: ${context.raw.toFixed(
                        2
                      )}`;
                    },
                  },
                  titleFont: {
                    size: 14,
                    weight: "bold",
                  },
                  bodyFont: {
                    size: 14,
                  },
                  backgroundColor: "rgba(0,0,0,0.8)",
                },
                zoom: {
                  pan: {
                    enabled: true,
                    mode: "x", // Allow horizontal panning
                  },
                  zoom: {
                    wheel: {
                      enabled: true,
                    },
                    pinch: {
                      enabled: true,
                    },
                    mode: "x", // Zoom only on the x-axis
                  },
                },
              },
              scales: {
                x: {
                  ticks: {
                    callback: function (value, index, ticks) {
                      // Show every 5th tick for better readability
                      return index % 5 === 0
                        ? this.getLabelForValue(value)
                        : "";
                    },
                    font: {
                      size: 12,
                    },
                    color: "#666",
                  },
                  title: {
                    display: true,
                    text: "Дата и время",
                    font: {
                      size: 14,
                      weight: "bold",
                    },
                    color: "#333",
                  },
                },
                y: {
                  ticks: {
                    font: {
                      size: 14,
                    },
                    color: "#666",
                  },
                  title: {
                    display: true,
                    text: "Значения",
                    font: {
                      size: 16,
                      weight: "bold",
                    },
                    color: "#333",
                  },
                },
              },
              elements: {
                line: {
                  tension: 0.4,
                },
                point: {
                  radius: 3,
                  borderWidth: 1,
                },
              },
            }}
          />
        </div>
      ) : (
        <p>Загрузка данных...</p>
      )}
    </div>
  );
};

export default DeviceGraph;
