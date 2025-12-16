export interface BanlistInfo {
    ban_tcg: 'Limited' | 'Semi-Limited' | 'Forbidden' | 'Unlimited' | string;
}

export interface Card {
    id: number;
    name: string;
    type: string;
    desc: string;
    card_images?: { 
        id: number;
        image_url: string;
        image_url_small: string;
    }[];
    banlist_info?: {
        ban_tcg?: string;
        ban_goat?: string;
        limit_tcg?: string;
        limit_goat?: string;
    };
    attribute?: string;
    race?: string;
    archetype?: string; 
    level?: number | string | null;
    atk?: number | string | null;
    def?: number | string | null;
}

export interface DeckCardItem extends Card {
    count: number;
}

export interface CardQueryInput {
    fname?: string;
    type?: string;
    attribute?: string;
    race?: string;
    level?: string;
    atk?: string;
    def?: string;
    offset: string;
    num: string;
}

export type TabType = 'search' | 'deck';

export const MAX_MAIN_DECK = 60;
export const MIN_MAIN_DECK = 40;
export const MAX_EXTRA_DECK = 15;
export const PAGE_SIZE = 100;

export const CARD_TYPES = [
    { value: '', label: 'Tipo de Carta (Todos)' },
    { value: 'Effect Monster', label: 'Monstro de Efeito' },
    { value: 'Normal Monster', label: 'Monstro Normal' },
    { value: 'Fusion Monster', label: 'Monstro de Fusão' },
    { value: 'Synchro Monster', label: 'Monstro Sincro' },
    { value: 'XYZ Monster', label: 'Monstro XYZ' },
    { value: 'Link Monster', label: 'Monstro Link' },
    { value: 'Spell Card', label: 'Carta de Magia' },
    { value: 'Trap Card', label: 'Carta de Armadilha' }
];

export const MONSTER_ATTRIBUTES = [
    { value: '', label: 'Atributo' },
    { value: 'DARK', label: 'DARK' },
    { value: 'DIVINE', label: 'DIVINE' },
    { value: 'EARTH', label: 'EARTH' },
    { value: 'FIRE', label: 'FIRE' },
    { value: 'LIGHT', label: 'LIGHT' },
    { value: 'WATER', label: 'WATER' },
    { value: 'WIND', label: 'WIND' }
];

export const MONSTER_RACES = [
    { value: '', label: 'Raça' },
    { value: 'Aqua', label: 'Aqua' },
    { value: 'Beast', label: 'Beast' },
    { value: 'Beast-Warrior', label: 'Beast-Warrior' },
    { value: 'Creator-God', label: 'Creator-God' },
    { value: 'Cyberse', label: 'Cyberse' },
    { value: 'Dinosaur', label: 'Dinosaur' },
    { value: 'Divine-Beast', label: 'Divine-Beast' },
    { value: 'Dragon', label: 'Dragon' },
    { value: 'Fairy', label: 'Fairy' },
    { value: 'Fiend', label: 'Fiend' },
    { value: 'Fish', label: 'Fish' },
    { value: 'Insect', label: 'Insect' },
    { value: 'Machine', label: 'Machine' },
    { value: 'Plant', label: 'Plant' },
    { value: 'Psychic', label: 'Psychic' },
    { value: 'Pyro', label: 'Pyro' },
    { value: 'Reptile', label: 'Reptile' },
    { value: 'Rock', label: 'Rock' },
    { value: 'Spellcaster', label: 'Spellcaster' },
    { value: 'Thunder', label: 'Thunder' },
    { value: 'Warrior', label: 'Warrior' },
    { value: 'Winged Beast', label: 'Winged Beast' },
    { value: 'Wyrm', label: 'Wyrm' },
    { value: 'Zombie', label: 'Zombie' }
];

export const SPELL_TRAP_SUBTYPES = [
    { value: '', label: 'Subtipo' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Continuous', label: 'Continuous' },
    { value: 'Equip', label: 'Equip' },
    { value: 'Quick-Play', label: 'Quick-Play' },
    { value: 'Field', label: 'Field' },
    { value: 'Ritual', label: 'Ritual' },
    { value: 'Counter', label: 'Counter' }
];

export const LEVELS = [
    { value: '', label: 'Nível/Rank' },
    { value: '1', label: '1⭐' },
    { value: '2', label: '2⭐' },
    { value: '3', label: '3⭐' },
    { value: '4', label: '4⭐' },
    { value: '5', label: '5⭐' },
    { value: '6', label: '6⭐' },
    { value: '7', label: '7⭐' },
    { value: '8', label: '8⭐' },
    { value: '9', label: '9⭐' },
    { value: '10', label: '10⭐' },
    { value: '11', label: '11⭐' },
    { value: '12', label: '12⭐' }
];

export const ATK_FILTERS = [
    { value: '', label: 'ATK' },
    { value: 'asc', label: 'ATK: Menor para Maior' },
    { value: 'desc', label: 'ATK: Maior para Menor' },
    { value: '0', label: 'ATK: = 0' },
    { value: '1000', label: 'ATK: ≥ 1000' },
    { value: '1500', label: 'ATK: ≥ 1500' },
    { value: '2000', label: 'ATK: ≥ 2000' },
    { value: '2500', label: 'ATK: ≥ 2500' },
    { value: '3000', label: 'ATK: ≥ 3000' }
];

export const DEF_FILTERS = [
    { value: '', label: 'DEF' },
    { value: 'asc', label: 'DEF: Menor para Maior' },
    { value: 'desc', label: 'DEF: Maior para Menor' },
    { value: '0', label: 'DEF: = 0' },
    { value: '500', label: 'DEF: ≥ 500' },
    { value: '1000', label: 'DEF: ≥ 1000' },
    { value: '1500', label: 'DEF: ≥ 1500' },
    { value: '2000', label: 'DEF: ≥ 2000' },
    { value: '2500', label: 'DEF: ≥ 2500' },
    { value: '3000', label: 'DEF: ≥ 3000' }
];

export const isExtraDeckCard = (card: Card) => {
    const extraDeckTypes = ['Fusion Monster', 'Synchro Monster', 'XYZ Monster', 'Link Monster'];
    return extraDeckTypes.includes(card.type);
};

export const isForbidden = (card: Card) => {
    return card.banlist_info?.ban_tcg === 'Forbidden';
};

export const isLimited = (card: Card) => {
    return card.banlist_info?.ban_tcg === 'Limited';
};

export const isSemiLimited = (card: Card) => {
    return card.banlist_info?.ban_tcg === 'Semi-Limited';
};