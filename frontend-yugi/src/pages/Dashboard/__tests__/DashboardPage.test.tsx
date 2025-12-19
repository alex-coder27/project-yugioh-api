import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
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
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockDecks = [
    {
        id: 1,
        name: 'Deck Blue-Eyes',
        userId: 1,
        cards: [],
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z',
        mainDeckCount: 40,
        extraDeckCount: 10,
        mainDeckUnique: 20,
        extraDeckUnique: 8,
    },
    {
        id: 2,
        name: 'Deck Dark Magician',
        userId: 1,
        cards: [],
        createdAt: '2025-01-16T15:30:00.000Z',
        updatedAt: '2025-01-16T15:30:00.000Z',
        mainDeckCount: 42,
        extraDeckCount: 12,
        mainDeckUnique: 22,
        extraDeckUnique: 10,
    },
];

const renderWithProviders = (component: React.ReactElement) => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('userId', '1');
    localStorage.setItem('username', 'testuser');

    return render(
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>{component}</AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
};

describe('DashboardPage Component', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        // Mock console.error para evitar poluição no console durante os testes
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        localStorage.clear();
        // Restaurar console.error após cada teste
        consoleErrorSpy.mockRestore();
    });

    it('deve renderizar cabeçalho com informações do usuário', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: [] } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/Bem-vindo/i)).toBeInTheDocument();
            expect(screen.getByText(/testuser/i)).toBeInTheDocument();
        });
    });

    it('deve carregar e exibir lista de decks', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
            expect(screen.getByText('Deck Dark Magician')).toBeInTheDocument();
        });

        expect(screen.getByText('2 Decks')).toBeInTheDocument();
    });

    it('deve exibir estado vazio quando não há decks', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: [] } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/Você ainda não criou nenhum deck/i)).toBeInTheDocument();
        });
    });

    it('deve navegar para criação de deck ao clicar no botão', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: [] } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/CRIAR NOVO DECK/i)).toBeInTheDocument();
        });

        const createButton = screen.getByRole('button', { name: /CRIAR NOVO DECK/i });
        fireEvent.click(createButton);

        expect(mockNavigate).toHaveBeenCalledWith('/deck/create');
    });

    it('deve navegar para visualização do deck', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        const viewButtons = screen.getAllByTitle('Visualizar deck');
        fireEvent.click(viewButtons[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/deck/1');
    });

    it('deve navegar para edição do deck', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByTitle('Editar deck');
        fireEvent.click(editButtons[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/deck/edit/1');
    });

    it('deve deletar deck com confirmação', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });
        mockedApi.delete.mockResolvedValueOnce({ data: { success: true } });
        window.confirm = jest.fn(() => true);
        window.alert = jest.fn();

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Deletar deck');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalledWith(
                'Tem certeza que deseja deletar o deck "Deck Blue-Eyes"?'
            );
            expect(mockedApi.delete).toHaveBeenCalledWith('/decks/1');
        });
    });

    it('não deve deletar deck se cancelar confirmação', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });
        window.confirm = jest.fn(() => false);

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByTitle('Deletar deck');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockedApi.delete).not.toHaveBeenCalled();
    });

    it('deve recarregar decks ao clicar no botão refresh', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        mockedApi.get.mockResolvedValueOnce({ data: { decks: [] } });

        const refreshButton = screen.getByTitle('Recarregar decks');
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledTimes(2);
        });
    });

    it('deve exibir erro ao falhar carregamento de decks', async () => {
        mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/Erro ao carregar seus decks/i)).toBeInTheDocument();
        });
    });

    it('deve exibir estatísticas corretas dos decks', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText('Deck Blue-Eyes')).toBeInTheDocument();
        });

        expect(screen.getAllByText('40').length).toBeGreaterThan(0);
        expect(screen.getAllByText('10').length).toBeGreaterThan(0);

        const totalElements = screen.getAllByText((_, element) => {
            const text = element?.textContent || '';
            return text.includes('50') && text.includes('cartas');
        });

        expect(totalElements.length).toBeGreaterThan(0);
    });

    it('deve formatar data corretamente', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: { decks: mockDecks } });

        renderWithProviders(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/15 de jan\./i)).toBeInTheDocument();
        });
    });
});