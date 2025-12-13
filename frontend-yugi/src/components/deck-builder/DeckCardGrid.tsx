// src/components/deck-builder/DeckCardGrid.tsx
import React from 'react';
import { type DeckCardItem, isExtraDeckCard } from './utils';

interface DeckCardGridProps {
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

const DeckCardGrid: React.FC<DeckCardGridProps> = ({
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
    const allDeckCards = [...mainDeckCards, ...extraDeckCards];

    if (allDeckCards.length === 0) {
        return <p className="empty-deck-message">Seu deck está vazio. Vá para a aba "Buscar Cartas" para adicionar cartas.</p>;
    }

    return (
        <div className="deck-view-container">
            <div className="deck-stats">
                <div className="deck-stat">
                    <span className="stat-label">Deck Principal:</span>
                    <span className={`stat-value ${totalMainDeck < 40 ? 'stat-warning' : totalMainDeck > 60 ? 'stat-error' : ''}`}>
                        {totalMainDeck}/60 cartas
                    </span>
                    {totalMainDeck < 40 && <span className="stat-note"> (Mínimo: 40)</span>}
                </div>
                <div className="deck-stat">
                    <span className="stat-label">Deck Extra:</span>
                    <span className={`stat-value ${totalExtraDeck > 15 ? 'stat-error' : ''}`}>
                        {totalExtraDeck}/15 cartas
                    </span>
                </div>
                <div className="deck-stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{totalMainDeck + totalExtraDeck} cartas</span>
                </div>
            </div>

            <div className="deck-cards-grid">
                {allDeckCards.map((item) => (
                    <div
                        key={item.id}
                        className="deck-card-item-view"
                        onDoubleClick={() => onCardDetails(item)}
                        onMouseEnter={() => onCardHover(item)}
                        onMouseLeave={onCardLeave}
                    >
                        <div className="deck-card-count">{item.count}x</div>
                        <img
                            src={item.card_images?.[0]?.image_url_small || ''}
                            alt={item.name}
                            className="deck-card-image"
                            onError={onImageError}
                            loading="lazy"
                        />
                        <div className="deck-card-info">
                            <div className="deck-card-name">{item.name}</div>
                            <div className="deck-card-type">{item.type}</div>
                            {isExtraDeckCard(item) && (
                                <div className="deck-card-extra-tag">Extra Deck</div>
                            )}
                        </div>
                        <button
                            onClick={() => onRemoveCard(item.id, isExtraDeckCard(item))}
                            className="remove-deck-card-button"
                        >
                            Remover
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeckCardGrid;