import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TabNavigation from '../TabNavigation';

describe('TabNavigation Component', () => {
    const mockOnTabChange = jest.fn();

    beforeEach(() => {
        mockOnTabChange.mockClear();
    });

    it('deve renderizar ambas as abas', () => {
        render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        expect(screen.getByText(/Buscar Cartas/i)).toBeInTheDocument();
        expect(screen.getByText(/Meu Deck/i)).toBeInTheDocument();
    });

    it('deve exibir contagem total de cartas', () => {
        render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={42}
            />
        );

        expect(screen.getByText(/Meu Deck \(42\)/i)).toBeInTheDocument();
    });

    it('deve marcar aba search como ativa', () => {
        render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        const searchButton = screen.getByText(/Buscar Cartas/i).closest('button');
        expect(searchButton).toHaveClass('active');
    });

    it('deve marcar aba deck como ativa', () => {
        render(
            <TabNavigation
                activeTab="deck"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        const deckButton = screen.getByText(/Meu Deck/i).closest('button');
        expect(deckButton).toHaveClass('active');
    });

    it('deve chamar onTabChange com search ao clicar na aba', () => {
        render(
            <TabNavigation
                activeTab="deck"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        const searchButton = screen.getByText(/Buscar Cartas/i);
        fireEvent.click(searchButton);

        expect(mockOnTabChange).toHaveBeenCalledWith('search');
    });

    it('deve chamar onTabChange com deck ao clicar na aba', () => {
        render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        const deckButton = screen.getByText(/Meu Deck/i);
        fireEvent.click(deckButton);

        expect(mockOnTabChange).toHaveBeenCalledWith('deck');
    });

    it('não deve adicionar classe active em ambas abas simultaneamente', () => {
        const { rerender } = render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        const searchButton = screen.getByText(/Buscar Cartas/i).closest('button');
        const deckButton = screen.getByText(/Meu Deck/i).closest('button');

        expect(searchButton).toHaveClass('active');
        expect(deckButton).not.toHaveClass('active');

        rerender(
            <TabNavigation
                activeTab="deck"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        expect(searchButton).not.toHaveClass('active');
        expect(deckButton).toHaveClass('active');
    });

    it('deve exibir 0 cartas quando deck está vazio', () => {
        render(
            <TabNavigation
                activeTab="search"
                onTabChange={mockOnTabChange}
                totalCards={0}
            />
        );

        expect(screen.getByText(/Meu Deck \(0\)/i)).toBeInTheDocument();
    });
});