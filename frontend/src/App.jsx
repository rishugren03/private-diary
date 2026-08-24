import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DiaryProvider } from './contexts/DiaryContext';
import { BookProvider } from './contexts/BookContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Today from './pages/Today';
import CalendarPage from './pages/CalendarPage';
import EntryView from './pages/EntryView';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Bookshelf from './pages/Bookshelf';
import BookWorkspace from './pages/BookWorkspace';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, encKey } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user && encKey ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DiaryProvider>
              <BookProvider>
                <Dashboard />
              </BookProvider>
            </DiaryProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Today />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="entry/:date" element={<EntryView />} />
        <Route path="search" element={<Search />} />
        <Route path="settings" element={<Settings />} />
        <Route path="books" element={<Bookshelf />} />
        <Route path="books/:id" element={<BookWorkspace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
