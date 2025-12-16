import React from 'react';
import type { DeckCardItem } from './utils';
import DeckCardGrid from './DeckCardGrid';

interface DeckViewSectionProps {
    deckName: string;
    mainDeckCards: DeckCardItem[];
    extraDeckCards: DeckCardItem[];
    totalMainDeck: number;
    totalExtraDeck: number;
    onCardDetails: (card: DeckCardItem) => void;
    onCardHover: (card: DeckCardItem) => void;
    onCardLeave: () => void;
    onRemoveCard: (cardId: number, isExtra: boolean) => void;
    onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const DeckViewSection: React.FC<DeckViewSectionProps> = ({
    deckName,
    mainDeckCards,
    extraDeckCards,
    totalMainDeck,
    totalExtraDeck,
    onCardDetails,
    onCardHover,
    onCardLeave,
    onRemoveCard,
    onImageError
}) => {
    return (
        <section className="deck-view-section">
            <h2>Meu Deck: {deckName}</h2>
            <DeckCardGrid
                mainDeckCards={mainDeckCards}
                extraDeckCards={extraDeckCards}
                totalMainDeck={totalMainDeck}
                totalExtraDeck={totalExtraDeck}
                onCardDetails={onCardDetails}
                onCardHover={onCardHover}
                onCardLeave={onCardLeave}
                onRemoveCard={onRemoveCard}
                onImageError={onImageError}
            />
        </section>
    );
};

export default DeckViewSection;