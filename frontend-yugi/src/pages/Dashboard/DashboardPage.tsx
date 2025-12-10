import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const handleCreateDeck = () => {
        navigate('/deck/create');
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
                    
                    <button 
                        onClick={toggleTheme} 
                        className="theme-toggle"
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    
                    <button onClick={logout} className="logout-button">LOGOUT</button>
                    
                </div>
            </header>

            <main className="dashboard-main">
                <section className="decks-section">
                    <h2>Meus Decks</h2>
                    <div className="deck-list-placeholder">
                        <p>Comece a construir seu arsenal de cartas!</p>
                        <button 
                            className="duelist-button primary"
                            onClick={handleCreateDeck}
                        >
                            CRIAR NOVO DECK
                        </button>
                    </div>
                </section>
                
            </main>
        </div>
    );
};

export default DashboardPage;