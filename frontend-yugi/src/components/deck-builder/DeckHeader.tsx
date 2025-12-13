import React, { type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeckHeaderProps {
    deckName: string;
    onDeckNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSaveDeck: () => void;
}

const DeckHeader: React.FC<DeckHeaderProps> = ({ deckName, onDeckNameChange, onSaveDeck }) => {
    const navigate = useNavigate();

    return (
        <header className="deck-builder-header">
            <button onClick={() => navigate('/')} className="back-button">{'< Voltar'}</button>
            <input
                type="text"
                value={deckName}
                onChange={onDeckNameChange}
                className="deck-name-input"
                placeholder="Nome do Deck"
            />
            <button onClick={onSaveDeck} className="save-deck-button">Salvar Deck</button>
        </header>
    );
};

export default DeckHeader;