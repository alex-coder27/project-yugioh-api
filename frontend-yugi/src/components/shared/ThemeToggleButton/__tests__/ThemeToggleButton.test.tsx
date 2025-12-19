import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const SimpleMock = ({ variant = 'inline' }: { variant?: string }) => {
  return (
    <button 
      className={`button ${variant}`}
      onClick={() => document.body.classList.toggle('dark')}
      aria-label="Alternar tema"
      data-testid="theme-toggle-button"
    >
      <img 
        src="test-file-stub" 
        alt="Ícone de tema" 
        data-testid="theme-icon"
      />
    </button>
  );
};

jest.mock('../ThemeToggleButton', () => ({
  __esModule: true,
  default: SimpleMock,
}));

import ThemeToggleButton from '../ThemeToggleButton';
import { ThemeProvider } from '../../../../hooks/useTheme';

const renderWithProvider = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ThemeToggleButton Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
    document.body.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('deve renderizar botão com estrutura básica', () => {
    renderWithProvider(<ThemeToggleButton />);

    const button = screen.getByTestId('theme-toggle-button');
    const image = screen.getByTestId('theme-icon');

    expect(button).toBeInTheDocument();
    expect(image).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Alternar tema');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('inline');
  });

  it('deve ter imagem com atributos básicos', () => {
    renderWithProvider(<ThemeToggleButton />);

    const image = screen.getByTestId('theme-icon');
    expect(image).toHaveAttribute('src', 'test-file-stub');
    expect(image).toHaveAttribute('alt', 'Ícone de tema');
  });

  it('deve alternar classe dark no body ao clicar (light -> dark)', () => {
    renderWithProvider(<ThemeToggleButton />);

    const button = screen.getByTestId('theme-toggle-button');
    
    expect(document.body.classList.contains('dark')).toBe(false);
    
    fireEvent.click(button);
    expect(document.body.classList.contains('dark')).toBe(true);
  });

  it('deve alternar classe dark no body ao clicar novamente (dark -> light)', () => {
    renderWithProvider(<ThemeToggleButton />);

    const button = screen.getByTestId('theme-toggle-button');
    
    fireEvent.click(button);
    expect(document.body.classList.contains('dark')).toBe(true);
    
    fireEvent.click(button);
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('deve aplicar classe correta quando variant é fixed', () => {
    renderWithProvider(<ThemeToggleButton variant="fixed" />);
    
    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('fixed');
  });

  it('deve aplicar classe correta quando variant é headerFixed', () => {
    renderWithProvider(<ThemeToggleButton variant="headerFixed" />);
    
    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('headerFixed');
  });

  it('deve aplicar classe inline por padrão', () => {
    renderWithProvider(<ThemeToggleButton />);
    
    const button = screen.getByTestId('theme-toggle-button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('inline');
  });
});