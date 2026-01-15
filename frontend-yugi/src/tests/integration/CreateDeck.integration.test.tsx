import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CreateDeckPage from '../../pages/CreateDeck/CreateDeckPage';
import { ThemeProvider } from '../../hooks/useTheme';
import { AuthProvider } from '../../hooks/useAuth';
import api from '../../services/api';

jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-toggle">Mock Toggle</div>,
}));

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <ThemeProvider>
            <AuthProvider>
                <MemoryRouter>
                    {component}
                </MemoryRouter>
            </AuthProvider>
        </ThemeProvider>
    );
};

const mockCards = [
    {
        id: 1,
        name: 'Dark Magician',
        type: 'Normal Monster',
        desc: 'The ultimate wizard in terms of attack and defense.',
        atk: 2500,
        def: 2100,
        level: 7,
        attribute: 'DARK',
        race: 'Spellcaster',
        card_images: [{ id: 1, image_url: 'url1', image_url_small: 'url1_small' }]
    }
];

const mockForbiddenCard = {
    id: 2,
    name: 'Pot of Greed',
    type: 'Spell Card',
    desc: 'Draw 2 cards.',
    race: 'Normal',
    card_images: [{ id: 2, image_url: 'url2', image_url_small: 'url2_small' }],
    banlist_info: { 
        ban_tcg: 'Forbidden'
    }
};

