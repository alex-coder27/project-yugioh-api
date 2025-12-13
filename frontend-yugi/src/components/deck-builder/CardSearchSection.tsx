import React, { type ChangeEvent } from 'react';
import type { Card } from './utils';
import SearchControls from './SearchControls';
import CardGrid from './CardGrid';
import LoadingErrorDisplay from '../shared/LoadingErrorDisplay';

interface CardSearchSectionProps {
    searchTerm: string;
    selectedType: string;
    selectedAttribute: string;
    selectedRace: string;
    levelSearch: string;
    atkSearch: string;
    defSearch: string;
    includeBanishedCards: boolean;
    cards: Card[];
    isLoading: boolean;
    fetchError: string | null;
    page: number;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onAttributeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSubtypeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onLevelChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onAtkChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onDefChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onBanishedToggle: () => void;
    onAddCard: (card: Card) => void;
    onCardDetails: (card: Card) => void;
    onCardHover: (card: Card) => void;
    onCardLeave: () => void;
    onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
    onRetry: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
}

const CardSearchSection: React.FC<CardSearchSectionProps> = ({
    searchTerm,
    selectedType,
    selectedAttribute,
    selectedRace,
    levelSearch,
    atkSearch,
    defSearch,
    includeBanishedCards,
    cards,
    isLoading,
    fetchError,
    page,
    onSearchChange,
    onTypeChange,
    onAttributeChange,
    onSubtypeChange,
    onLevelChange,
    onAtkChange,
    onDefChange,
    onBanishedToggle,
    onAddCard,
    onCardDetails,
    onCardHover,
    onCardLeave,
    onImageError,
    onRetry,
    onPrevPage,
    onNextPage
}) => {
    const hasShortTermOnly = searchTerm.trim().length > 0 && 
                           searchTerm.trim().length < 3 && 
                           !selectedType && 
                           !selectedAttribute && 
                           !selectedRace && 
                           !levelSearch && 
                           !atkSearch &&
                           !defSearch;

    const hasResults = cards.length > 0;

    return (
        <section className="card-search-section">
            <h2>Busca de Cartas</h2>
            <SearchControls
                searchTerm={searchTerm}
                selectedType={selectedType}
                selectedAttribute={selectedAttribute}
                selectedRace={selectedRace}
                levelSearch={levelSearch}
                atkSearch={atkSearch}
                defSearch={defSearch}
                includeBanishedCards={includeBanishedCards}
                onSearchChange={onSearchChange}
                onTypeChange={onTypeChange}
                onAttributeChange={onAttributeChange}
                onSubtypeChange={onSubtypeChange}
                onLevelChange={onLevelChange}
                onAtkChange={onAtkChange}
                onDefChange={onDefChange}
                onBanishedToggle={onBanishedToggle}
            />
            
            <LoadingErrorDisplay
                isLoading={isLoading}
                error={fetchError}
                hasShortTermOnly={hasShortTermOnly}
                hasResults={hasResults}
                searchTerm={searchTerm}
                onRetry={onRetry}
            />
            
            {hasResults && !isLoading && !fetchError && (
                <CardGrid
                    cards={cards}
                    onAddCard={onAddCard}
                    onCardDetails={onCardDetails}
                    onCardHover={onCardHover}
                    onCardLeave={onCardLeave}
                    onImageError={onImageError}
                />
            )}
            
            <div className="pagination-controls">
                <button onClick={onPrevPage} disabled={page === 0}>Página Anterior</button>
                <span>Página {page + 1}</span>
                <button onClick={onNextPage} disabled={cards.length < 100}>Próxima Página</button>
            </div>
        </section>
    );
};

export default CardSearchSection;