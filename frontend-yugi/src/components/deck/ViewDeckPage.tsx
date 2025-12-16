import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

import '../../pages/CreateDeck/CreateDeckPage.css';
import './DeckPage.css';
import ThemeToggleButton from '../shared/ThemeToggleButton/ThemeToggleButton';
import {
    isExtraDeckCard,
    isForbidden,
    isLimited,
    isSemiLimited
} from '../../components/deck-builder/utils';

interface DeckCard {
    cardApiId: number;
    copies: number;
}

interface CardDetails {
    id: number;
    name: string;
    type: string;
    atk?: number;
    def?: number;
    card_images?: Array<{ image_url_small: string }>;
    banlist_info?: { ban_tcg?: string };
    copies: number;
}

const ViewDeckPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deckName, setDeckName] = useState('');
    const [cardsDetails, setCardsDetails] = useState<CardDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'main' | 'extra'>('main');

    useEffect(() => {
        const fetchDeckData = async () => {
            try {
                const response = await api.get(`/decks/${id}`);
                const deckData = response.data.deck;
                setDeckName(deckData.name);

                if (deckData.cards?.length > 0) {
                    const details = await Promise.all(
                        deckData.cards.map(async (item: DeckCard) => {
                            try {
                                const cardRes = await api.get('/cards', { params: { id: item.cardApiId } });
                                const apiData = Array.isArray(cardRes.data) ? cardRes.data[0] : cardRes.data;
                                return { ...apiData, copies: item.copies };
                            } catch { return null; }
                        })
                    );
                    setCardsDetails(details.filter((d): d is CardDetails => d !== null));
                }
            } catch (err) {
                console.error("Erro ao carregar deck", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDeckData();
    }, [id]);

    const mainDeck = cardsDetails.filter(card => !isExtraDeckCard(card as any));
    const extraDeck = cardsDetails.filter(card => isExtraDeckCard(card as any));

    const renderCard = (card: CardDetails) => {
        const forbidden = isForbidden(card as any);
        const limited = isLimited(card as any);
        const semiLimited = isSemiLimited(card as any);

        return (
            <div
                key={card.id}
                className={`deck-card-item ${forbidden ? 'forbidden' : ''} ${limited ? 'limited' : ''} ${semiLimited ? 'semi-limited' : ''}`}
            >
                <div className="card-image-container">
                    <img
                        src={card.card_images?.[0]?.image_url_small || 'https://i.imgur.com/kS9eCgP.png'}
                        alt={card.name}
                        className="card-image"
                    />

                    <div className="deck-card-count">
                        {card.copies}x
                    </div>

                    {forbidden && <div className="banlist-tag forbidden">PROIBIDA</div>}
                    {limited && <div className="banlist-tag limited">LIMITADA (1)</div>}
                    {semiLimited && <div className="banlist-tag semi-limited">SEMI-LIMITADA (2)</div>}
                </div>

                <div className="card-info">
                    <h3 className="card-name">{card.name}</h3>
                    <p className="card-type">{card.type}</p>
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-container">Carregando Deck...</div>;

    return (
        <div className="create-deck-wrapper view-mode">
            <header className="deck-builder-header">
                <button onClick={() => navigate('/dashboard')} className="back-button">{'< Voltar'}</button>
                
                <div className="deck-name-input">
                    {deckName}
                </div>

                <button 
                    onClick={() => navigate(`/deck/edit/${id}`)} 
                    className="save-deck-button"
                >
                    Editar Deck
                </button>

                <ThemeToggleButton variant="headerInline" />
            </header>

            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
                    onClick={() => setActiveTab('main')}
                >
                    Main Deck ({mainDeck.reduce((acc, c) => acc + c.copies, 0)})
                </button>
                <button
                    className={`tab-button ${activeTab === 'extra' ? 'active' : ''}`}
                    onClick={() => setActiveTab('extra')}
                >
                    Extra Deck ({extraDeck.reduce((acc, c) => acc + c.copies, 0)})
                </button>
            </div>

            <main className="deck-view-container" >
                <div className="deck-cards-grid">
                    {activeTab === 'main' ? (
                        mainDeck.map(renderCard)
                    ) : (
                        extraDeck.map(renderCard)
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewDeckPage;