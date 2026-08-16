import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import UnlockModal from '../components/UnlockModal';
import './Dashboard.css';

export default function Dashboard() {
  const { loadAllEntries, loaded } = useDiary();
  const { encKey, keyLoading } = useAuth();

  useEffect(() => {
    if (encKey && !loaded) {
      loadAllEntries();
    }
  }, [encKey, loaded, loadAllEntries]);

  if (keyLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <span>Restoring encryption key…</span>
      </div>
    );
  }

  // If authenticated but encKey is missing, render UnlockModal overlay without redirect loop
  if (!encKey) {
    return <UnlockModal />;
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
