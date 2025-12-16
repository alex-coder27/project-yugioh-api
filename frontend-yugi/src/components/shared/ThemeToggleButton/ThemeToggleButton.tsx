import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import styles from './ThemeToggleButton.module.css';

import dragaoBranco from '../../../assets/icons/Icone_Dragao_Branco.png';
import dragaoNegro from '../../../assets/icons/Icone_Dragao_Negro.png';

interface ThemeToggleButtonProps {
  variant?: 'fixed' | 'headerFixed' | 'headerInline' | 'inline';
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
      <img 
        src={theme === 'light' ? dragaoBranco : dragaoNegro} 
        alt={theme === 'light' ? 'Dragão Branco' : 'Dragão Negro'}
        className={styles.iconImage}
      />
    </button>
  );
};

export default ThemeToggleButton;