import React from 'react';
import type { Card } from './utils';

interface CardDetailsPanelProps {
    card: Card;
    onClose: () => void;
}

const CardDetailsPanel: React.FC<CardDetailsPanelProps> = ({ card, onClose }) => {
    const banlistStatus = card.banlist_info?.ban_tcg;

    return (
        <div className="card-details-panel">
            <div className="card-details-header">
                <h3>Detalhes da Carta</h3>
                <button
                    onClick={onClose}
                    className="close-details-btn"
                >
                    ✕
                </button>
            </div>

            <div className="card-details-content">
                <div className="card-details-image">
                    <img
                        src={card.card_images?.[0]?.image_url || card.card_images?.[0]?.image_url_small || ''}
                        alt={card.name}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/300x420/333/fff?text=Imagem+Não+Disponível';
                        }}
                        loading="lazy"
                    />
                </div>

                <div className="card-details-info">
                    <h2 className="card-details-name">{card.name}</h2>
                    <div className="card-details-type">{card.type}</div>

                    {banlistStatus && banlistStatus !== 'Unlimited' && (
                        <div className={`card-banlist-status ${banlistStatus.toLowerCase()}`}>
                            {banlistStatus === 'Forbidden' ? 'PROIBIDA' :
                                banlistStatus === 'Limited' ? 'LIMITADA (1)' :
                                    'SEMI-LIMITADA (2)'}
                        </div>
                    )}

                    <div className="card-details-stats">
                        {card.attribute && (
                            <div className="detail-stat">
                                <span className="stat-label">Atributo:</span>
                                <span className="stat-value">{card.attribute}</span>
                            </div>
                        )}
                        {card.race && (
                            <div className="detail-stat">
                                <span className="stat-label">Raça/Tipo:</span>
                                <span className="stat-value">{card.race}</span>
                            </div>
                        )}
                        {card.level && (
                            <div className="detail-stat">
                                <span className="stat-label">Nível:</span>
                                <span className="stat-value">{card.level}⭐</span>
                            </div>
                        )}
                        {card.atk && (
                            <div className="detail-stat">
                                <span className="stat-label">ATK:</span>
                                <span className="stat-value">{card.atk}</span>
                            </div>
                        )}
                        {card.def && (
                            <div className="detail-stat">
                                <span className="stat-label">DEF:</span>
                                <span className="stat-value">{card.def}</span>
                            </div>
                        )}
                        {card.archetype && (
                            <div className="detail-stat">
                                <span className="stat-label">Arquétipo:</span>
                                <span className="stat-value">{card.archetype}</span>
                            </div>
                        )}
                    </div>

                    <div className="card-details-description">
                        <h4>Descrição:</h4>
                        <p>{card.desc}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardDetailsPanel;