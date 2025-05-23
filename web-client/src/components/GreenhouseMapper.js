import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  Container,
  ContextMenu,
  ContextMenuItem,
  Toolbar,
  ScaleControl,
  SaveStatus,
  CanvasContainer,
  Canvas,
  ModalOverlay,
  Modal,
  ValidationError,
  ButtonGroup,
  ListsContainer,
  BedsList,
  BedItem,
  DevicesList,
  DeviceItem,
  DeviceLink,
} from "../styles/GreenhouseMapper.styles";

const GreenhouseMapper = ({ devices: initialDevices = [] }) => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [beds, setBeds] = useState([]);
  const [devices, setDevices] = useState(initialDevices);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [scale, setScale] = useState(1);
  const [selectedBed, setSelectedBed] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceForm, setDeviceForm] = useState({
    ip: "",
    mac: "",
    gatewayIp: "",
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [currentBed, setCurrentBed] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });

  const bedColors = [
    "#A5D6A7",
    "#81C784",
    "#66BB6A",
    "#4CAF50",
    "#43A047",
    "#388E3C",
    "#2E7D32",
    "#1B5E20",
  ];

  const saveData = useCallback((bedsData, devicesData) => {
    const saveTime = new Date();
    localStorage.setItem("greenhouseBeds", JSON.stringify(bedsData));
    localStorage.setItem("greenhouseDevices", JSON.stringify(devicesData));
    localStorage.setItem("greenhouseLastSaved", saveTime.toISOString());
    setLastSaved(saveTime);
    setAutoSaveStatus(`Сохранено: ${saveTime.toLocaleTimeString()}`);
    setTimeout(() => setAutoSaveStatus(""), 3000);
  }, []);

  const debouncedSave = useCallback(
    debounce((bedsData, devicesData) => {
      saveData(bedsData, devicesData);
    }, 1500),
    []
  );

  useEffect(() => {
    const savedBeds = localStorage.getItem("greenhouseBeds");
    const savedDevices = localStorage.getItem("greenhouseDevices");
    const savedTime = localStorage.getItem("greenhouseLastSaved");

    if (savedBeds) setBeds(JSON.parse(savedBeds));
    if (savedDevices) setDevices(JSON.parse(savedDevices));
    if (savedTime) setLastSaved(new Date(savedTime));
  }, []);

  useEffect(() => {
    debouncedSave(beds, devices);
    return () => debouncedSave.cancel();
  }, [beds, devices, debouncedSave]);

  const findItemAtPosition = (x, y) => {
    const device = devices.find((device) => {
      if (device.type === "gateway") {
        return Math.abs(device.x - x) <= 15 && Math.abs(device.y - y) <= 15;
      } else {
        return (
          Math.sqrt(Math.pow(device.x - x, 2) + Math.pow(device.y - y, 2)) <= 10
        );
      }
    });

    if (device) return { type: "device", data: device };

    const bedIndex = beds.findIndex(
      (bed) =>
        x >= bed.x &&
        x <= bed.x + bed.width &&
        y >= bed.y &&
        y <= bed.y + bed.height
    );

    if (bedIndex !== -1)
      return { type: "bed", data: beds[bedIndex], index: bedIndex };

    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    beds.forEach((bed, index) => {
      ctx.fillStyle = bedColors[index % bedColors.length];
      ctx.fillRect(bed.x, bed.y, bed.width, bed.height);
      ctx.strokeStyle = "#2E7D32";
      ctx.lineWidth = 2;
      ctx.strokeRect(bed.x, bed.y, bed.width, bed.height);
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`Грядка ${index + 1}`, bed.x + 10, bed.y + 20);
    });

    devices.forEach((device) => {
      if (device.type === "gateway") {
        ctx.fillStyle = device.realIp ? "#3498db" : "#9e9e9e";
        ctx.fillRect(device.x - 15, device.y - 15, 30, 30);
        ctx.fillStyle = "#fff";
        ctx.font = "10px Arial";
        ctx.fillText(
          device.realIp ? device.ip.split(".").pop() : "?",
          device.x - 5,
          device.y + 5
        );
      } else {
        ctx.fillStyle = device.realMac ? "#e74c3c" : "#9e9e9e";
        ctx.beginPath();
        ctx.arc(device.x, device.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "8px Arial";
        ctx.fillText(
          device.realMac ? device.mac.slice(-4) : "?",
          device.x - 8,
          device.y + 3
        );
      }
    });

    if (isDrawing && currentBed) {
      ctx.fillStyle = "#E8F5E9";
      ctx.fillRect(
        currentBed.x,
        currentBed.y,
        currentBed.width,
        currentBed.height
      );
      ctx.strokeStyle = "#2E7D32";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentBed.x,
        currentBed.y,
        currentBed.width,
        currentBed.height
      );
    }
  }, [beds, devices, isDrawing, currentBed]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const item = findItemAtPosition(x, y);
    if (item) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        item,
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const deleteItem = (item) => {
    if (!item) return;

    if (item.type === "bed") {
      const newBeds = beds.filter((_, i) => i !== item.index);
      setBeds(newBeds);
      saveData(newBeds, devices);
    } else if (item.type === "device") {
      const newDevices = devices.filter((d) => d.id !== item.data.id);
      setDevices(newDevices);
      saveData(beds, newDevices);
    }
  };

  const deleteDeviceFromList = (deviceId) => {
    const newDevices = devices.filter((d) => d.id !== deviceId);
    setDevices(newDevices);
    saveData(beds, newDevices);
  };

  const deleteBedFromList = (bedIndex) => {
    const newBeds = beds.filter((_, i) => i !== bedIndex);
    setBeds(newBeds);
    saveData(newBeds, devices);
  };

  const startDrawing = (e) => {
    if (currentTool !== null || e.button !== 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setIsDrawing(true);
    setCurrentBed({ x, y, width: 0, height: 0 });
  };

  const drawBed = (e) => {
    if (!isDrawing || !currentBed) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setCurrentBed({
      ...currentBed,
      width: x - currentBed.x,
      height: y - currentBed.y,
    });
  };

  const endDrawing = () => {
    if (!isDrawing || !currentBed) return;
    if (Math.abs(currentBed.width) > 20 && Math.abs(currentBed.height) > 20) {
      const newBed = {
        ...currentBed,
        width: Math.abs(currentBed.width),
        height: Math.abs(currentBed.height),
        x:
          currentBed.width < 0 ? currentBed.x + currentBed.width : currentBed.x,
        y:
          currentBed.height < 0
            ? currentBed.y + currentBed.height
            : currentBed.y,
      };
      const newBeds = [...beds, newBed];
      setBeds(newBeds);
      saveData(newBeds, devices);
    }
    setIsDrawing(false);
    setCurrentBed(null);
  };

  const handleCanvasClick = (e) => {
    if (e.button !== 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const clickedDevice = devices.find((device) => {
      if (device.type === "gateway") {
        return Math.abs(device.x - x) <= 15 && Math.abs(device.y - y) <= 15;
      } else {
        return (
          Math.sqrt(Math.pow(device.x - x, 2) + Math.pow(device.y - y, 2)) <= 10
        );
      }
    });

    if (clickedDevice) {
      if (clickedDevice.type === "gateway" && clickedDevice.realIp) {
        navigate(`/device/${clickedDevice.ip}`);
      } else if (clickedDevice.type === "sensor" && clickedDevice.realMac) {
        navigate(
          `/device/${clickedDevice.gatewayIp}/sensor/${clickedDevice.mac}`
        );
      } else {
        setEditingDevice(clickedDevice);
        setDeviceForm({
          ip: clickedDevice.ip || "",
          mac: clickedDevice.mac || "",
          gatewayIp: clickedDevice.gatewayIp || "",
        });
      }
      return;
    }

    if (currentTool === "gateway" || currentTool === "sensor") {
      const newDevice = {
        id: Date.now(),
        type: currentTool,
        x,
        y,
        ip: "",
        mac: "",
        gatewayIp: "",
        realIp: false,
        realMac: false,
      };
      const newDevices = [...devices, newDevice];
      setDevices(newDevices);
      setEditingDevice(newDevice);
      setDeviceForm({ ip: "", mac: "", gatewayIp: "" });
      saveData(beds, newDevices);
    }
  };

  const saveDeviceData = () => {
    const updatedDevices = devices.map((device) => {
      if (device.id === editingDevice.id) {
        return {
          ...device,
          ip: deviceForm.ip,
          mac: deviceForm.mac,
          gatewayIp: deviceForm.gatewayIp,
          realIp: device.type === "gateway" && validateIp(deviceForm.ip),
          realMac: device.type === "sensor" && validateMac(deviceForm.mac),
        };
      }
      return device;
    });
    setDevices(updatedDevices);
    setEditingDevice(null);
    saveData(beds, updatedDevices);
  };

  const validateIp = (ip) => /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  const validateMac = (mac) =>
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);

  const clearAllData = () => {
    if (window.confirm("Вы уверены, что хотите удалить все данные?")) {
      setBeds([]);
      setDevices([]);
      localStorage.removeItem("greenhouseBeds");
      localStorage.removeItem("greenhouseDevices");
      localStorage.removeItem("greenhouseLastSaved");
      setLastSaved(null);
      setAutoSaveStatus("Все данные очищены");
      setTimeout(() => setAutoSaveStatus(""), 3000);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu();
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <Container onClick={closeContextMenu}>
      <Toolbar>
        <button
          className={currentTool === "gateway" ? "active" : ""}
          onClick={() => setCurrentTool("gateway")}
        >
          Добавить шлюз
        </button>
        <button
          className={currentTool === "sensor" ? "active" : ""}
          onClick={() => setCurrentTool("sensor")}
        >
          Добавить датчик
        </button>
        <button
          className={!currentTool ? "active" : ""}
          onClick={() => setCurrentTool(null)}
        >
          Рисовать грядки
        </button>
        <button onClick={clearAllData}>Очистить всё</button>
        <ScaleControl>
          <span>Масштаб: </span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
          />
        </ScaleControl>
        <SaveStatus>
          {autoSaveStatus ||
            (lastSaved &&
              `Последнее сохранение: ${lastSaved.toLocaleTimeString()}`)}
        </SaveStatus>
      </Toolbar>

      <CanvasContainer>
        <Canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseDown={startDrawing}
          onMouseMove={drawBed}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onContextMenu={handleContextMenu}
          style={{ transform: `scale(${scale})` }}
        />
      </CanvasContainer>

      {contextMenu.visible && (
        <ContextMenu
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <ContextMenuItem onClick={() => deleteItem(contextMenu.item)}>
            Удалить
          </ContextMenuItem>
          {contextMenu.item.type === "device" && (
            <ContextMenuItem
              onClick={() => {
                setEditingDevice(contextMenu.item.data);
                setDeviceForm({
                  ip: contextMenu.item.data.ip || "",
                  mac: contextMenu.item.data.mac || "",
                  gatewayIp: contextMenu.item.data.gatewayIp || "",
                });
                closeContextMenu();
              }}
            >
              Редактировать
            </ContextMenuItem>
          )}
        </ContextMenu>
      )}

      {editingDevice && (
        <ModalOverlay>
          <Modal>
            <h3>
              {editingDevice.type === "gateway"
                ? "Настройка шлюза"
                : "Настройка датчика"}
            </h3>

            {editingDevice.type === "gateway" ? (
              <>
                <label>
                  IP адрес:
                  <input
                    type="text"
                    value={deviceForm.ip}
                    onChange={(e) =>
                      setDeviceForm({ ...deviceForm, ip: e.target.value })
                    }
                    placeholder="192.168.1.1"
                  />
                  {!validateIp(deviceForm.ip) && deviceForm.ip && (
                    <ValidationError>Неверный формат IP</ValidationError>
                  )}
                </label>
              </>
            ) : (
              <>
                <label>
                  MAC адрес:
                  <input
                    type="text"
                    value={deviceForm.mac}
                    onChange={(e) =>
                      setDeviceForm({ ...deviceForm, mac: e.target.value })
                    }
                    placeholder="AA:BB:CC:DD:EE:FF"
                  />
                  {!validateMac(deviceForm.mac) && deviceForm.mac && (
                    <ValidationError>Неверный формат MAC</ValidationError>
                  )}
                </label>
                <label>
                  Шлюз (IP):
                  <input
                    type="text"
                    value={deviceForm.gatewayIp}
                    onChange={(e) =>
                      setDeviceForm({
                        ...deviceForm,
                        gatewayIp: e.target.value,
                      })
                    }
                    placeholder="192.168.1.1"
                  />
                  {!validateIp(deviceForm.gatewayIp) &&
                    deviceForm.gatewayIp && (
                      <ValidationError>Неверный формат IP</ValidationError>
                    )}
                </label>
              </>
            )}

            <ButtonGroup>
              <button
                onClick={saveDeviceData}
                disabled={
                  (editingDevice.type === "gateway" &&
                    !validateIp(deviceForm.ip)) ||
                  (editingDevice.type === "sensor" &&
                    (!validateMac(deviceForm.mac) ||
                      !validateIp(deviceForm.gatewayIp)))
                }
              >
                Сохранить
              </button>
              <button onClick={() => setEditingDevice(null)}>Отмена</button>
            </ButtonGroup>
          </Modal>
        </ModalOverlay>
      )}

      <ListsContainer>
        <BedsList>
          <h3>Грядки ({beds.length})</h3>
          <ul>
            {beds.map((bed, index) => (
              <BedItem
                key={index}
                onClick={() => setSelectedBed(index)}
                className={selectedBed === index ? "selected" : ""}
              >
                <span>Грядка {index + 1}</span>
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBedFromList(index);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </BedItem>
            ))}
          </ul>
        </BedsList>

        <DevicesList>
          <h3>Устройства ({devices.length})</h3>
          <ul>
            {devices.map((device) => (
              <DeviceItem key={device.id}>
                <div>
                  {device.type === "gateway" ? (
                    <>
                      <strong>Шлюз:</strong>{" "}
                      {device.realIp ? device.ip : "Не настроен"}
                      {device.realIp && (
                        <DeviceLink
                          onClick={() => navigate(`/device/${device.ip}`)}
                        >
                          (перейти)
                        </DeviceLink>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>Датчик:</strong>{" "}
                      {device.realMac ? device.mac : "Не настроен"}
                      {device.realMac && device.gatewayIp && (
                        <DeviceLink
                          onClick={() =>
                            navigate(
                              `/device/${device.gatewayIp}/sensor/${device.mac}`
                            )
                          }
                        >
                          (перейти)
                        </DeviceLink>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => {
                      setEditingDevice(device);
                      setDeviceForm({
                        ip: device.ip || "",
                        mac: device.mac || "",
                        gatewayIp: device.gatewayIp || "",
                      });
                    }}
                  >
                    Настроить
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteDeviceFromList(device.id);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </DeviceItem>
            ))}
          </ul>
        </DevicesList>
      </ListsContainer>
    </Container>
  );
};

export default GreenhouseMapper;
