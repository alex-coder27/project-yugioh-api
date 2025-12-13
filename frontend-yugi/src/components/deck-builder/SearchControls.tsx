import React, { type ChangeEvent } from 'react';
import {
    CARD_TYPES,
    MONSTER_ATTRIBUTES,
    MONSTER_RACES,
    SPELL_TRAP_SUBTYPES,
    LEVELS,
    ATK_FILTERS,
    DEF_FILTERS // ADICIONADO: Importar filtros de DEF
} from './utils';

interface SearchControlsProps {
    searchTerm: string;
    selectedType: string;
    selectedAttribute: string;
    selectedRace: string;
    levelSearch: string;
    atkSearch: string;
    defSearch: string; // ADICIONADO: filtro de DEF
    includeBanishedCards: boolean;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onAttributeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onSubtypeChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onLevelChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onAtkChange: (e: ChangeEvent<HTMLSelectElement>) => void;
    onDefChange: (e: ChangeEvent<HTMLSelectElement>) => void; // ADICIONADO: handler de DEF
    onBanishedToggle: () => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({
    searchTerm,
    selectedType,
    selectedAttribute,
    selectedRace,
    levelSearch,
    atkSearch,
    defSearch, // ADICIONADO
    includeBanishedCards,
    onSearchChange,
    onTypeChange,
    onAttributeChange,
    onSubtypeChange,
    onLevelChange,
    onAtkChange,
    onDefChange, // ADICIONADO
    onBanishedToggle
}) => {
    const isMonsterCard = selectedType && !['Spell Card', 'Trap Card'].includes(selectedType);
    const isSpellTrapCard = selectedType === 'Spell Card' || selectedType === 'Trap Card';
    const raceOptions = isSpellTrapCard ? SPELL_TRAP_SUBTYPES : MONSTER_RACES;

    return (
        <div className="search-controls">
            <div className="search-input-with-icon">
                <input
                    type="text"
                    placeholder="Nome da Carta (mínimo 3 caracteres)"
                    value={searchTerm}
                    onChange={onSearchChange}
                    className="search-input"
                    minLength={3}
                />
            </div>

            <select
                value={selectedType}
                onChange={onTypeChange}
                className="filter-select"
            >
                {CARD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                ))}
            </select>

            {isSpellTrapCard && (
                <select
                    value={selectedRace}
                    onChange={onSubtypeChange}
                    className="filter-select"
                >
                    {raceOptions.map(subtype => (
                        <option key={subtype.value} value={subtype.value}>{subtype.label}</option>
                    ))}
                </select>
            )}

            {isMonsterCard && (
                <>
                    <select
                        value={selectedAttribute}
                        onChange={onAttributeChange}
                        className="filter-select"
                    >
                        {MONSTER_ATTRIBUTES.map(attr => (
                            <option key={attr.value} value={attr.value}>{attr.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedRace}
                        onChange={onSubtypeChange}
                        className="filter-select"
                    >
                        {MONSTER_RACES.map(race => (
                            <option key={race.value} value={race.value}>{race.label}</option>
                        ))}
                    </select>

                    <select
                        value={levelSearch}
                        onChange={onLevelChange}
                        className="filter-select"
                    >
                        {LEVELS.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                    </select>

                    <select
                        value={atkSearch}
                        onChange={onAtkChange}
                        className="filter-select"
                    >
                        {ATK_FILTERS.map(atk => (
                            <option key={atk.value} value={atk.value}>{atk.label}</option>
                        ))}
                    </select>

                    <select
                        value={defSearch}
                        onChange={onDefChange}
                        className="filter-select"
                    >
                        {DEF_FILTERS.map(def => ( // ADICIONADO: Filtro de DEF
                            <option key={def.value} value={def.value}>{def.label}</option>
                        ))}
                    </select>
                </>
            )}

            <div className="toggle-container">
                <label className="toggle-switch">
                    <input type="checkbox" checked={includeBanishedCards} onChange={onBanishedToggle} />
                    <span className="slider"></span>
                </label>
                <span className="toggle-label">Incluir Proibidas?</span>
            </div>
        </div>
    );
};

export default SearchControls;