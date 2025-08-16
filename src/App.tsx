import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoginPage from './pages/Login';
import RobotsPage from './pages/Robots';
import StreamPage from './pages/Stream';
import SettingsPage from './pages/Settings';
import { useAuth } from './hooks/useAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

const App: React.FC = () => {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!token ? <LoginPage /> : <Navigate to="/robots" />} />
        <Route path="/" element={token ? <Layout /> : <Navigate to="/" />}>
          <Route path="robots" element={<RobotsPage />} />
          <Route path="stream" element={<StreamPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
