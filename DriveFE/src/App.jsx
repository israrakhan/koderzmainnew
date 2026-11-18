import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/Auth/LoginPage";
import Register from "./components/Auth/Register";
import ResetPassword from "./components/Auth/ResetPassword";
import HomePage from "./components/Dashboard/HomePage";
import UploadPage from "./components/Dashboard/UploadPage";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import MyFiles from "./components/Dashboard/MyFiles";
import Layout from "./components/Layout/Layout";

import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import './styles/animations.css';
import './styles/App.css';
import './styles/NewModal.css';
// Import all rounded regular icons
import '@flaticon/flaticon-uicons/css/regular/rounded.css';


import PrivateRoutes from "./components/Auth/PrivateRoutes";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<PrivateRoutes />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/myfiles" element={<MyFiles />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;