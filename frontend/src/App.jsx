import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import ScheduleBoard from './components/ScheduleBoard';

/**
 * Main App Component
 * @author Jeff
 * @date 2026-03-08
 */
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-gray-500 font-medium">系統載入中...</div>;
  }

  return user ? <ScheduleBoard /> : <Login />;
}

export default AppContent;
