import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import ThemeToggleButton from '../../components/shared/ThemeToggleButton/ThemeToggleButton';
import api from '../../services/api';

interface DeckCard {
    cardApiId: number;
    copies: number;
}

interface Deck {
    id: number;
    name: string;
    userId: number;
    cards: DeckCard[];
    createdAt?: string;
    updatedAt?: string;
}

const DashboardPage: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [isLoadingDecks, setIsLoadingDecks] = useState(true);
    const [deckError, setDeckError] = useState<string | null>(null);

    const fetchDecks = async () => {
        try {
            setIsLoadingDecks(true);
            setDeckError(null);
            const response = await api.get('/decks');
            setDecks(response.data.decks || []);
        } catch (error: any) {
            console.error('Erro ao buscar decks:', error);
            setDeckError('Erro ao carregar seus decks. Tente novamente mais tarde.');
        } finally {
            setIsLoadingDecks(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDecks();
        }
    }, [user]);

    const handleCreateDeck = () => {
        navigate('/deck/create');
    };

    const handleViewDeck = (deckId: number) => {
        navigate(`/deck/${deckId}`);
    };

    const handleEditDeck = (deckId: number) => {
        navigate(`/deck/edit/${deckId}`);
    };

    const handleDeleteDeck = async (deckId: number, deckName: string) => {
        if (window.confirm(`Tem certeza que deseja deletar o deck "${deckName}"?`)) {
            try {
                await api.delete(`/decks/${deckId}`);
                setDecks(decks.filter(deck => deck.id !== deckId));
                alert('Deck deletado com sucesso!');
            } catch (error) {
                console.error('Erro ao deletar deck:', error);
                alert('Erro ao deletar o deck. Tente novamente.');
            }
        }
    };

    const calculateDeckStats = (deck: Deck) => {
        const totalCards = deck.cards.reduce((sum, card) => sum + card.copies, 0);
        const uniqueCards = deck.cards.length;
        
        return {
            totalCards,
            uniqueCards,
            mainDeckCount: totalCards,
            extraDeckCount: 0,
        };
    };

    if (loading || !user) { 
        return <div className="loading-state">Carregando informações do Duelista...</div>;
    }
    
    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <h1>Deck Builder</h1>
                <div className="user-controls">
                    <p>Bem-vindo, {user.username}!</p>
                    <ThemeToggleButton variant="headerFixed" />
                    <button onClick={logout} className="logout-button">LOGOUT</button>
                </div>
            </header>

            <main className="dashboard-main">
                <section className="decks-section">
                    <div className="decks-header">
                        <h2>Meus Decks</h2>
                        <button 
                            className="duelist-button primary"
                            onClick={handleCreateDeck}
                        >
                            CRIAR NOVO DECK
                        </button>
                    </div>
                    
                    {isLoadingDecks ? (
                        <div className="loading-decks">
                            <p>Carregando seus decks...</p>
                        </div>
                    ) : deckError ? (
                        <div className="deck-error">
                            <p>{deckError}</p>
                            <button onClick={fetchDecks} className="refresh-button">
                                Tentar Novamente
                            </button>
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="deck-list-placeholder">
                            <p>Comece a construir seu arsenal de cartas!</p>
                            <button 
                                className="duelist-button primary"
                                onClick={handleCreateDeck}
                            >
                                CRIAR NOVO DECK
                            </button>
                        </div>
                    ) : (
                        <div className="deck-grid">
                            {decks.map(deck => {
                                const stats = calculateDeckStats(deck);
                                
                                return (
                                    <div key={deck.id} className="deck-card">
                                        <div className="deck-card-header">
                                            <h3 className="deck-name">{deck.name}</h3>
                                            <span className="deck-date">
                                                ID: {deck.id} • Cartas: {stats.totalCards}
                                            </span>
                                        </div>
                                        
                                        <div className="deck-card-stats">
                                            <div className="stat-item">
                                                <span className="stat-label">Total:</span>
                                                <span className="stat-value">{stats.totalCards}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Únicas:</span>
                                                <span className="stat-value">{stats.uniqueCards}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Main:</span>
                                                <span className="stat-value">{stats.mainDeckCount}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="deck-card-actions">
                                            <button 
                                                className="action-button view-button"
                                                onClick={() => handleViewDeck(deck.id)}
                                            >
                                                Visualizar
                                            </button>
                                            <button 
                                                className="action-button edit-button"
                                                onClick={() => handleEditDeck(deck.id)}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="action-button delete-button"
                                                onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DashboardPage;