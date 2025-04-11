// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Web3Provider } from "./contexts/Web3Context";

// Components
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
// import PatientDashboard from "./components/PatientDashboard";
// import DoctorDashboard from "./components/DoctorDashboard";
import Register from "./components/Register";
import AddRecord from "./components/AddRecord";
import RegisterDoctor from "./components/RegisterDoctor";
import AiConsultation from "./components/AiConsultantation";
import PatientRecordsViewer from "./components/PatientRecordsViewer";
// import ViewRecord from "./components/ViewRecord";
// import AIAssistant from "./components/AIAssistant";

function App() {
  return (
    <Web3Provider>
      <Router>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register-doctor" element={<RegisterDoctor />} />
          <Route path="/register" element={<Register />} />
          <Route path="/add-record" element={<AddRecord />} />
          <Route path="/records" element={<PatientRecordsViewer />} />
          {/* <Route
                  path="/patient-dashboard"
                  element={<PatientDashboard />}
                />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/view-record/:id" element={<ViewRecord />} />*/}
          <Route path="/ai-assistant" element={<AiConsultation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;
