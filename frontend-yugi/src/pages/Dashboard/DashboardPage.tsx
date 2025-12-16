import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import ThemeToggleButton from '../../components/shared/ThemeToggleButton/ThemeToggleButton';
import api from '../../services/api';

interface DeckCard {
    cardApiId: string;
    copies: number;
    isExtraDeck?: boolean;
}

interface Deck {
    id: number;
    name: string;
    userId: number;
    cards: DeckCard[];
    createdAt: string;
    updatedAt: string;
    mainDeckCount?: number;
    extraDeckCount?: number;
    mainDeckUnique?: number;
    extraDeckUnique?: number;
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    };

    const totalDecks = decks.length;

    if (loading || !user) { 
        return <div className="loading-state">Carregando informações do Duelista...</div>;
    }
    
    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-header">
                <div className="header-title-section">
                    <h1>Deck Builder</h1>
                    <p className="header-subtitle">Construa e gerencie seus decks de Yu-Gi-Oh!</p>
                </div>
                <div className="user-controls">
                    <div className="user-info">
                        <p className="welcome-text">Bem-vindo, <strong>{user.username}</strong>!</p>
                        <div className="user-stats">
                            <span className="stat-badge">{totalDecks} Decks</span>
                        </div>
                    </div>
                    <ThemeToggleButton variant="headerFixed" />
                    <button onClick={logout} className="logout-button">
                        <span className="logout-icon">↩️</span> LOGOUT
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <section className="decks-section">
                    <div className="section-header">
                        <div className="section-title">
                            <h2>Meus Decks</h2>
                        </div>
                        <div className="section-actions">
                            <button 
                                className="duelist-button primary create-deck-btn"
                                onClick={handleCreateDeck}
                            >
                                <span className="button-icon">+</span>
                                CRIAR NOVO DECK
                            </button>
                            <button 
                                className="refresh-button"
                                onClick={fetchDecks}
                                title="Recarregar decks"
                            >
                                🔄
                            </button>
                        </div>
                    </div>
                    
                    {isLoadingDecks ? (
                        <div className="loading-state-container">
                            <div className="loading-spinner"></div>
                            <p>Carregando seus decks...</p>
                        </div>
                    ) : deckError ? (
                        <div className="error-state-container">
                            <div className="error-icon">⚠️</div>
                            <p className="error-message">{deckError}</p>
                            <button onClick={fetchDecks} className="duelist-button secondary">
                                Tentar Novamente
                            </button>
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="empty-state-container">
                            <div className="empty-icon">🃏</div>
                            <h3>Você ainda não criou nenhum deck!</h3>
                            <p className="empty-hint">Comece a construir seu arsenal de cartas agora mesmo.</p>
                            <button 
                                className="duelist-button primary empty-state-btn"
                                onClick={handleCreateDeck}
                            >
                                <span className="button-icon">⚡</span>
                                CRIAR PRIMEIRO DECK
                            </button>
                        </div>
                    ) : (
                        <div className="deck-grid">
                            {decks.map(deck => {
                                const mainDeckTotal = deck.mainDeckCount || 0;
                                const extraDeckTotal = deck.extraDeckCount || 0;
                                const mainDeckUnique = deck.mainDeckUnique || 0;
                                const extraDeckUnique = deck.extraDeckUnique || 0;
                                const totalCards = mainDeckTotal + extraDeckTotal;
                                
                                return (
                                    <div key={deck.id} className="deck-card">
                                        <div className="deck-card-header">
                                            <div className="deck-title-wrapper">
                                                <h3 className="deck-name" title={deck.name}>
                                                    {deck.name}
                                                </h3>
                                                <span className="deck-id">#{deck.id}</span>
                                            </div>
                                            <div className="deck-meta">
                                                <span className="deck-date">
                                                    📅 {formatDate(deck.createdAt)}
                                                </span>
                                                <span className="deck-total">
                                                    🎴 {totalCards} cartas
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="deck-card-stats">
                                            <div className="stat-row">
                                                <div className="stat-item main-deck-stat">
                                                    <div className="stat-icon-container">
                                                        <span className="stat-icon">🃏</span>
                                                    </div>
                                                    <div className="stat-info">
                                                        <span className="stat-value">{mainDeckTotal}</span>
                                                        <span className="stat-label">Main Deck</span>
                                                        <span className="stat-sub-label">{mainDeckUnique} tipos</span>
                                                    </div>
                                                    <div className="stat-progress">
                                                        <div 
                                                            className="progress-bar main-progress"
                                                            style={{ width: `${(mainDeckTotal / 60) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="stat-item extra-deck-stat">
                                                    <div className="stat-icon-container">
                                                        <span className="stat-icon">✨</span>
                                                    </div>
                                                    <div className="stat-info">
                                                        <span className="stat-value">{extraDeckTotal}</span>
                                                        <span className="stat-label">Extra Deck</span>
                                                        <span className="stat-sub-label">{extraDeckUnique} tipos</span>
                                                    </div>
                                                    <div className="stat-progress">
                                                        <div 
                                                            className="progress-bar extra-progress"
                                                            style={{ width: `${(extraDeckTotal / 15) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="total-progress">
                                                <div className="progress-labels">
                                                    <span>Total: {totalCards}/75</span>
                                                    <span>{Math.round((totalCards / 75) * 100)}%</span>
                                                </div>
                                                <div className="progress-bar-container">
                                                    <div 
                                                        className="progress-bar total-progress-bar"
                                                        style={{ width: `${(totalCards / 75) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="deck-card-actions">
                                            <button 
                                                className="action-button view-button"
                                                onClick={() => handleViewDeck(deck.id)}
                                                title="Visualizar deck"
                                            >
                                                <span className="action-icon">👁️</span>
                                                <span className="action-text">Visualizar</span>
                                            </button>
                                            <button 
                                                className="action-button edit-button"
                                                onClick={() => handleEditDeck(deck.id)}
                                                title="Editar deck"
                                            >
                                                <span className="action-icon">✏️</span>
                                                <span className="action-text">Editar</span>
                                            </button>
                                            <button 
                                                className="action-button delete-button"
                                                onClick={() => handleDeleteDeck(deck.id, deck.name)}
                                                title="Deletar deck"
                                            >
                                                <span className="action-icon">🗑️</span>
                                                <span className="action-text">Deletar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <footer className="dashboard-footer">
                <p>Deck Builder © 2025 - Construa decks incríveis de Yu-Gi-Oh!</p>
            </footer>
        </div>
    );
};

export default DashboardPage;