import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useDiary } from '../contexts/DiaryContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import UnlockModal from '../components/UnlockModal';
import './Dashboard.css';
import { Menu } from 'lucide-react';

export default function Dashboard() {
  const { loadAllEntries, loaded } = useDiary();
  const { encKey, keyLoading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
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
      {/* Mobile top bar */}
      <header className="mobile-top-bar">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Open navigation menu">
          <Menu size={24} />
        </button>
        <h1 className="app-title">Memoria</h1>
      </header>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <main className="dashboard-main">
        <div className="dashboard-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
