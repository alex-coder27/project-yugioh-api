import React from 'react';
import type { Card } from './utils';
import { isForbidden, isLimited, isSemiLimited } from './utils';

interface CardGridProps {
    cards: Card[];
    onAddCard: (card: Card) => void;
    onCardDetails: (card: Card) => void;
    onCardHover: (card: Card) => void;
    onCardLeave: () => void;
    onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const CardGrid: React.FC<CardGridProps> = ({
    cards,
    onAddCard,
    onCardDetails,
    onCardHover,
    onCardLeave,
    onImageError
}) => {
    return (
        <div className="card-grid">
            {cards.map((card) => (
                <div
                    key={card.id}
                    className="card-item"
                    onClick={() => onAddCard(card)}
                    onDoubleClick={() => onCardDetails(card)}
                    onMouseEnter={() => onCardHover(card)}
                    onMouseLeave={onCardLeave}
                >
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
            ))}
        </div>
    );
};

export default CardGrid;