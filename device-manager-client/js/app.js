const BACKEND_URL = "http://<backend_ip>:<backend_port>"; // Replace with actual IP and port

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

  // Get device statistics
  $("#getStatisticsForm").submit(function (e) {
    e.preventDefault();
    let mac = $("#macStats").val();
    $.get(`${BACKEND_URL}/devices/${mac}/statistics`, function (data) {
      $("#statisticsList").empty();
      data.forEach(function (stat) {
        $("#statisticsList").append(
          `<li>Timestamp: ${stat.timestamp}, Temperature: ${stat.temperature}, Humidity: ${stat.humidity}, Battery: ${stat.battery}</li>`
        );
      });
    }).fail(function () {
      $("#message").text("Error retrieving statistics.");
    });
  });
});
