import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EditDeckPage from '../EditDeckPage';
import { ThemeProvider } from '../../../hooks/useTheme';
import api from '../../../services/api';

jest.mock('../../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockNavigate = jest.fn();
const mockParams = { id: '1' };

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
}));

const mockDeck = {
    id: 1,
    name: 'Test Deck',
    userId: 1,
    cards: [
        { cardApiId: 89631139, copies: 3 },
        { cardApiId: 46986414, copies: 2 },
    ],
};

const mockCardData = [
    {
        id: 89631139,
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
    {
        id: 46986414,
        name: 'Dark Magician',
        type: 'Normal Monster',
        desc: 'Ultimate wizard',
        atk: 2500,
        def: 2100,
        attribute: 'DARK',
        race: 'Spellcaster',
        level: 7,
        card_images: [{ id: 2, image_url: 'url2', image_url_small: 'url2_small' }],
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

describe('EditDeckPage Component', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: mockDeck } });
            }
            if (url.includes('/cards')) {
                return Promise.resolve({ data: mockCardData });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('1. deve exibir loading ao carregar deck', async () => {
        renderWithProviders(<EditDeckPage />);
        expect(screen.getByText(/Carregando Deck/i)).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText(/Carregando Deck/i)).not.toBeInTheDocument());
    });

    it('2. deve carregar e exibir dados do deck', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument();
        });
        expect(mockedApi.get).toHaveBeenCalledWith('/decks/1');
    });

    it('3. deve carregar cartas do deck', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Meu Deck/i));
        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
            expect(screen.getByText('Dark Magician')).toBeInTheDocument();
        });
    });

    it('4. deve exibir erro ao falhar carregamento do deck', async () => {
        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) return Promise.reject(new Error('Network error'));
            return Promise.resolve({ data: [] });
        });
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => {
            expect(screen.getByText(/Erro ao carregar o deck/i)).toBeInTheDocument();
        });
    });

    it('5. deve permitir voltar ao dashboard', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Voltar/i));
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('6. deve permitir editar nome do deck', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        const nameInput = screen.getByDisplayValue('Test Deck');
        fireEvent.change(nameInput, { target: { value: 'Updated Deck' } });
        expect(screen.getByDisplayValue('Updated Deck')).toBeInTheDocument();
    });

    it('7. deve salvar deck atualizado com sucesso', async () => {
        window.alert = jest.fn();
        mockedApi.put.mockResolvedValueOnce({ data: { success: true } });
        const deckCom40Cartas = {
            ...mockDeck,
            cards: [...mockDeck.cards, ...Array.from({ length: 35 }, (_, i) => ({ cardApiId: 2000 + i, copies: 1 }))]
        };
        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) return Promise.resolve({ data: { deck: deckCom40Cartas } });
            return Promise.resolve({ data: mockCardData });
        });
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Salvar Deck/i));
        await waitFor(() => expect(mockedApi.put).toHaveBeenCalled());
        expect(window.alert).toHaveBeenCalledWith('Deck atualizado com sucesso!');
    });

    it('8. deve validar deck principal mínimo (40 cartas)', async () => {
        window.alert = jest.fn();
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Salvar Deck/i));
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('mínimo 40 cartas'));
        });
    });

    it('9. deve alternar entre abas de busca e deck', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        const deckTab = screen.getByText(/Meu Deck/i).closest('button');
        fireEvent.click(deckTab!);
        await waitFor(() => expect(deckTab).toHaveClass('active'));
    });

    it('10. deve permitir adicionar uma carta ao deck', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByText('Dark Magician')).toBeInTheDocument());
        
        const cardInSearch = screen.getAllByText('Dark Magician').find(el => el.closest('.card-item'));
        fireEvent.click(cardInSearch!.closest('.card-item')!);
        
        fireEvent.click(screen.getByText(/Meu Deck/i));
        await waitFor(() => {
            const counts = screen.getAllByText(/3x/i);
            expect(counts.length).toBeGreaterThan(0);
        });
    });

    it('11. não deve permitir adicionar mais de 3 cópias', async () => {
        window.alert = jest.fn();
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument());
        
        const cardInSearch = screen.getAllByText('Blue-Eyes White Dragon').find(el => el.closest('.card-item'));
        fireEvent.click(cardInSearch!.closest('.card-item')!); 
        
        expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/limite de 3 cópias/i));
    });

    it('12. deve permitir remover carta do deck', async () => {
        const singleCardDeck = { ...mockDeck, cards: [{ cardApiId: 89631139, copies: 1 }] };
        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) return Promise.resolve({ data: { deck: singleCardDeck } });
            return Promise.resolve({ data: mockCardData });
        });

        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        
        fireEvent.click(screen.getByText(/Meu Deck/i));
        await waitFor(() => expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument());
        
        const cardInDeck = screen.getByText('Blue-Eyes White Dragon').closest('.deck-card-item-view');
        const removeBtn = cardInDeck?.querySelector('.remove-deck-card-button');
        fireEvent.click(removeBtn!);
        
        await waitFor(() => {
            expect(screen.queryByText('Blue-Eyes White Dragon')).not.toBeInTheDocument();
        });
    });

    it('13. deve buscar cartas com debounce ao digitar', async () => {
        jest.useFakeTimers();
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        fireEvent.change(searchInput, { target: { value: 'Exodia' } });
        
        act(() => { jest.advanceTimersByTime(500); });

        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith('/cards', expect.objectContaining({ 
                params: expect.objectContaining({ fname: 'Exodia' }) 
            }));
        });
        jest.useRealTimers();
    });

    it('14. deve alternar filtro de cartas proibidas', async () => {
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => expect(screen.getByDisplayValue('Test Deck')).toBeInTheDocument());
        const checkboxes = screen.getAllByRole('checkbox');
        const banCheckbox = checkboxes.find(c => c.closest('.banished-toggle-container') || c.closest('.toggle-container'));
        fireEvent.click(banCheckbox!);
        expect(banCheckbox).toBeChecked();
    });

    it('15. deve carregar cartas individuais remanescentes', async () => {
        const customDeck = { ...mockDeck, cards: [{ cardApiId: 777, copies: 1 }] };
        mockedApi.get.mockImplementation((url: string, config?: any) => {
            if (url.includes('/decks/')) return Promise.resolve({ data: { deck: customDeck } });
            if (url.includes('/cards') && config?.params?.id === 777) {
                return Promise.resolve({ data: [{ id: 777, name: 'Special', card_images: [{ image_url: '', image_url_small: '' }] }] });
            }
            return Promise.resolve({ data: [] });
        });
        renderWithProviders(<EditDeckPage />);
        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith('/cards', expect.objectContaining({ params: { id: 777 } }));
        });
    });
});