import React, { type ChangeEvent } from 'react';
import ThemeToggleButton from '../shared/ThemeToggleButton/ThemeToggleButton';

interface DeckHeaderProps {
    deckName: string;
    totalMainDeck: number;
    totalExtraDeck: number;
    totalCards: number;
    onSave: () => Promise<void>;
    onBack: () => void;
    onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    includeBanishedCards: boolean;
    onToggleBanished: () => void;
    editMode: boolean;
}

const DeckHeader: React.FC<DeckHeaderProps> = ({
    deckName,
    onSave,
    onBack,
    onNameChange,
    includeBanishedCards,
    onToggleBanished,
    editMode
}) => {
    return (
        <header className="deck-builder-header">
            <button onClick={onBack} className="back-button">{'< Voltar'}</button>
            <input
                type="text"
                value={deckName}
                onChange={onNameChange}
                className="deck-name-input"
                placeholder="Nome do Deck"
                id='deck-name'
            />

            {editMode && (
                <div className="banished-toggle-container">
                    <label className="toggle-switch small">
                        <input type="checkbox" checked={includeBanishedCards} onChange={onToggleBanished} />
                        <span className="slider round"></span>
                    </label>
                    <span className="toggle-label">Incluir Proibidas?</span>
                </div>
            )}
            
            <button onClick={onSave} className="save-deck-button">Salvar Deck</button>

            <ThemeToggleButton variant="headerInline" />
        </header>
    );
};

export default DeckHeader;