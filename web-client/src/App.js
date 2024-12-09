import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";
import DeviceGraph from "./components/DeviceGraph";
import "./static/css/App.css";

const App = () => {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Управление устройствами</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<DeviceList />} />
            <Route path="/device/:ip" element={<DeviceDetail />} />
            <Route path="/device/:ip/sensor/:mac" element={<DeviceGraph />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
