import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import styles from './ThemeToggleButton.module.css';

interface ThemeToggleButtonProps {
  variant?: 'fixed' | 'headerFixed' | 'headerInline' | 'headerFixed';
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ 
  variant = 'inline' 
}) => {
  const { theme, toggleTheme } = useTheme();

  const buttonClass = `${styles.button} ${styles[variant]}`;

  return (
    <button 
      onClick={toggleTheme} 
      className={buttonClass}
      aria-label={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggleButton;