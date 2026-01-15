import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardGrid from '../../components/deck-builder/CardGrid';
import type { Card, DeckCardItem } from '../../components/deck-builder/utils';

const mockCards: Card[] = [
    {
        id: 1,
        name: 'Blue-Eyes White Dragon',
        type: 'Normal Monster',
        desc: 'Powerful dragon',
        atk: 3000,
        def: 2500,
        card_images: [{ id: 1, image_url: 'url1', image_url_small: 'url1_small' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
    {
        id: 2,
        name: 'Dark Magician',
        type: 'Normal Monster',
        desc: 'Ultimate wizard',
        atk: 2500,
        def: 2100,
        card_images: [{ id: 2, image_url: 'url2', image_url_small: 'url2_small' }],
        banlist_info: { ban_tcg: 'Unlimited' },
    },
    {
        id: 3,
        name: 'Pot of Greed',
        type: 'Spell Card',
        desc: 'Draw 2 cards',
        card_images: [{ id: 3, image_url: 'url3', image_url_small: 'url3_small' }],
        banlist_info: { ban_tcg: 'Forbidden' },
    },
];

const mockMainDeckCards: DeckCardItem[] = [
    { ...mockCards[0], count: 2 },
];

const mockExtraDeckCards: DeckCardItem[] = [];

describe('CardGrid Component', () => {
    const mockOnAddCard = jest.fn();
    const mockOnCardDetails = jest.fn();
    const mockOnCardHover = jest.fn();
    const mockOnCardLeave = jest.fn();
    const mockOnImageError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve renderizar todas as cartas', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
        expect(screen.getByText('Dark Magician')).toBeInTheDocument();
        expect(screen.getByText('Pot of Greed')).toBeInTheDocument();
    });

    it('deve exibir contador de cópias para cartas no deck', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('2x')).toBeInTheDocument();
    });

    it('deve adicionar classe in-deck para cartas já no deck', () => {
        const { container } = render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const cardItems = container.querySelectorAll('.card-item');
        expect(cardItems[0]).toHaveClass('in-deck');
        expect(cardItems[1]).not.toHaveClass('in-deck');
    });

    it('deve exibir tag de carta proibida', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText('PROIBIDA')).toBeInTheDocument();
    });

    it('deve chamar onAddCard ao clicar na carta', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.card-item');
        fireEvent.click(cardElement!);

        expect(mockOnAddCard).toHaveBeenCalledWith(mockCards[1]);
    });

    it('deve chamar onCardDetails ao dar duplo clique', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.card-item');
        fireEvent.doubleClick(cardElement!);

        expect(mockOnCardDetails).toHaveBeenCalledWith(mockCards[1]);
    });

    it('deve chamar onCardHover ao passar mouse', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.card-item');
        fireEvent.mouseEnter(cardElement!);

        expect(mockOnCardHover).toHaveBeenCalledWith(mockCards[1]);
    });

    it('deve chamar onCardLeave ao sair com mouse', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const cardElement = screen.getByText('Dark Magician').closest('.card-item');
        fireEvent.mouseLeave(cardElement!);

        expect(mockOnCardLeave).toHaveBeenCalled();
    });

    it('deve exibir estatísticas ATK/DEF quando disponíveis', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.getByText(/ATK: 3000/)).toBeInTheDocument();
        expect(screen.getByText(/DEF: 2500/)).toBeInTheDocument();
    });

    it('não deve exibir ATK/DEF para cartas de magia', () => {
        render(
            <CardGrid
                cards={[mockCards[2]]}
                mainDeckCards={[]}
                extraDeckCards={[]}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        expect(screen.queryByText(/ATK:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/DEF:/)).not.toBeInTheDocument();
    });

    it('deve chamar onImageError quando imagem falha ao carregar', () => {
        render(
            <CardGrid
                cards={mockCards}
                mainDeckCards={mockMainDeckCards}
                extraDeckCards={mockExtraDeckCards}
                onAddCard={mockOnAddCard}
                onCardDetails={mockOnCardDetails}
                onCardHover={mockOnCardHover}
                onCardLeave={mockOnCardLeave}
                onImageError={mockOnImageError}
            />
        );

        const images = screen.getAllByRole('img');
        fireEvent.error(images[0]);

        expect(mockOnImageError).toHaveBeenCalled();
    });
});