describe('Integração: Criação de Deck', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        window.alert = jest.fn();
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(async () => {
        await act(async () => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
        warnSpy.mockRestore();
    });

    it('deve buscar uma carta pelo nome e adicioná-la ao contador do deck', async () => {
        mockedApi.get.mockResolvedValue({ data: mockCards });
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Dark Magician' } });
            jest.advanceTimersByTime(800);
        });

        const cardElement = await screen.findByText('Dark Magician');
        await act(async () => {
            fireEvent.click(cardElement.closest('.card-item')!);
        });

        const deckTab = screen.getByRole('button', { name: /Meu Deck/i });
        expect(deckTab).toHaveTextContent('1');
    });

    it('deve impedir a adição de mais de 3 cópias de uma mesma carta e mostrar alerta', async () => {
        mockedApi.get.mockResolvedValue({ data: mockCards });
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Dark Magician' } });
            jest.advanceTimersByTime(800);
        });

        const cardElement = await screen.findByText('Dark Magician');
        const cardContainer = cardElement.closest('.card-item')!;

        for (let i = 0; i < 4; i++) {
            await act(async () => {
                fireEvent.click(cardContainer);
            });
        }

        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Limite de 3 cópias excedido'));
        
        const deckTab = screen.getByRole('button', { name: /Meu Deck/i });
        expect(deckTab).toHaveTextContent('3');
    });

    it('deve permitir remover uma carta do deck na visualização de Deck', async () => {
        mockedApi.get.mockResolvedValue({ data: mockCards });
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Dark Magician' } });
            jest.advanceTimersByTime(800);
        });

        const cardElement = await screen.findByText('Dark Magician');
        await act(async () => {
            fireEvent.click(cardElement.closest('.card-item')!);
        });

        const deckTab = screen.getByRole('button', { name: /Meu Deck/i });
        await act(async () => {
            fireEvent.click(deckTab);
        });

        const removeButton = screen.getByRole('button', { name: /Remover/i });
        await act(async () => {
            fireEvent.click(removeButton);
        });

        expect(deckTab).toHaveTextContent('0');
    });

    it('deve realizar a busca ao alterar filtros de seleção', async () => {
        mockedApi.get.mockResolvedValue({ data: mockCards });
        renderWithProviders(<CreateDeckPage />);

        const typeSelect = screen.getByDisplayValue(/Tipo de Carta/i);

        await act(async () => {
            fireEvent.change(typeSelect, { target: { value: 'Normal Monster' } });
            jest.advanceTimersByTime(800);
        });

        expect(mockedApi.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            params: expect.objectContaining({ type: 'Normal Monster' })
        }));
    });

    it('deve controlar a paginação corretamente', async () => {
        const largeMockList = Array.from({ length: 100 }, (_, i) => ({
            ...mockCards[0],
            id: i + 100,
            name: `Card ${i}`
        }));
        
        mockedApi.get.mockResolvedValue({ data: largeMockList });

        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Test' } });
            jest.advanceTimersByTime(800);
        });

        const nextButton = screen.getByRole('button', { name: /Próxima Página/i });
        
        await act(async () => {
            fireEvent.click(nextButton);
        });

        expect(screen.getByText(/Página 2/i)).toBeInTheDocument();
    });

    it('deve validar a inclusão de cartas banidas apenas quando o checkbox está marcado', async () => {
        mockedApi.get.mockResolvedValue({ data: [mockForbiddenCard] });
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Pot of Greed' } });
            jest.advanceTimersByTime(800);
        });

        const cardElement = await screen.findByText('Pot of Greed');
        const cardContainer = cardElement.closest('.card-item')!;

        await act(async () => {
            fireEvent.click(cardContainer);
        });

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('está proibida'));
        });

        const searchControls = document.querySelector('.search-controls');
        const includeForbiddenCheckbox = searchControls?.querySelector('input[type="checkbox"]');

        await act(async () => {
            fireEvent.click(includeForbiddenCheckbox!);
        });

        await act(async () => {
            fireEvent.click(cardContainer);
        });

        const deckTab = screen.getByRole('button', { name: /Meu Deck/i });
        expect(deckTab).toHaveTextContent('1');
    });

    it('deve exibir mensagem de erro quando a API falha', async () => {
        mockedApi.get.mockRejectedValue(new Error('Erro ao processar a busca.'));
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Dark Magician' } });
            jest.advanceTimersByTime(800);
        });

        const errorMsg = await screen.findByText(/Erro ao processar a busca/i);
        expect(errorMsg).toBeInTheDocument();

        await act(async () => {
            await Promise.resolve();
        });
    });

    it('deve persistir o nome do deck ao digitar', async () => {
        renderWithProviders(<CreateDeckPage />);
        const nameInput = screen.getByPlaceholderText(/Nome do Deck/i);

        await act(async () => {
            fireEvent.change(nameInput, { target: { value: 'Novo Deck' } });
        });

        expect(nameInput).toHaveValue('Novo Deck');
    });

    it('deve impedir o salvamento se o deck tiver menos de 40 cartas', async () => {
        renderWithProviders(<CreateDeckPage />);
        const saveButton = screen.getByRole('button', { name: /Salvar Deck/i });

        await act(async () => {
            fireEvent.click(saveButton);
        });

        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('no mínimo 40 cartas'));
    });

    it('deve respeitar os limites específicos da banlist (Limitadas e Semi-Limitadas)', async () => {
        const limitedCard = { ...mockCards[0], id: 10, name: 'Monster Reborn', banlist_info: { ban_tcg: 'Limited' } };
        const semiCard = { ...mockCards[0], id: 11, name: 'Malicious', banlist_info: { ban_tcg: 'Semi-Limited' } };
        
        mockedApi.get.mockResolvedValue({ data: [limitedCard, semiCard] });
        renderWithProviders(<CreateDeckPage />);

        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Special' } });
            jest.advanceTimersByTime(800);
        });

        const limitedEl = (await screen.findByText('Monster Reborn')).closest('.card-item')!;
        const semiEl = (await screen.findByText('Malicious')).closest('.card-item')!;

        for (let i = 0; i < 2; i++) {
            await act(async () => { fireEvent.click(limitedEl); });
        }
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Limite de 1 cópia'));

        for (let i = 0; i < 3; i++) {
            await act(async () => { fireEvent.click(semiEl); });
        }
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Limite de 2 cópias'));
    });

    it('deve adicionar monstros de fusão ao Extra Deck e respeitar o limite de 15', async () => {
        mockedApi.get.mockImplementation(() => {
            const cards = Array.from({ length: 16 }, (_, i) => ({
                ...mockCards[0],
                id: 500 + i,
                name: `Fusion ${i}`,
                type: 'Fusion Monster'
            }));
            return Promise.resolve({ data: cards });
        });

        renderWithProviders(<CreateDeckPage />);
        const searchInput = screen.getByPlaceholderText(/Nome da Carta/i);
        
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: 'Fusion' } });
            jest.advanceTimersByTime(800);
        });

        const cards = await screen.findAllByText(/Fusion/);
        
        for (let i = 0; i < 16; i++) {
            await act(async () => {
                fireEvent.click(cards[i].closest('.card-item')!);
            });
        }

        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Limite de 15 cartas excedido para o Deck Extra'));
        
        const deckTab = screen.getByRole('button', { name: /Meu Deck/i });
        expect(deckTab).toHaveTextContent('15');
    });
});