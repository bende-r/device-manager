import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Helmet } from "react-helmet";
import { FiArrowLeft } from "react-icons/fi";
import { FiMap } from "react-icons/fi";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";
import DeviceGraph from "./components/DeviceGraph";
import WeatherWidget from "./components/WeatherWidget";
import GreenhouseMapper from "./components/GreenhouseMapper";
import "./static/css/App.css";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackButton = location.pathname !== "/";

  return (
    <header className="App-header">
      <div className="header-content">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="global-back-button"
            aria-label="Назад"
          >
            <FiArrowLeft size={24} />
          </button>
        )}

        {location.pathname === "/" && (
          <button
            onClick={() => navigate("/greenhouse-map")}
            className="map-link-button"
            aria-label="Карта теплицы"
          >
            <FiMap size={24} />
            <span className="map-link-text">Карта теплицы</span>
          </button>
        )}
      </div>
    </header>
  );
};

const App = () => {
  return (
    <Router>
      <div className="App">
        <Helmet>
          <title>Управление устройствами | Мониторинг</title>
          <meta
            name="description"
            content="Система мониторинга устройств и погоды"
          />
          <link rel="icon" href="/favicon.ico" />
        </Helmet>

        <AppHeader />

        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/greenhouse-map" element={<GreenhouseMapper />} />
              <Route path="/" element={<DeviceList />} />
              <Route path="/device/:ip" element={<DeviceDetail />} />
              <Route path="/device/:ip/sensor/:mac" element={<DeviceGraph />} />
            </Routes>
          </main>

          <aside className="sidebar">
            <WeatherWidget />
          </aside>
        </div>
      </div>
    </Router>
  );
};

export default App;
