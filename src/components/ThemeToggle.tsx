import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button 
      onClick={toggleTheme} 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'var(--bg-card)',
        boxShadow: '0 4px 12px var(--shadow-strong)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        cursor: 'pointer',
        zIndex: 9999,
        border: '2px solid var(--border-color)',
        transition: 'all 0.3s ease',
        color: 'var(--text-primary)',
      }}
      title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}
    >
      <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
    </button>
  );
};

export default ThemeToggle;
