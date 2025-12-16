import React, { useMemo } from 'react';
import type { Card, DeckCardItem } from './utils';
import { isForbidden, isLimited, isSemiLimited } from './utils';

interface CardGridProps {
    cards: Card[];
    mainDeckCards: DeckCardItem[]; 
    extraDeckCards: DeckCardItem[]; 
    onAddCard: (card: Card) => void;
    onCardDetails: (card: Card) => void;
    onCardHover: (card: Card) => void;
    onCardLeave: () => void;
    onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const CardGrid: React.FC<CardGridProps> = ({
    cards,
    mainDeckCards,
    extraDeckCards,
    onAddCard,
    onCardDetails,
    onCardHover,
    onCardLeave,
    onImageError
}) => {
    const deckCardCounts = useMemo(() => {
        const counts = new Map<string, number>(); 
        
        [...mainDeckCards, ...extraDeckCards].forEach(item => {
            const normalizedName = item.name.trim().toLowerCase();
            counts.set(normalizedName, (counts.get(normalizedName) || 0) + item.count); 
        });
        
        return counts;
    }, [mainDeckCards, extraDeckCards]);

    return (
        <div className="card-grid">
            {cards.map((card) => {
                const normalizedName = card.name.trim().toLowerCase();
                const count = deckCardCounts.get(normalizedName) || 0; 

                return (
                    <div
                        key={card.id}
                        className={`card-item ${count > 0 ? 'in-deck' : ''}`}
                        onClick={() => onAddCard(card)}
                        onDoubleClick={() => onCardDetails(card)}
                        onMouseEnter={() => onCardHover(card)}
                        onMouseLeave={onCardLeave}
                    >
                        {count > 0 && <span className="deck-card-count">{count}x</span>}
                        
                        <img
                            src={card.card_images?.[0]?.image_url_small || ''}
                            alt={card.name}
                            className="card-image"
                            onError={onImageError}
                            loading="lazy"
                        />
                        {isForbidden(card) && (
                            <span className="banlist-tag forbidden">PROIBIDA</span>
                        )}
                        {isLimited(card) && (
                            <span className="banlist-tag limited">LIMITADA (1)</span>
                        )}
                        {isSemiLimited(card) && (
                            <span className="banlist-tag semi-limited">SEMI-LIMITADA (2)</span>
                        )}
                        <div className="card-info">
                            <div className="card-name">{card.name}</div>
                            <div className="card-type">{card.type}</div>
                            {(card.atk !== undefined || card.def !== undefined) && (
                                <div className="card-stats">
                                    {card.atk !== undefined && `ATK: ${card.atk}`}
                                    {card.atk !== undefined && card.def !== undefined && ' / '}
                                    {card.def !== undefined && `DEF: ${card.def}`}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CardGrid;