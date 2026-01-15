import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../hooks/useAuth';
import { ThemeProvider } from '../../hooks/useTheme';
import DashboardPage from '../../pages/Dashboard/DashboardPage';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-toggle">Mock Toggle</div>,
}));

const DashboardIntegrationApp = () => (
  <ThemeProvider>
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  </ThemeProvider>
);

describe('Integração: Dashboard', () => {
  const mockDecks = [
    {
      id: 1,
      name: 'Deck de Olhos Azuis',
      mainDeckCount: 40,
      extraDeckCount: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('userId', '123');
    localStorage.setItem('username', 'SetoKaiba');
  });

  it('deve carregar e exibir a lista de decks do duelista', async () => {
    mockedApi.get.mockResolvedValue({ data: { decks: mockDecks } });

    render(<DashboardIntegrationApp />);

    await waitFor(() => {
      expect(screen.getByText(/Deck de Olhos Azuis/i)).toBeInTheDocument();
    });

    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando a API falhar', async () => {
    mockedApi.get.mockRejectedValue(new Error('Falha na conexão'));

    render(<DashboardIntegrationApp />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar seus decks/i)).toBeInTheDocument();
    });
  });
});