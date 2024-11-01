const DISCOVERY_PORT = 5005;
let BACKEND_URL = "";

// Функция для поиска сервера
function discoverServer() {
  const socket = new WebSocket(`ws://255.255.255.255:${DISCOVERY_PORT}/`);

  // Отправляем сообщение для обнаружения сервера
  socket.onopen = () => {
    socket.send("DISCOVER_SERVER");
  };

  // Получаем ответ от сервера с его IP и портом
  socket.onmessage = (event) => {
    const serverInfo = JSON.parse(event.data);
    BACKEND_URL = `http://${serverInfo.ip}:${serverInfo.port}`;
    initializeApp(); // Запускаем приложение после установки BACKEND_URL
  };

  socket.onerror = (error) => {
    console.error("Ошибка при обнаружении сервера:", error);
  };
}

// Инициализация приложения
function initializeApp() {
  $(document).ready(function () {
    // Discover devices
    $("#discoverButton").click(function () {
      $.get(`${BACKEND_URL}/discover`, function (data) {
        $("#discoveredDevicesList").empty();
        data.devices.forEach(function (device) {
          $("#discoveredDevicesList").append(
            `<li>MAC: ${device.mac}, IP: ${device.ip}, Type: ${device.type}</li>`
          );
        });
      }).fail(function () {
        $("#message").text("Error discovering devices.");
      });
    });

    // Scan all discovered devices
    $("#scanButton").click(function () {
      $.get(`${BACKEND_URL}/scan`, function (data) {
        $("#deviceList").empty();
        data.forEach(function (device) {
          $("#deviceList").append(
            `<li>MAC: ${device.mac}, RSSI: ${device.RSSI}, Type: ${device.type}</li>`
          );
        });
      }).fail(function () {
        $("#message").text("Error scanning devices.");
      });
    });

    // Add new device
    $("#addDeviceForm").submit(function (e) {
      e.preventDefault();
      let mac = $("#mac").val();
      $.post(`${BACKEND_URL}/add_device`, { mac: mac }, function () {
        $("#message").text("Device added.");
        $("#mac").val("");
      }).fail(function () {
        $("#message").text("Error adding device.");
      });
    });

    // Get all devices
    $("#getDevicesButton").click(function () {
      $.get(`${BACKEND_URL}/devices`, function (data) {
        $("#allDevicesList").empty();
        data.forEach(function (device) {
          $("#allDevicesList").append(
            `<li>MAC: ${device.mac}, Temperature: ${device.avg_temperature}, Humidity: ${device.avg_humidity}, Battery: ${device.avg_battery}, Online: ${device.is_online}</li>`
          );
        });
      }).fail(function () {
        $("#message").text("Error retrieving devices.");
      });
    });

    // Запускаем обновление данных в реальном времени
    startRealTimeUpdates();
  });
}

// Функция для обновления данных с датчиков в реальном времени
function startRealTimeUpdates() {
  setInterval(() => {
    $.get(`${BACKEND_URL}/devices`, function (devices) {
      devices.forEach((device) => {
        $.get(
          `${BACKEND_URL}/devices/${device.mac}/statistics`,
          function (statistics) {
            const latestStat = statistics[statistics.length - 1]; // Последняя запись
            if (latestStat) {
              const deviceElementId = `#device-stats-${device.mac.replace(
                /:/g,
                "-"
              )}`;
              if (!$(deviceElementId).length) {
                $("#realTimeData").append(
                  `<div id="device-stats-${device.mac.replace(/:/g, "-")}">
                   <h3>Device MAC: ${device.mac}</h3>
                   <p>Temperature: <span class="temperature">${
                     latestStat.temperature
                   }</span></p>
                   <p>Humidity: <span class="humidity">${
                     latestStat.humidity
                   }</span></p>
                   <p>Battery: <span class="battery">${
                     latestStat.battery
                   }</span></p>
                 </div>`
                );
              } else {
                $(deviceElementId)
                  .find(".temperature")
                  .text(latestStat.temperature);
                $(deviceElementId).find(".humidity").text(latestStat.humidity);
                $(deviceElementId).find(".battery").text(latestStat.battery);
              }
            }
          }
        );
      });
    }).fail(function () {
      $("#message").text("Error retrieving real-time data.");
    });
  }, 5000); // Обновление каждые 5 секунд
}

