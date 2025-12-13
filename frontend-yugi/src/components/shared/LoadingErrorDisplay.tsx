import React from 'react';

interface LoadingErrorDisplayProps {
    isLoading: boolean;
    error: string | null;
    hasShortTermOnly: boolean;
    hasResults: boolean;
    searchTerm: string;
    onRetry: () => void;
}

const LoadingErrorDisplay: React.FC<LoadingErrorDisplayProps> = ({
    isLoading,
    error,
    hasShortTermOnly,
    hasResults,
    searchTerm,
    onRetry
}) => {
    if (isLoading) {
        return (
            <div className="message-container">
                <p className="loading-message">Carregando cartas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">{error}</p>
                {hasShortTermOnly && (
                    <p className="hint-message">Digite pelo menos 3 caracteres para buscar.</p>
                )}
                <div className="error-with-button-container">
                    <button 
                        onClick={onRetry}
                        className="refresh-button"
                    >
                        ↻ Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="empty-search-container">
                <p className="empty-search-message">
                    {hasShortTermOnly ? 'Digite pelo menos 3 caracteres para buscar.' :
                     searchTerm ? 'Nenhuma carta encontrada. Tente outros termos.' : 
                     'Digite um nome para buscar cartas.'}
                </p>
                {searchTerm.length >= 3 && (
                    <div className="error-with-button-container">
                        <button 
                            onClick={onRetry}
                            className="refresh-button"
                        >
                            ↻ Buscar Novamente
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default LoadingErrorDisplay;