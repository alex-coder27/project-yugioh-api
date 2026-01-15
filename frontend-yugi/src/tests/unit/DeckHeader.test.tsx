import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeckHeader from '../../components/deck-builder/DeckHeader';
import { ThemeProvider } from '../../hooks/useTheme';

jest.mock('../../components/shared/ThemeToggleButton/ThemeToggleButton', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const renderWithProvider = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('DeckHeader Component', () => {
    const mockOnSave = jest.fn();
    const mockOnBack = jest.fn();
    const mockOnNameChange = jest.fn();
    const mockOnToggleBanished = jest.fn();

    const defaultProps = {
        deckName: 'My Deck',
        totalMainDeck: 40,
        totalExtraDeck: 10,
        totalCards: 50,
        onSave: mockOnSave,
        onBack: mockOnBack,
        onNameChange: mockOnNameChange,
        includeBanishedCards: false,
        onToggleBanished: mockOnToggleBanished,
        editMode: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar nome do deck', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const nameInput = screen.getByDisplayValue('My Deck');
        expect(nameInput).toBeInTheDocument();
    });

    it('deve renderizar botões de voltar e salvar', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        expect(screen.getByText('< Voltar')).toBeInTheDocument();
        expect(screen.getByText('Salvar Deck')).toBeInTheDocument();
    });

    it('deve chamar onBack ao clicar no botão voltar', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const backButton = screen.getByText('< Voltar');
        fireEvent.click(backButton);

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onSave ao clicar no botão salvar', async () => {
        mockOnSave.mockResolvedValue(undefined);
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const saveButton = screen.getByText('Salvar Deck');
        fireEvent.click(saveButton);

        expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('deve chamar onNameChange ao editar nome do deck', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const nameInput = screen.getByDisplayValue('My Deck');
        fireEvent.change(nameInput, { target: { value: 'New Deck Name' } });

        expect(mockOnNameChange).toHaveBeenCalled();
    });

    it('deve exibir toggle de cartas proibidas em modo de edição', () => {
        renderWithProvider(<DeckHeader {...defaultProps} editMode={true} />);

        expect(screen.getByText(/Incluir Proibidas/i)).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('não deve exibir toggle de cartas proibidas quando não está em modo de edição', () => {
        renderWithProvider(<DeckHeader {...defaultProps} editMode={false} />);

        expect(screen.queryByText(/Incluir Proibidas/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('deve chamar onToggleBanished ao clicar no toggle', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(mockOnToggleBanished).toHaveBeenCalled();
    });

    it('deve marcar checkbox quando includeBanishedCards é true', () => {
        renderWithProvider(<DeckHeader {...defaultProps} includeBanishedCards={true} />);

        const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(true);
    });

    it('deve renderizar ThemeToggleButton', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('deve ter placeholder no input de nome', () => {
        renderWithProvider(<DeckHeader {...defaultProps} deckName="" />);

        const nameInput = screen.getByPlaceholderText('Nome do Deck');
        expect(nameInput).toBeInTheDocument();
    });

    it('deve ter id correto no input de nome', () => {
        renderWithProvider(<DeckHeader {...defaultProps} />);

        const nameInput = screen.getByDisplayValue('My Deck');
        expect(nameInput).toHaveAttribute('id', 'deck-name');
    });
});