// Запуск поиска сервера при загрузке страницы
discoverServer();

// //const BACKEND_URL = "http://<backend_ip>:<backend_port>"; // Replace with actual IP and port

// const DISCOVERY_PORT = 5005;
// let BACKEND_URL = "";

// // Функция для поиска сервера
// function discoverServer() {
//   const socket = new WebSocket(`ws://255.255.255.255:${DISCOVERY_PORT}/`);

//   // Отправляем сообщение для обнаружения сервера
//   socket.onopen = () => {
//     socket.send("DISCOVER_SERVER");
//   };

//   // Получаем ответ от сервера с его IP и портом
//   socket.onmessage = (event) => {
//     const serverInfo = JSON.parse(event.data);
//     BACKEND_URL = `http://${serverInfo.ip}:${serverInfo.port}`;
//     initializeApp(); // Запускаем приложение после установки BACKEND_URL
//   };

//   socket.onerror = (error) => {
//     console.error("Ошибка при обнаружении сервера:", error);
//   };
// }

// // Инициализация приложения
// function initializeApp() {
//   $(document).ready(function () {
//     // Discover devices
//     $("#discoverButton").click(function () {
//       $.get(`${BACKEND_URL}/discover`, function (data) {
//         $("#discoveredDevicesList").empty();
//         data.devices.forEach(function (device) {
//           $("#discoveredDevicesList").append(
//             `<li>MAC: ${device.mac}, IP: ${device.ip}, Type: ${device.type}</li>`
//           );
//         });
//       }).fail(function () {
//         $("#message").text("Error discovering devices.");
//       });
//     });

//     // Scan all discovered devices
//     $("#scanButton").click(function () {
//       $.get(`${BACKEND_URL}/scan`, function (data) {
//         $("#deviceList").empty();
//         data.forEach(function (device) {
//           $("#deviceList").append(
//             `<li>MAC: ${device.mac}, RSSI: ${device.RSSI}, Type: ${device.type}</li>`
//           );
//         });
//       }).fail(function () {
//         $("#message").text("Error scanning devices.");
//       });
//     });

//     // Add new device
//     $("#addDeviceForm").submit(function (e) {
//       e.preventDefault();
//       let mac = $("#mac").val();
//       $.post(`${BACKEND_URL}/add_device`, { mac: mac }, function () {
//         $("#message").text("Device added.");
//         $("#mac").val("");
//       }).fail(function () {
//         $("#message").text("Error adding device.");
//       });
//     });

//     // Get all devices
//     $("#getDevicesButton").click(function () {
//       $.get(`${BACKEND_URL}/devices`, function (data) {
//         $("#allDevicesList").empty();
//         data.forEach(function (device) {
//           $("#allDevicesList").append(
//             `<li>MAC: ${device.mac}, Temperature: ${device.avg_temperature}, Humidity: ${device.avg_humidity}, Battery: ${device.avg_battery}, Online: ${device.is_online}</li>`
//           );
//         });
//       }).fail(function () {
//         $("#message").text("Error retrieving devices.");
//       });
//     });

//     // Get device statistics
//     $("#getStatisticsForm").submit(function (e) {
//       e.preventDefault();
//       let mac = $("#macStats").val();
//       $.get(`${BACKEND_URL}/devices/${mac}/statistics`, function (data) {
//         $("#statisticsList").empty();
//         data.forEach(function (stat) {
//           $("#statisticsList").append(
//             `<li>Timestamp: ${stat.timestamp}, Temperature: ${stat.temperature}, Humidity: ${stat.humidity}, Battery: ${stat.battery}</li>`
//           );
//         });
//       }).fail(function () {
//         $("#message").text("Error retrieving statistics.");
//       });
//     });
//   });
// }
