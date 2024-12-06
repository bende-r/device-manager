import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DeviceList from "./components/DeviceList";
import DeviceDetail from "./components/DeviceDetail";
import "./App.css";

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
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;

// import React from "react";
// import DeviceList from "./components/DeviceList";
// import ScanDevices from "./components/ScanDevices";
// import "./App.css";

// const App = () => {
//   return (
//     <div className="App">
//       <main>
//         <DeviceList />
//         <ScanDevices />
//       </main>
//     </div>
//   );
// };

// export default App;
