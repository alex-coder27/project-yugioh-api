import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../hooks/useAuth';
import { ThemeProvider } from '../../hooks/useTheme';
import AuthPage from '../../pages/Auth/AuthPage';
import DashboardPage from '../../pages/Dashboard/DashboardPage';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle">Mock Toggle</div>,
}));

const TestRouter = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <div data-testid="loading">Carregando...</div>;

  return (
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        />
      </Routes>
    </MemoryRouter>
  );
};

const AppIntegration = () => (
  <ThemeProvider>
    <AuthProvider>
      <TestRouter />
    </AuthProvider>
  </ThemeProvider>
);

describe('Integração: Fluxo de Autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('deve realizar login e redirecionar o duelista para o dashboard', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        token: 'token-valido',
        userId: 123,
        username: 'SetoKaiba'
      },
    });

    mockedApi.get.mockResolvedValue({ data: { decks: [] } });

    render(<AppIntegration />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const loginForm = document.getElementById('login-form');
    const identifierInput = loginForm?.querySelector('#login-identifier') as HTMLInputElement;
    const passwordInput = loginForm?.querySelector('#login-password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /PREPARAR DECK/i });

    await act(async () => {
      fireEvent.change(identifierInput, { target: { value: 'kaiba@corp.com' } });
      fireEvent.change(passwordInput, { target: { value: 'blueeyes' } });
    });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/SetoKaiba/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });
});