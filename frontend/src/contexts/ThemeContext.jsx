import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 'auto' | 'light' | 'dark'
  const [mode, setModeState] = useState(() => {
    return localStorage.getItem('memoria_theme_mode') || 'auto';
  });

  // Calculate actual theme ('light' | 'dark') based on mode & current hour
  const getAutoTheme = () => {
    const hour = new Date().getHours();
    // 6 AM (06:00) to 6 PM (18:00) is Day (Light mode)
    // 6 PM to 6 AM is Night (Dark mode)
    return hour >= 6 && hour < 18 ? 'light' : 'dark';
  };

  const [activeTheme, setActiveTheme] = useState(() => {
    const savedMode = localStorage.getItem('memoria_theme_mode') || 'auto';
    if (savedMode === 'light') return 'light';
    if (savedMode === 'dark') return 'dark';
    return getAutoTheme();
  });

  // Update root attribute whenever mode or time changes
  useEffect(() => {
    const updateTheme = () => {
      let resolvedTheme;
      if (mode === 'light') resolvedTheme = 'light';
      else if (mode === 'dark') resolvedTheme = 'dark';
      else resolvedTheme = getAutoTheme();

      setActiveTheme(resolvedTheme);
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    updateTheme();

    // Check time every minute so automatic day/night transition happens live
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, [mode]);

  const setMode = (newMode) => {
    setModeState(newMode);
    localStorage.setItem('memoria_theme_mode', newMode);
  };

  const isNight = activeTheme === 'dark';

  return (
    <ThemeContext.Provider value={{ mode, setMode, activeTheme, isNight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
