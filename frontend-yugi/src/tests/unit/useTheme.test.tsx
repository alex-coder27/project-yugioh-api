import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../hooks/useTheme';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('useTheme Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('deve inicializar com tema light por padrão', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('deve alternar para tema dark', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('deve alternar entre temas múltiplas vezes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
  });

  it('deve restaurar tema do localStorage', () => {
    localStorage.setItem('theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  it('deve persistir tema no localStorage ao alternar', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('deve aplicar classe dark-mode no body', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(document.body.classList.contains('dark-mode')).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.body.classList.contains('dark-mode')).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('deve lançar erro quando usado fora do ThemeProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme deve ser usado dentro de um ThemeProvider');

    consoleError.mockRestore();
  });
});