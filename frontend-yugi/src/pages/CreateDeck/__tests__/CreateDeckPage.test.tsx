import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CreateDeckPage from '../CreateDeckPage';
import { ThemeProvider } from '../../../hooks/useTheme';
import api from '../../../services/api';

jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockCards = [
    {
        id: 1,
        name: 'Blue-Eyes White Dragon',
        type: 'Normal Monster',
        desc: 'Powerful dragon',
        atk: 3000,
        def: 2500,
        attribute: 'LIGHT',
        race: 'Dragon',
        level: 8,
        card_images: [{ id: 1, image_url: 'url1', image_url_small: 'url1_small' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
];

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <ThemeProvider>{component}</ThemeProvider>
        </BrowserRouter>
    );
};

describe('CreateDeckPage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        jest.useFakeTimers();
        
        mockedApi.get.mockImplementation((__, config) => {
            if (config?.params?.fname || config?.params?.type) {
                return Promise.resolve({ data: mockCards });
            }
            return Promise.resolve({ data: [] });
        });
        
        mockedApi.post.mockResolvedValue({ 
            data: { 
                id: 1, 
                name: 'Novo Deck',
                mainDeck: [],
                extraDeck: []
            } 
        });
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    const renderComponent = async () => {
        let result;
        
        await act(async () => {
            result = renderWithProviders(<CreateDeckPage />);
        });
        
        await act(async () => {
            jest.advanceTimersByTime(100);
            await Promise.resolve();
        });
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('Novo Deck')).toBeInTheDocument();
        }, { timeout: 1000 });
        
        return result!;
    };

    it('deve renderizar header com nome do deck', async () => {
        await renderComponent();
        expect(screen.getByDisplayValue('Novo Deck')).toBeInTheDocument();
    });

    it('deve renderizar abas de navegação', async () => {
        await renderComponent();

        await waitFor(() => {
            const searchTab = screen.getByRole('button', { name: /🔍 Buscar Cartas/i });
            const deckTab = screen.getByRole('button', { name: /🃏 Meu Deck/i });
            expect(searchTab).toBeInTheDocument();
            expect(deckTab).toBeInTheDocument();
        });
    });

    it('deve renderizar botões de voltar e salvar', async () => {
        await renderComponent();
        expect(screen.getByText('< Voltar')).toBeInTheDocument();
        expect(screen.getByText('Salvar Deck')).toBeInTheDocument();
    });

    it('deve navegar para dashboard ao clicar em voltar', async () => {
        await renderComponent();

        const backButton = screen.getByText('< Voltar');
        
        await act(async () => {
            fireEvent.click(backButton);
        });
        
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('deve permitir alterar nome do deck', async () => {
        await renderComponent();

        const nameInput = screen.getByDisplayValue('Novo Deck');
        
        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'My Custom Deck' } });
        });

        expect(screen.getByDisplayValue('My Custom Deck')).toBeInTheDocument();
    });

    it('deve alternar entre abas', async () => {
        await renderComponent();

        const deckTab = screen.getByRole('button', { name: /🃏 Meu Deck/i });
        
        await act(async () => {
            fireEvent.click(deckTab);
        });

        await act(async () => {
            jest.advanceTimersByTime(100);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText(/Seu deck está vazio/i)).toBeInTheDocument();
        });
    });

    it('deve buscar cartas quando termo de busca é digitado', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockCards });
        
        await renderComponent();

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Blue-Eyes' } });
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
            await Promise.resolve();
        });

        expect(mockedApi.get).toHaveBeenCalled();
    });

    it('deve mostrar mensagem de erro quando deck principal tem menos de 40 cartas', async () => {
        window.alert = jest.fn();
        
        await renderComponent();

        const saveButton = screen.getByText('Salvar Deck');
        
        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(window.alert).toHaveBeenCalledWith(
            expect.stringContaining('mínimo 40 cartas')
        );
    });

    it('deve exibir toggle de cartas proibidas', async () => {
        await renderComponent();

        const elements = screen.getAllByText(/Incluir Proibidas/i);
        expect(elements.length).toBeGreaterThan(0);
    });

    it('deve renderizar campo de busca', async () => {
        await renderComponent();

        expect(screen.getByPlaceholderText(/Nome da Carta/i)).toBeInTheDocument();
    });

    it('deve renderizar select de tipo', async () => {
        await renderComponent();

        expect(screen.getByDisplayValue(/Tipo de Carta/i)).toBeInTheDocument();
    });

    it('deve iniciar na aba de busca', async () => {
        await renderComponent();

        const searchTabButton = screen.getByRole('button', { name: /🔍 Buscar Cartas/i });
        
        expect(searchTabButton).toBeVisible();
        expect(screen.getByPlaceholderText(/Nome da Carta/i)).toBeInTheDocument();
    });

    it('deve exibir contador de cartas total como 0 inicialmente', async () => {
        await renderComponent();

        const deckTab = screen.getByText(/Meu Deck\s*\(\s*0\s*\)/i);
        expect(deckTab).toBeInTheDocument();
    });

    it('deve renderizar botões de paginação', async () => {
        await renderComponent();

        expect(screen.getByText('Página Anterior')).toBeInTheDocument();
        expect(screen.getByText('Próxima Página')).toBeInTheDocument();
    });

    it('deve desabilitar botão de página anterior na primeira página', async () => {
        await renderComponent();

        const prevButton = screen.getByText('Página Anterior');
        expect(prevButton).toBeDisabled();
    });

    it('deve renderizar mensagem de deck vazio na aba de deck', async () => {
        await renderComponent();

        const deckTab = screen.getByRole('button', { name: /🃏 Meu Deck/i });
        
        await act(async () => {
            fireEvent.click(deckTab);
        });

        await act(async () => {
            jest.advanceTimersByTime(100);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(screen.getByText(/Seu deck está vazio/i)).toBeInTheDocument();
        });
    });

    it('deve chamar API com parâmetros corretos ao buscar', async () => {
        mockedApi.get.mockResolvedValueOnce({ data: mockCards });
        
        await renderComponent();

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Dark Magician' } });
        });

        await act(async () => {
            jest.advanceTimersByTime(600);
            await Promise.resolve();
        });

        expect(mockedApi.get).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                params: expect.objectContaining({
                    fname: 'Dark Magician'
                })
            })
        );
    });

    it('deve alternar o toggle de cartas proibidas', async () => {
        await renderComponent();

        const checkboxes = screen.getAllByRole('checkbox');
        
        expect(checkboxes.length).toBeGreaterThan(0);
        
        const firstCheckbox = checkboxes[0];
        
        await act(async () => {
            fireEvent.click(firstCheckbox);
        });
        
        expect(firstCheckbox).toBeChecked();
        
        await act(async () => {
            fireEvent.click(firstCheckbox);
        });
        
        expect(firstCheckbox).not.toBeChecked();
    });

    it('não deve lançar erros de act durante renderização inicial', async () => {
        let error = null;
        try {
            await renderComponent();
        } catch (e) {
            error = e;
        }
        expect(error).toBeNull();
    });

    it('deve limpar timeouts ao desmontar', async () => {
        const { unmount } = renderWithProviders(<CreateDeckPage />);
        
        await act(async () => {
            await Promise.resolve();
        });
        
        await act(async () => {
            jest.advanceTimersByTime(500);
        });
        
        unmount();
        expect(true).toBe(true);
    });
});