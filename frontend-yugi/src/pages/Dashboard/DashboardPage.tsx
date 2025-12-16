import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import ThemeToggleButton from '../../components/shared/ThemeToggleButton/ThemeToggleButton';
import api from '../../services/api';

interface DeckCard {
    cardApiId: string;
    copies: number;
}

interface Deck {
    id: number;
    name: string;
    userId: number;
    cards: DeckCard[];
    createdAt: string;
    updatedAt: string;
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

    const getTotalCards = (deck: Deck) => {
        return deck.cards.reduce((sum, card) => sum + card.copies, 0);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
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
                        <h2>Meus Decks ({decks.length})</h2>
                        <button 
                            className="duelist-button primary"
                            onClick={handleCreateDeck}
                        >
                            + CRIAR NOVO DECK
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
                            <p>Você ainda não criou nenhum deck!</p>
                            <p className="hint">Comece a construir seu arsenal de cartas agora.</p>
                            <button 
                                className="duelist-button primary"
                                onClick={handleCreateDeck}
                            >
                                CRIAR PRIMEIRO DECK
                            </button>
                        </div>
                    ) : (
                        <div className="deck-grid">
                            {decks.map(deck => {
                                const totalCards = getTotalCards(deck);
                                const uniqueCards = deck.cards.length;
                                
                                return (
                                    <div key={deck.id} className="deck-card">
                                        <div className="deck-card-header">
                                            <h3 className="deck-name" title={deck.name}>
                                                {deck.name}
                                            </h3>
                                            <span className="deck-date">
                                                {formatDate(deck.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="deck-card-stats">
                                            <div className="stat-item">
                                                <span className="stat-icon">🎴</span>
                                                <div className="stat-info">
                                                    <span className="stat-value">{totalCards}</span>
                                                    <span className="stat-label">Total de Cartas</span>
                                                </div>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-icon">⭐</span>
                                                <div className="stat-info">
                                                    <span className="stat-value">{uniqueCards}</span>
                                                    <span className="stat-label">Cartas Únicas</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="deck-card-actions">
                                            <button 
                                                className="action-button view-button"
                                                onClick={() => handleViewDeck(deck.id)}
                                                title="Visualizar deck"
                                            >
                                                👁️ Visualizar
                                            </button>
                                            <button 
                                                className="action-button edit-button"
                                                onClick={() => handleEditDeck(deck.id)}
                                                title="Editar deck"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button 
                                                className="action-button delete-button"
                                                onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                                title="Deletar deck"
                                            >
                                                🗑️ Deletar
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
