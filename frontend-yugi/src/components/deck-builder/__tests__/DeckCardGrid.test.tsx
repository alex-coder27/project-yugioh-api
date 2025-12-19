import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeckCardGrid from '../DeckCardGrid';
import type { DeckCardItem } from '../utils';

const mockMainDeckCards: DeckCardItem[] = [
    {
        id: 1,
        name: 'Blue-Eyes White Dragon',
        type: 'Normal Monster',
        desc: 'Powerful dragon',
        count: 3,
        card_images: [{ id: 1, image_url: 'url1', image_url_small: 'url1_small' }],
    },
    {
        id: 2,
        name: 'Dark Magician',
        type: 'Normal Monster',
        desc: 'Ultimate wizard',
        count: 2,
        card_images: [{ id: 2, image_url: 'url2', image_url_small: 'url2_small' }],
    },
];

const mockExtraDeckCards: DeckCardItem[] = [
    {
        id: 3,
        name: 'Blue-Eyes Ultimate Dragon',
        type: 'Fusion Monster',
        desc: 'Fusion of 3 Blue-Eyes',
        count: 1,
        card_images: [{ id: 3, image_url: 'url3', image_url_small: 'url3_small' }],
    },
];

describe('DeckCardGrid Component', () => {
    const mockOnCardDetails = jest.fn();
    const mockOnCardHover = jest.fn();
    const mockOnCardLeave = jest.fn();
    const mockOnRemoveCard = jest.fn();
    const mockOnImageError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar mensagem quando deck está vazio', () => {
        render(
            <DeckCardGrid
                mainDeckCards={[]}
                extraDeckCards={[]}
                totalMainDeck={0}
                totalExtraDeck={0}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText(/Seu deck está vazio/i)).toBeInTheDocument();
    });

    it('deve exibir estatísticas do deck corretamente', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText(/Deck Principal:/i)).toBeInTheDocument();
        expect(screen.getByText(/5\/60 cartas/i)).toBeInTheDocument();
        expect(screen.getByText(/Deck Extra:/i)).toBeInTheDocument();
        expect(screen.getByText(/1\/15 cartas/i)).toBeInTheDocument();
        expect(screen.getByText(/Total:/i)).toBeInTheDocument();
        expect(screen.getByText(/6 cartas/i)).toBeInTheDocument();
    });

    it('deve mostrar aviso quando deck principal tem menos de 40 cartas', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={35}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText(/Mínimo: 40/i)).toBeInTheDocument();
        const statValue = screen.getByText(/35\/60 cartas/i);
        expect(statValue).toHaveClass('stat-warning');
    });

    it('deve mostrar erro quando deck principal excede 60 cartas', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={65}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const statValue = screen.getByText(/65\/60 cartas/i);
        expect(statValue).toHaveClass('stat-error');
    });

    it('deve mostrar erro quando deck extra excede 15 cartas', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={40}
                totalExtraDeck={16}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const statValue = screen.getByText(/16\/15 cartas/i);
        expect(statValue).toHaveClass('stat-error');
    });

    it('deve renderizar todas as cartas do deck', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
        expect(screen.getByText('Dark Magician')).toBeInTheDocument();
        expect(screen.getByText('Blue-Eyes Ultimate Dragon')).toBeInTheDocument();
    });

    it('deve exibir contador de cópias', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('3x')).toBeInTheDocument();
        expect(screen.getByText('2x')).toBeInTheDocument();
        expect(screen.getByText('1x')).toBeInTheDocument();
    });

    it('deve exibir tag Extra Deck para cartas do extra deck', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('Extra Deck')).toBeInTheDocument();
    });

    it('deve chamar onCardDetails ao dar duplo clique', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.deck-card-item-view');
        fireEvent.doubleClick(cardElement!);

        expect(mockOnCardDetails).toHaveBeenCalledWith(mockMainDeckCards[1]);
    });

    it('deve chamar onCardHover ao passar mouse', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.deck-card-item-view');
        fireEvent.mouseEnter(cardElement!);

        expect(mockOnCardHover).toHaveBeenCalledWith(mockMainDeckCards[1]);
    });

    it('deve chamar onRemoveCard ao clicar em remover', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const removeButtons = screen.getAllByText('Remover');
        fireEvent.click(removeButtons[0]);

        expect(mockOnRemoveCard).toHaveBeenCalledWith(1, false);
    });

    it('deve chamar onRemoveCard com isExtra true para cartas do extra deck', () => {
        render(
            <DeckCardGrid
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                totalMainDeck={5}
                totalExtraDeck={1}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onRemoveCard={mockOnRemoveCard}
                onImageError={mockOnImageError}
            />
        );

        const removeButtons = screen.getAllByText('Remover');
        fireEvent.click(removeButtons[2]);

        expect(mockOnRemoveCard).toHaveBeenCalledWith(3, true);
    });
});