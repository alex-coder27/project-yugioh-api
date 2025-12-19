import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CardDetailsPanel from '../CardDetailsPanel';
import type { Card } from '../utils';

const mockCard: Card = {
    id: 12345,
    name: 'Blue-Eyes White Dragon',
    type: 'Normal Monster',
    desc: 'This legendary dragon is a powerful engine of destruction.',
    attribute: 'LIGHT',
    race: 'Dragon',
    level: 8,
    atk: 3000,
    def: 2500,
    archetype: 'Blue-Eyes',
    card_images: [
        {
            id: 12345,
            image_url: 'https://example.com/card.jpg',
            image_url_small: 'https://example.com/card_small.jpg',
        },
    ],
    banlist_info: {
        ban_tcg: 'Unlimited',
    },
};

const mockForbiddenCard: Card = {
    ...mockCard,
    id: 67890,
    name: 'Pot of Greed',
    banlist_info: {
        ban_tcg: 'Forbidden',
    },
};

const mockLimitedCard: Card = {
    ...mockCard,
    id: 11111,
    name: 'Raigeki',
    banlist_info: {
        ban_tcg: 'Limited',
    },
};

describe('CardDetailsPanel Component', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        mockOnClose.mockClear();
    });

    it('deve renderizar detalhes básicos da carta', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        expect(screen.getByText('Detalhes da Carta')).toBeInTheDocument();
        expect(screen.getByText('Blue-Eyes White Dragon')).toBeInTheDocument();
        expect(screen.getByText('Normal Monster')).toBeInTheDocument();
        expect(screen.getByText(/This legendary dragon/i)).toBeInTheDocument();
    });

    it('deve exibir estatísticas do monstro', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        expect(screen.getByText('Atributo:')).toBeInTheDocument();
        expect(screen.getByText('LIGHT')).toBeInTheDocument();
        expect(screen.getByText('Raça/Tipo:')).toBeInTheDocument();
        expect(screen.getByText('Dragon')).toBeInTheDocument();
        expect(screen.getByText('Nível:')).toBeInTheDocument();
        expect(screen.getByText('8⭐')).toBeInTheDocument();
        expect(screen.getByText('ATK:')).toBeInTheDocument();
        expect(screen.getByText('3000')).toBeInTheDocument();
        expect(screen.getByText('DEF:')).toBeInTheDocument();
        expect(screen.getByText('2500')).toBeInTheDocument();
    });

    it('deve exibir arquétipo quando disponível', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        expect(screen.getByText('Arquétipo:')).toBeInTheDocument();
        expect(screen.getByText('Blue-Eyes')).toBeInTheDocument();
    });

    it('deve exibir status de carta proibida', () => {
        render(<CardDetailsPanel card={mockForbiddenCard} onClose={mockOnClose} />);

        expect(screen.getByText('PROIBIDA')).toBeInTheDocument();
        const statusElement = screen.getByText('PROIBIDA');
        expect(statusElement).toHaveClass('forbidden');
    });

    it('deve exibir status de carta limitada', () => {
        render(<CardDetailsPanel card={mockLimitedCard} onClose={mockOnClose} />);

        expect(screen.getByText('LIMITADA (1)')).toBeInTheDocument();
        const statusElement = screen.getByText('LIMITADA (1)');
        expect(statusElement).toHaveClass('limited');
    });

    it('não deve exibir status quando carta é ilimitada', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        expect(screen.queryByText('PROIBIDA')).not.toBeInTheDocument();
        expect(screen.queryByText('LIMITADA')).not.toBeInTheDocument();
        expect(screen.queryByText('SEMI-LIMITADA')).not.toBeInTheDocument();
    });

    it('deve chamar onClose ao clicar no botão fechar', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('deve exibir imagem da carta', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        const image = screen.getByAltText('Blue-Eyes White Dragon');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/card.jpg');
    });

    it('deve usar imagem placeholder quando há erro no carregamento', () => {
        render(<CardDetailsPanel card={mockCard} onClose={mockOnClose} />);

        const image = screen.getByAltText('Blue-Eyes White Dragon') as HTMLImageElement;
        fireEvent.error(image);

        expect(image.src).toContain('placeholder');
    });

    it('não deve exibir estatísticas ausentes', () => {
        const cardWithoutStats: Card = {
            ...mockCard,
            attribute: undefined,
            level: undefined,
            atk: undefined,
            def: undefined,
            archetype: undefined,
        };

        render(<CardDetailsPanel card={cardWithoutStats} onClose={mockOnClose} />);

        expect(screen.queryByText('Atributo:')).not.toBeInTheDocument();
        expect(screen.queryByText('Nível:')).not.toBeInTheDocument();
        expect(screen.queryByText('ATK:')).not.toBeInTheDocument();
        expect(screen.queryByText('DEF:')).not.toBeInTheDocument();
        expect(screen.queryByText('Arquétipo:')).not.toBeInTheDocument();
    });
});