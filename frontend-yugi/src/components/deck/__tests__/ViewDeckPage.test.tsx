import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ViewDeckPage from '../ViewDeckPage';
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
    name: 'Blue-Eyes Deck',
    userId: 1,
    cards: [
        { cardApiId: 89631139, copies: 3 },
        { cardApiId: 46986414, copies: 2 },
        { cardApiId: 23995346, copies: 1 },
    ],
};

const mockCardData = {
    89631139: {
        id: 89631139,
        name: 'Blue-Eyes White Dragon',
        type: 'Normal Monster',
        atk: 3000,
        def: 2500,
        card_images: [{ image_url_small: 'https://example.com/blue-eyes-small.jpg' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
    46986414: {
        id: 46986414,
        name: 'Dark Magician',
        type: 'Normal Monster',
        atk: 2500,
        def: 2100,
        card_images: [{ image_url_small: 'https://example.com/dark-magician-small.jpg' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
    23995346: {
        id: 23995346,
        name: 'Blue-Eyes Ultimate Dragon',
        type: 'Fusion Monster',
        atk: 4500,
        def: 3800,
        card_images: [{ image_url_small: 'https://example.com/ultimate-dragon-small.jpg' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
};

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <ThemeProvider>{component}</ThemeProvider>
        </BrowserRouter>
    );
};

describe('ViewDeckPage Component', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockClear();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        mockedApi.get.mockImplementation((url: string, config?: any) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: mockDeck } });
            }
            if (url.includes('/cards')) {
                const cardId = config?.params?.id;
                const cardData = mockCardData[cardId as keyof typeof mockCardData];
                return Promise.resolve({ data: [cardData] });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('deve exibir loading ao carregar', () => {
        renderWithProviders(<ViewDeckPage />);

        expect(screen.getByText('Carregando Deck...')).toBeInTheDocument();
    });

    it('deve carregar e exibir nome do deck', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes Deck')).toBeInTheDocument();
        });
    });

    it('deve carregar dados do deck da API', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith('/decks/1');
        });
    });

    it('deve renderizar botão de voltar', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('< Voltar')).toBeInTheDocument();
        });
    });

    it('deve navegar para dashboard ao clicar em voltar', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('< Voltar')).toBeInTheDocument();
        });

        const backButton = screen.getByText('< Voltar');
        fireEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('deve renderizar botão de editar deck', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Editar Deck')).toBeInTheDocument();
        });
    });

    it('deve navegar para edição ao clicar em editar', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Editar Deck')).toBeInTheDocument();
        });

        const editButton = screen.getByText('Editar Deck');
        fireEvent.click(editButton);

        expect(mockNavigate).toHaveBeenCalledWith('/deck/edit/1');
    });

    it('deve renderizar abas de Main e Extra Deck', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText(/Main Deck/i)).toBeInTheDocument();
            expect(screen.getByText(/Extra Deck/i)).toBeInTheDocument();
        });
    });

    it('deve exibir Main Deck como aba ativa por padrão', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            const mainDeckTab = screen.getByText(/Main Deck/i).closest('button');
            expect(mainDeckTab).toHaveClass('active');
        });
    });

    it('deve alternar para aba Extra Deck', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText(/Extra Deck/i)).toBeInTheDocument();
        });

        const extraDeckTab = screen.getByText(/Extra Deck/i);
        fireEvent.click(extraDeckTab);

        await waitFor(() => {
            const extraTab = extraDeckTab.closest('button');
            expect(extraTab).toHaveClass('active');
        });
    });

    it('deve exibir cartas do Main Deck', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
            expect(screen.getByText('Dark Magician')).toBeInTheDocument();
        });
    });

    it('deve exibir cartas do Extra Deck na aba correspondente', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText(/Extra Deck/i)).toBeInTheDocument();
        });

        const extraDeckTab = screen.getByText(/Extra Deck/i);
        fireEvent.click(extraDeckTab);

        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes Ultimate Dragon')).toBeInTheDocument();
        });
    });

    it('deve exibir contador de cópias nas cartas', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('3x')).toBeInTheDocument();
            expect(screen.getByText('2x')).toBeInTheDocument();
        });
    });

    it('deve exibir contagem total de cartas nas abas', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText(/Main Deck \(5\)/i)).toBeInTheDocument();
            expect(screen.getByText(/Extra Deck \(1\)/i)).toBeInTheDocument();
        });
    });

    it('deve buscar detalhes de cada carta', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(mockedApi.get).toHaveBeenCalledWith(
                '/cards',
                expect.objectContaining({ params: { id: 89631139 } })
            );
            expect(mockedApi.get).toHaveBeenCalledWith(
                '/cards',
                expect.objectContaining({ params: { id: 46986414 } })
            );
            expect(mockedApi.get).toHaveBeenCalledWith(
                '/cards',
                expect.objectContaining({ params: { id: 23995346 } })
            );
        });
    });

    it('deve exibir imagens das cartas', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            expect(images.length).toBeGreaterThan(0);
        });
    });

    it('deve usar imagem placeholder quando carta não tem imagem', async () => {
        const deckWithoutImages = {
            ...mockDeck,
            cards: [{ cardApiId: 99999, copies: 1 }],
        };

        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: deckWithoutImages } });
            }
            if (url.includes('/cards')) {
                return Promise.resolve({
                    data: [{
                        id: 99999,
                        name: 'Test Card',
                        type: 'Normal Monster',
                    }],
                });
            }
            return Promise.reject(new Error('Not found'));
        });

        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            const image = screen.getByAltText('Test Card') as HTMLImageElement;
            expect(image.src).toContain('imgur');
        });
    });

    it('deve exibir tags de banlist para cartas proibidas', async () => {
        const deckWithForbidden = {
            ...mockDeck,
            cards: [{ cardApiId: 55144522, copies: 1 }],
        };

        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: deckWithForbidden } });
            }
            if (url.includes('/cards')) {
                return Promise.resolve({
                    data: [{
                        id: 55144522,
                        name: 'Pot of Greed',
                        type: 'Spell Card',
                        banlist_info: { ban_tcg: 'Forbidden' },
                        card_images: [{ image_url_small: 'url' }],
                    }],
                });
            }
            return Promise.reject(new Error('Not found'));
        });

        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('PROIBIDA')).toBeInTheDocument();
        });
    });

    it('deve exibir tags de banlist para cartas limitadas', async () => {
        const deckWithLimited = {
            ...mockDeck,
            cards: [{ cardApiId: 12580477, copies: 1 }],
        };

        mockedApi.get.mockImplementation((url: string) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: deckWithLimited } });
            }
            if (url.includes('/cards')) {
                return Promise.resolve({
                    data: [{
                        id: 12580477,
                        name: 'Raigeki',
                        type: 'Spell Card',
                        banlist_info: { ban_tcg: 'Limited' },
                        card_images: [{ image_url_small: 'url' }],
                    }],
                });
            }
            return Promise.reject(new Error('Not found'));
        });

        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('LIMITADA (1)')).toBeInTheDocument();
        });
    });

    it('deve renderizar ThemeToggleButton', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        });
    });

    it('deve lidar com erro ao carregar deck', async () => {
        mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Erro ao carregar deck',
                expect.any(Error)
            );
        });
    });

    it('deve filtrar cartas entre Main e Extra Deck corretamente', async () => {
        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
        });

        expect(screen.queryByText('Blue-Eyes Ultimate Dragon')).not.toBeInTheDocument();

        const extraDeckTab = screen.getByText(/Extra Deck/i);
        fireEvent.click(extraDeckTab);

        await waitFor(() => {
            expect(screen.getByText('Blue-Eyes Ultimate Dragon')).toBeInTheDocument();
        });

        expect(screen.queryByText('Dark Magician')).not.toBeInTheDocument();
    });

    it('deve lidar com cartas que falham ao carregar', async () => {
        mockedApi.get.mockImplementation((url: string, config?: any) => {
            if (url.includes('/decks/')) {
                return Promise.resolve({ data: { deck: mockDeck } });
            }
            if (url.includes('/cards')) {
                const cardId = config?.params?.id;
                if (cardId === 89631139) {
                    return Promise.reject(new Error('Card not found'));
                }
                const cardData = mockCardData[cardId as keyof typeof mockCardData];
                return Promise.resolve({ data: [cardData] });
            }
            return Promise.reject(new Error('Not found'));
        });

        renderWithProviders(<ViewDeckPage />);

        await waitFor(() => {
            expect(screen.getByText('Dark Magician')).toBeInTheDocument();
            expect(screen.queryByText('Blue-Eyes White Dragon')).not.toBeInTheDocument();
        });
    });
});