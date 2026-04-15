import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './authenticator/AuthContext';
import LoginPage from './authenticator/LoginPage';
import RegisterPage from './authenticator/RegisterPage';

import VantageLayout from './layout/VantageLayout';
import OverviewPage from './pages/OverviewPage';
import BacklogPage from './pages/BacklogPage';
import BoardPage from './pages/BoardPage';
import CalendarPage from './pages/CalendarPage';
import ChatbotPage from './pages/ChatbotPage';
import NotFoundPage from './pages/NotFoundPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function MainApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app/overview" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <VantageLayout />
            </RequireAuth>
          }
        >
          <Route path="overview" element={<OverviewPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="chatbot" element={<ChatbotPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
