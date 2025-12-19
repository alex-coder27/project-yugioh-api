import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from '../AuthPage';
import { AuthProvider } from '../../../hooks/useAuth';
import { ThemeProvider } from '../../../hooks/useTheme';
import api from '../../../services/api';

jest.mock('../../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle-button">Theme Toggle</div>,
}));

jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/login' }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AuthProvider>{component}</AuthProvider>
    </ThemeProvider>
  );
};

describe('AuthPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('deve renderizar formulário de login por padrão', () => {
    renderWithProviders(<AuthPage />);

    const loginButtons = screen.getAllByRole('button', { name: 'LOGIN' });
    expect(loginButtons).toHaveLength(1);
    
    const loginHeadings = screen.getAllByRole('heading', { name: 'LOGIN' });
    expect(loginHeadings).toHaveLength(1);
    expect(loginHeadings[0].tagName).toBe('H2');
    
    expect(screen.getByLabelText('DUELIST ID')).toBeInTheDocument();
    expect(screen.getByLabelText('PASSWORD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PREPARAR DECK/i })).toBeInTheDocument();
  });

  it('deve alternar para formulário de registro', () => {
    renderWithProviders(<AuthPage />);

    const registerButton = screen.getByRole('button', { name: /REGISTER/i });
    fireEvent.click(registerButton);

    const registerButtons = screen.getAllByRole('button', { name: 'REGISTER' });
    expect(registerButtons).toHaveLength(1);
    
    const registerHeadings = screen.getAllByRole('heading', { name: 'REGISTER' });
    expect(registerHeadings).toHaveLength(1);
    expect(registerHeadings[0].tagName).toBe('H2');
    
    expect(screen.getByLabelText(/CHOOSE DUELIST USERNAME/i)).toBeInTheDocument();
    expect(screen.getByLabelText('DUELIST ID (EMAIL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CRIAR CONTA DUELISTA/i })).toBeInTheDocument();
  });

  it('deve fazer login com sucesso', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        userId: 1,
        username: 'testuser',
      },
    });

    renderWithProviders(<AuthPage />);

    const identifierInput = screen.getByLabelText('DUELIST ID');
    const passwordInput = screen.getByLabelText('PASSWORD');
    const submitButton = screen.getByRole('button', { name: /PREPARAR DECK/i });

    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        identifier: 'testuser',
        password: 'password123',
      });
    });
  });

  it('deve mostrar erro ao falhar no login', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Unauthorized'));

    renderWithProviders(<AuthPage />);

    const identifierInput = screen.getByLabelText('DUELIST ID');
    const passwordInput = screen.getByLabelText('PASSWORD');
    const submitButton = screen.getByRole('button', { name: /PREPARAR DECK/i });

    fireEvent.change(identifierInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Falha no LOGIN/i)).toBeInTheDocument();
    });
  });

  it('deve fazer registro com sucesso', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        token: 'new-token',
        userId: 2,
        username: 'newuser',
      },
    });

    renderWithProviders(<AuthPage />);

    const registerTab = screen.getByRole('button', { name: /REGISTER/i });
    fireEvent.click(registerTab);

    const usernameInput = screen.getByLabelText(/CHOOSE DUELIST USERNAME/i);
    const emailInput = screen.getByLabelText('DUELIST ID (EMAIL)');
    const passwordInput = screen.getByLabelText(/CREATE PASSWORD/i);
    const submitButton = screen.getByRole('button', { name: /CRIAR CONTA DUELISTA/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', {
        username: 'newuser',
        email: 'new@email.com',
        password: 'password123',
      });
    });
  });

  it('deve validar senha mínima no registro', async () => {
    renderWithProviders(<AuthPage />);

    const registerTab = screen.getByRole('button', { name: /REGISTER/i });
    fireEvent.click(registerTab);

    const usernameInput = screen.getByLabelText(/CHOOSE DUELIST USERNAME/i);
    const emailInput = screen.getByLabelText('DUELIST ID (EMAIL)');
    const passwordInput = screen.getByLabelText(/CREATE PASSWORD/i);
    const submitButton = screen.getByRole('button', { name: /CRIAR CONTA DUELISTA/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/A senha deve ter pelo menos 6 caracteres/i)).toBeInTheDocument();
    });

    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('deve mostrar estado de loading durante login', async () => {
    mockedApi.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<AuthPage />);

    const identifierInput = screen.getByLabelText('DUELIST ID');
    const passwordInput = screen.getByLabelText('PASSWORD');
    const submitButton = screen.getByRole('button', { name: /PREPARAR DECK/i });

    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/CARREGANDO DECK/i)).toBeInTheDocument();
  });
});