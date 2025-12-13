import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CreateDeckPage.css';

interface BanlistInfo {
    ban_tcg: 'Limited' | 'Semi-Limited' | 'Forbidden' | 'Unlimited' | string;
}

interface Card {
    id: number;
    name: string;
    type: string;
    desc: string;
    card_images: {
        id: number;
        image_url: string;
        image_url_small: string;
    }[];
    banlist_info?: BanlistInfo;
    attribute?: string;
    race?: string;
    level?: number;
    atk?: number | string;
    def?: number | string;
    archetype?: string;
}

interface DeckCardItem extends Card {
    count: number;
}

interface CardQueryInput {
    fname?: string;
    type?: string;
    attribute?: string;
    race?: string;
    level?: string;
    atk?: string;
    offset: string;
    num: string;
}

const MAX_MAIN_DECK = 60;
const MIN_MAIN_DECK = 40;
const MAX_EXTRA_DECK = 15;
const PAGE_SIZE = 100;

const CARD_TYPES = [
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

const MONSTER_ATTRIBUTES = [
    { value: '', label: 'Atributo' },
    { value: 'DARK', label: 'DARK' },
    { value: 'DIVINE', label: 'DIVINE' },
    { value: 'EARTH', label: 'EARTH' },
    { value: 'FIRE', label: 'FIRE' },
    { value: 'LIGHT', label: 'LIGHT' },
    { value: 'WATER', label: 'WATER' },
    { value: 'WIND', label: 'WIND' }
];

const MONSTER_RACES = [
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

const SPELL_TRAP_SUBTYPES = [
    { value: '', label: 'Subtipo' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Continuous', label: 'Continuous' },
    { value: 'Equip', label: 'Equip' },
    { value: 'Quick-Play', label: 'Quick-Play' },
    { value: 'Field', label: 'Field' },
    { value: 'Ritual', label: 'Ritual' },
    { value: 'Counter', label: 'Counter' }
];

const LEVELS = [
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

const ATK_FILTERS = [
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

type TabType = 'search' | 'deck';
type CacheKey = string;
type CacheEntry = {
    data: Card[];
    timestamp: number;
    searchCount: number;
};

const CreateDeckPage: React.FC = () => {
    const navigate = useNavigate();
    const [deckName, setDeckName] = useState('Novo Deck');
    const [searchTerm, setSearchTerm] = useState('');
    const [cards, setCards] = useState<Card[]>([]);
    const [mainDeckCards, setMainDeckCards] = useState<DeckCardItem[]>([]);
    const [extraDeckCards, setExtraDeckCards] = useState<DeckCardItem[]>([]);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState('');
    const [selectedAttribute, setSelectedAttribute] = useState('');
    const [selectedRace, setSelectedRace] = useState('');
    const [levelSearch, setLevelSearch] = useState('');
    const [atkSearch, setAtkSearch] = useState('');
    const [includeBanishedCards, setIncludeBanishedCards] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    
    const searchCacheRef = useRef<Map<CacheKey, CacheEntry>>(new Map());
    const lastSearchKeyRef = useRef<CacheKey>('');
    const lastSearchTimeRef = useRef<number>(0);
    const userRequestedRefreshRef = useRef<boolean>(false);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const CACHE_TTL = 2 * 60 * 1000;
    const SHORT_CACHE_TTL = 30 * 1000;
    const MIN_TIME_BETWEEN_SAME_SEARCH = 5000;

    const handleDeckNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setDeckName(e.target.value);
    };

    const isExtraDeckCard = (card: Card) => {
        const extraDeckTypes = ['Fusion Monster', 'Synchro Monster', 'XYZ Monster', 'Link Monster'];
        return extraDeckTypes.includes(card.type);
    };

    const getTotalCount = (deck: DeckCardItem[]) => {
        return deck.reduce((sum, item) => sum + item.count, 0);
    };

    const totalMainDeck = useMemo(() => getTotalCount(mainDeckCards), [mainDeckCards]);
    const totalExtraDeck = useMemo(() => getTotalCount(extraDeckCards), [extraDeckCards]);

    const isLimited = (card: Card) => {
        return card.banlist_info?.ban_tcg === 'Limited';
    };

    const isSemiLimited = (card: Card) => {
        return card.banlist_info?.ban_tcg === 'Semi-Limited';
    };

    const isForbidden = (card: Card) => {
        return card.banlist_info?.ban_tcg === 'Forbidden';
    };

    const getCardLimit = (card: Card) => {
        if (isForbidden(card) && !includeBanishedCards) return 0;
        if (isLimited(card)) return 1;
        if (isSemiLimited(card)) return 2;
        return 3;
    };

    const addCardToDeck = useCallback((card: Card) => {
        if (isForbidden(card) && !includeBanishedCards) {
            alert(`A carta "${card.name}" está proibida (Forbidden). Marque "Incluir Proibidas?" para adicionar ao deck.`);
            return;
        }

        const deckSetter = isExtraDeckCard(card) ? setExtraDeckCards : setMainDeckCards;
        const currentDeck = isExtraDeckCard(card) ? extraDeckCards : mainDeckCards;
        const totalCurrentCount = isExtraDeckCard(card) ? totalExtraDeck : totalMainDeck;
        const maxDeckSize = isExtraDeckCard(card) ? MAX_EXTRA_DECK : MAX_MAIN_DECK;

        if (totalCurrentCount >= maxDeckSize) {
            alert(`Limite de ${maxDeckSize} cartas excedido para o Deck ${isExtraDeckCard(card) ? 'Extra' : 'Principal'}.`);
            return;
        }

        const cardLimit = getCardLimit(card);
        const existingCard = currentDeck.find(item => item.id === card.id);

        if (existingCard && existingCard.count >= cardLimit) {
            alert(`Limite de ${cardLimit} cópias excedido para a carta "${card.name}" (${card.banlist_info?.ban_tcg || 'Ilimitada'}).`);
            return;
        }

        deckSetter(prevDeck => {
            const index = prevDeck.findIndex(item => item.id === card.id);
            if (index > -1) {
                return prevDeck.map((item, i) =>
                    i === index ? { ...item, count: item.count + 1 } : item
                );
            } else {
                return [...prevDeck, { ...card, count: 1 }];
            }
        });
    }, [mainDeckCards, extraDeckCards, totalMainDeck, totalExtraDeck, includeBanishedCards]);

    const removeCardFromDeck = useCallback((cardId: number, deckSetter: React.Dispatch<React.SetStateAction<DeckCardItem[]>>) => {
        deckSetter(prevDeck => {
            const existingCard = prevDeck.find(item => item.id === cardId);
            if (!existingCard) return prevDeck;

            if (existingCard.count > 1) {
                return prevDeck.map(item =>
                    item.id === cardId ? { ...item, count: item.count - 1 } : item
                );
            } else {
                return prevDeck.filter(item => item.id !== cardId);
            }
        });
    }, []);

    const getFilteredQueryParams = useCallback((params: CardQueryInput): Record<string, string> => {
        const filteredParams: Record<string, string> = {};

        Object.keys(params).forEach((key) => {
            const value = params[key as keyof CardQueryInput];
            
            if (value !== undefined && value !== null && value !== '') {
                if (key === 'offset' || key === 'num') {
                    filteredParams[key] = String(value);
                } 
                else if (String(value).trim() !== '') {
                    filteredParams[key] = String(value).trim();
                }
            }
        });

        return filteredParams;
    }, []);

    const generateCacheKey = useCallback((): CacheKey => {
        return `${searchTerm.trim().toLowerCase()}|${selectedType}|${selectedAttribute}|${selectedRace}|${levelSearch}|${atkSearch}|${page}`;
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, page]);

    const shouldMakeRequest = useCallback((searchText: string): boolean => {
        const hasSearchTerm = searchText.trim().length > 0;
        const hasMinSearchChars = searchText.trim().length >= 3;
        const hasOtherFilters = !!selectedType || !!selectedAttribute || !!selectedRace || !!levelSearch || !!atkSearch;

        if (hasSearchTerm && !hasMinSearchChars && !hasOtherFilters) {
            return false;
        }

        if (!hasSearchTerm && !hasOtherFilters) {
            return false;
        }

        return hasMinSearchChars || hasOtherFilters;
    }, [selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch]);

    const shouldFetchCards = useCallback((forceRefresh: boolean = false): boolean => {
        if (!shouldMakeRequest(searchTerm)) {
            return false;
        }

        const cacheKey = generateCacheKey();
        const now = Date.now();
        
        if (forceRefresh) {
            userRequestedRefreshRef.current = true;
            return true;
        }
        
        if (cacheKey === lastSearchKeyRef.current) {
            const timeSinceLastSearch = now - lastSearchTimeRef.current;
            
            if (timeSinceLastSearch < MIN_TIME_BETWEEN_SAME_SEARCH && !userRequestedRefreshRef.current) {
                return false;
            }
        }
        
        const cached = searchCacheRef.current.get(cacheKey);
        if (cached) {
            const cacheAge = now - cached.timestamp;
            const cacheTTL = cached.searchCount > 3 ? SHORT_CACHE_TTL : CACHE_TTL;
            
            if (cacheAge < cacheTTL && !userRequestedRefreshRef.current) {
                return false;
            }
        }

        return true;
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, page, generateCacheKey, shouldMakeRequest]);

    const fetchCards = useCallback(async (forceRefresh: boolean = false) => {
        if (!shouldMakeRequest(searchTerm)) {
            if (isMountedRef.current) {
                setCards([]);
                setFetchError(null);
            }
            return;
        }

        if (!shouldFetchCards(forceRefresh)) {
            const cacheKey = generateCacheKey();
            const cached = searchCacheRef.current.get(cacheKey);
            
            if (cached && cached.data.length > 0 && isMountedRef.current) {
                setCards(cached.data);
                setFetchError(null);
            }
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoading(true);
        setFetchError(null);

        const cacheKey = generateCacheKey();
        lastSearchKeyRef.current = cacheKey;
        lastSearchTimeRef.current = Date.now();
        userRequestedRefreshRef.current = false;

        let atkParam = '';
        if (atkSearch) {
            if (atkSearch === 'asc' || atkSearch === 'desc') {
                atkParam = atkSearch;
            } else if (/^\d+$/.test(atkSearch)) {
                atkParam = atkSearch;
            }
        }

        const baseQueryParams: CardQueryInput = {
            fname: searchTerm.trim() || undefined,
            type: selectedType || undefined,
            attribute: selectedAttribute || undefined,
            race: selectedRace || undefined,
            level: levelSearch || undefined,
            atk: atkParam || undefined,
            offset: String(page * PAGE_SIZE),
            num: String(PAGE_SIZE),
        };

        const queryParams = getFilteredQueryParams(baseQueryParams);

        const hasValidParams = Object.keys(queryParams).some(key => 
            key !== 'offset' && key !== 'num' && queryParams[key]
        );

        if (!hasValidParams && !searchTerm.trim()) {
            if (isMountedRef.current) {
                setCards([]);
                setIsLoading(false);
            }
            return;
        }

        try {
            const response = await api.get('/cards', {
                params: queryParams,
                timeout: 8000,
                signal: abortController.signal,
            });

            const fetchedCards = response.data || [];
            const now = Date.now();

            const existingCache = searchCacheRef.current.get(cacheKey);
            const searchCount = existingCache ? existingCache.searchCount + 1 : 1;
            
            searchCacheRef.current.set(cacheKey, {
                data: fetchedCards,
                timestamp: now,
                searchCount: searchCount
            });

            if (searchCacheRef.current.size > 100) {
                let oldestKey = '';
                let oldestTime = Infinity;
                
                for (const [key, entry] of searchCacheRef.current.entries()) {
                    if (entry.timestamp < oldestTime) {
                        oldestTime = entry.timestamp;
                        oldestKey = key;
                    }
                }
                
                if (oldestKey) {
                    searchCacheRef.current.delete(oldestKey);
                }
            }

            if (isMountedRef.current) {
                setCards(fetchedCards);
            }

        } catch (error: any) {
            if (error.name === 'AbortError' || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
                return;
            }

            const cached = searchCacheRef.current.get(cacheKey);
            
            if (isMountedRef.current) {
                if (cached && cached.data.length > 0) {
                    setCards(cached.data);
                    setFetchError('Usando resultados em cache (erro temporário na conexão)');
                } else {
                    if (error.response) {
                        if (error.response.status === 400 || error.response.status === 404) {
                            setFetchError('Nenhuma carta encontrada. Tente outros termos.');
                        } else if (error.response.status === 500) {
                            setFetchError('Erro no servidor. Tente novamente mais tarde.');
                        } else {
                            setFetchError('Erro ao buscar cartas. Verifique sua conexão.');
                        }
                    } else if (error.request) {
                        setFetchError('Erro de conexão. Verifique sua internet.');
                    } else {
                        setFetchError('Erro ao processar a busca.');
                    }
                    setCards([]);
                }
            }

            console.warn('Erro na busca de cartas:', error.message);

        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, page, shouldFetchCards, generateCacheKey, shouldMakeRequest, getFilteredQueryParams]);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        const cacheKey = generateCacheKey();
        const cached = searchCacheRef.current.get(cacheKey);
        const now = Date.now();

        if (!shouldMakeRequest(searchTerm)) {
            if (isMountedRef.current) {
                setCards([]);
                setFetchError(null);
            }
            
            return;
        }

        let debounceTime = 400;

        if (cached) {
            const cacheAge = now - cached.timestamp;
            const cacheTTL = cached.searchCount > 3 ? SHORT_CACHE_TTL : CACHE_TTL;
            
            if (cacheAge < cacheTTL) {
                if (isMountedRef.current) {
                    setCards(cached.data);
                    setFetchError(null);
                }
                debounceTime = 800;
            } else {
                debounceTime = 300;
            }
        } else if (searchTerm.trim().length >= 3) {
            debounceTime = 500;
        } else if (selectedType || selectedAttribute || selectedRace || levelSearch || atkSearch) {
            debounceTime = 300;
        }

        if (shouldMakeRequest(searchTerm)) {
            searchTimeoutRef.current = setTimeout(() => {
                fetchCards();
            }, debounceTime);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [fetchCards, generateCacheKey, searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, shouldMakeRequest]);

    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
            
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setPage(0);
        
        if (value.trim().length < 3 && !selectedType && !selectedAttribute && !selectedRace && !levelSearch && !atkSearch) {
            setCards([]);
            setFetchError(null);
        }
    };

    const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
        setSelectedRace('');
        setLevelSearch('');
        setAtkSearch('');
        setPage(0);
    };

    const handleSubtypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedRace(value);
        setPage(0);
    };

    const handleAttributeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(e.target.value);
        setPage(0);
    };

    const handleLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setLevelSearch(e.target.value);
        setPage(0);
    };

    const handleAtkChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setAtkSearch(e.target.value);
        setPage(0);
    };

    const handleBanishedToggle = () => {
        setIncludeBanishedCards(prev => !prev);
    };

    const handleNextPage = () => {
        if (cards.length === PAGE_SIZE) {
            setPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(0, prev - 1));
    };

    const handleSaveDeck = async () => {
        if (totalMainDeck < MIN_MAIN_DECK) {
            alert(`O Deck Principal deve ter no mínimo ${MIN_MAIN_DECK} cartas.`);
            return;
        }

        if (!includeBanishedCards) {
            const forbiddenCardsInMainDeck = mainDeckCards.filter(card =>
                isForbidden(card)
            );

            const forbiddenCardsInExtraDeck = extraDeckCards.filter(card =>
                isForbidden(card)
            );

            const allForbiddenCards = [...forbiddenCardsInMainDeck, ...forbiddenCardsInExtraDeck];

            if (allForbiddenCards.length > 0) {
                const forbiddenCardNames = allForbiddenCards.map(card => card.name).join(', ');
                alert(`O deck contém cartas proibidas (Forbidden): ${forbiddenCardNames}. Marque "Incluir Proibidas?" para salvar o deck com cartas proibidas.`);
                return;
            }
        }

        const deckData = {
            name: deckName,
            mainDeck: mainDeckCards.map(card => ({
                id: card.id,
                name: card.name,
                count: card.count,
            })),
            extraDeck: extraDeckCards.map(card => ({
                id: card.id,
                name: card.name,
                count: card.count,
            })),
        };

        try {
            await api.post('/decks', deckData);
            alert('Deck salvo com sucesso!');
            navigate('/');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Erro ao salvar o deck. Verifique as regras do deck.';
            alert(errorMessage);
            console.error('Erro ao salvar o deck:', error);
        }
    };

    const handleCardClickForDetails = (card: Card) => {
        setSelectedCard(card);
    };

    const handleCardHover = (card: Card) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        const timeout = setTimeout(() => {
            setSelectedCard(card);
        }, 400);

        hoverTimeoutRef.current = timeout;
    };

    const handleCardLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    };

    const handleForceRefresh = () => {
        fetchCards(true);
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://via.placeholder.com/300x420/333/fff?text=Imagem+Não+Disponível';
    };

    const isMonsterCard = selectedType && !['Spell Card', 'Trap Card'].includes(selectedType);
    const isSpellTrapCard = selectedType === 'Spell Card' || selectedType === 'Trap Card';

    const getRaceOptions = () => {
        if (isSpellTrapCard) {
            return SPELL_TRAP_SUBTYPES;
        }
        return MONSTER_RACES;
    };

    const renderSearchTab = () => {
        const cacheKey = generateCacheKey();
        const cached = searchCacheRef.current.get(cacheKey);
        const showRefreshButton = cached && !isLoading;
        
        const hasShortTermOnly = searchTerm.trim().length > 0 && 
                               searchTerm.trim().length < 3 && 
                               !selectedType && 
                               !selectedAttribute && 
                               !selectedRace && 
                               !levelSearch && 
                               !atkSearch;

        if (isLoading) {
            return (
                <>
                    <p className="loading-message">Carregando cartas...</p>
                    {showRefreshButton && (
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <button 
                                onClick={handleForceRefresh}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ↻ Buscar Novamente
                            </button>
                        </div>
                    )}
                </>
            );
        }
        
        if (fetchError) {
            return (
                <div className="error-container">
                    <p className="error-message">{fetchError}</p>
                    {hasShortTermOnly && (
                        <p className="hint-message">Digite pelo menos 3 caracteres para buscar.</p>
                    )}
                    <div style={{ textAlign: 'center', marginTop: '15px' }}>
                        <button 
                            onClick={handleForceRefresh}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            ↻ Tentar Novamente
                        </button>
                    </div>
                </div>
            );
        }
        
        if (cards.length === 0) {
            return (
                <div className="empty-search-container">
                    <p className="empty-search-message">
                        {hasShortTermOnly ? 'Digite pelo menos 3 caracteres para buscar.' :
                         searchTerm ? 'Nenhuma carta encontrada. Tente outros termos.' : 
                         'Digite um nome para buscar cartas.'}
                    </p>
                    {searchTerm.length >= 3 && (
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <button 
                                onClick={handleForceRefresh}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--color-primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ↻ Buscar Novamente
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: 'var(--color-input-bg)',
                    borderRadius: '6px'
                }}>
                    <div>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            {cached ? `(Resultados em cache - ${Math.floor((Date.now() - cached.timestamp) / 1000)}s atrás)` : '(Resultados atualizados)'}
                        </span>
                    </div>
                    <button 
                        onClick={handleForceRefresh}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9em'
                        }}
                    >
                        ↻ Atualizar
                    </button>
                </div>
                
                <div className="card-grid">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className="card-item"
                            onClick={() => addCardToDeck(card)}
                            onDoubleClick={() => handleCardClickForDetails(card)}
                            onMouseEnter={() => handleCardHover(card)}
                            onMouseLeave={handleCardLeave}
                        >
                            <img
                                src={card.card_images?.[0]?.image_url_small || ''}
                                alt={card.name}
                                className="card-image"
                                onError={handleImageError}
                                loading="lazy"
                            />
                            {isForbidden(card) && (
                                <span className="banlist-tag forbidden">PROIBIDA</span>
                            )}
                            {isLimited(card) && (
                                <span className="banlist-tag limited">LIMITADA (1)</span>
                            )}
                            {isSemiLimited(card) && (
                                <span className="banlist-tag semi-limited">SEMI-LIMITADA (2)</span>
                            )}
                            <div className="card-info">
                                <div className="card-name">{card.name}</div>
                                <div className="card-type">{card.type}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    const renderDeckTab = () => {
        const allDeckCards = [...mainDeckCards, ...extraDeckCards];

        if (allDeckCards.length === 0) {
            return <p className="empty-deck-message">Seu deck está vazio. Vá para a aba "Buscar Cartas" para adicionar cartas.</p>;
        }

        return (
            <div className="deck-view-container">
                <div className="deck-stats">
                    <div className="deck-stat">
                        <span className="stat-label">Deck Principal:</span>
                        <span className={`stat-value ${totalMainDeck < MIN_MAIN_DECK ? 'stat-warning' : totalMainDeck > MAX_MAIN_DECK ? 'stat-error' : ''}`}>
                            {totalMainDeck}/{MAX_MAIN_DECK} cartas
                        </span>
                        {totalMainDeck < MIN_MAIN_DECK && <span className="stat-note"> (Mínimo: {MIN_MAIN_DECK})</span>}
                    </div>
                    <div className="deck-stat">
                        <span className="stat-label">Deck Extra:</span>
                        <span className={`stat-value ${totalExtraDeck > MAX_EXTRA_DECK ? 'stat-error' : ''}`}>
                            {totalExtraDeck}/{MAX_EXTRA_DECK} cartas
                        </span>
                    </div>
                    <div className="deck-stat">
                        <span className="stat-label">Total:</span>
                        <span className="stat-value">{totalMainDeck + totalExtraDeck} cartas</span>
                    </div>
                </div>

                <div className="deck-cards-grid">
                    {allDeckCards.map((item) => (
                        <div
                            key={item.id}
                            className="deck-card-item-view"
                            onDoubleClick={() => handleCardClickForDetails(item)}
                            onMouseEnter={() => handleCardHover(item)}
                            onMouseLeave={handleCardLeave}
                        >
                            <div className="deck-card-count">{item.count}x</div>
                            <img
                                src={item.card_images?.[0]?.image_url_small || ''}
                                alt={item.name}
                                className="deck-card-image"
                                onError={handleImageError}
                                loading="lazy"
                            />
                            <div className="deck-card-info">
                                <div className="deck-card-name">{item.name}</div>
                                <div className="deck-card-type">{item.type}</div>
                                {isExtraDeckCard(item) && (
                                    <div className="deck-card-extra-tag">Extra Deck</div>
                                )}
                            </div>
                            <button
                                onClick={() => removeCardFromDeck(item.id, isExtraDeckCard(item) ? setExtraDeckCards : setMainDeckCards)}
                                className="remove-deck-card-button"
                            >
                                Remover
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="create-deck-wrapper">
            <header className="deck-builder-header">
                <button onClick={() => navigate('/')} className="back-button">{'< Voltar'}</button>
                <input
                    type="text"
                    value={deckName}
                    onChange={handleDeckNameChange}
                    className="deck-name-input"
                    placeholder="Nome do Deck"
                />
                <button onClick={handleSaveDeck} className="save-deck-button">Salvar Deck</button>
            </header>

            <div className="tab-navigation">
                <button
                    className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    🔍 Buscar Cartas
                </button>
                <button
                    className={`tab-button ${activeTab === 'deck' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deck')}
                >
                    🃏 Meu Deck ({totalMainDeck + totalExtraDeck})
                </button>
            </div>

            <div className="deck-builder-main-layout">
                <div className="main-content">
                    {activeTab === 'search' ? (
                        <section className="card-search-section">
                            <h2>Busca de Cartas</h2>
                            <div className="search-controls">
                                <div style={{ position: 'relative', flex: '1 1 250px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nome da Carta (mínimo 3 caracteres)"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                        minLength={3}
                                        style={{ paddingRight: '40px' }}
                                    />
                                </div>

                                <select
                                    value={selectedType}
                                    onChange={handleTypeChange}
                                    className="filter-select"
                                >
                                    {CARD_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>

                                {isSpellTrapCard && (
                                    <select
                                        value={selectedRace}
                                        onChange={handleSubtypeChange}
                                        className="filter-select"
                                    >
                                        {getRaceOptions().map(subtype => (
                                            <option key={subtype.value} value={subtype.value}>{subtype.label}</option>
                                        ))}
                                    </select>
                                )}

                                {isMonsterCard && (
                                    <>
                                        <select
                                            value={selectedAttribute}
                                            onChange={handleAttributeChange}
                                            className="filter-select"
                                        >
                                            {MONSTER_ATTRIBUTES.map(attr => (
                                                <option key={attr.value} value={attr.value}>{attr.label}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={selectedRace}
                                            onChange={handleSubtypeChange}
                                            className="filter-select"
                                        >
                                            {MONSTER_RACES.map(race => (
                                                <option key={race.value} value={race.value}>{race.label}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={levelSearch}
                                            onChange={handleLevelChange}
                                            className="filter-select"
                                        >
                                            {LEVELS.map(level => (
                                                <option key={level.value} value={level.value}>{level.label}</option>
                                            ))}
                                        </select>

                                        <select
                                            value={atkSearch}
                                            onChange={handleAtkChange}
                                            className="filter-select"
                                        >
                                            {ATK_FILTERS.map(atk => (
                                                <option key={atk.value} value={atk.value}>{atk.label}</option>
                                            ))}
                                        </select>
                                    </>
                                )}

                                <div className="toggle-container">
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={includeBanishedCards} onChange={handleBanishedToggle} />
                                        <span className="slider"></span>
                                    </label>
                                    <span className="toggle-label">Incluir Proibidas?</span>
                                </div>
                            </div>
                            {renderSearchTab()}
                            <div className="pagination-controls">
                                <button onClick={handlePrevPage} disabled={page === 0}>Página Anterior</button>
                                <span>Página {page + 1}</span>
                                <button onClick={handleNextPage} disabled={cards.length < PAGE_SIZE}>Próxima Página</button>
                            </div>
                        </section>
                    ) : (
                        <section className="deck-view-section">
                            <h2>Meu Deck: {deckName}</h2>
                            {renderDeckTab()}
                        </section>
                    )}
                </div>

                {selectedCard && (
                    <div className="card-details-panel">
                        <div className="card-details-header">
                            <h3>Detalhes da Carta</h3>
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="close-details-btn"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="card-details-content">
                            <div className="card-details-image">
                                <img
                                    src={selectedCard.card_images?.[0]?.image_url || selectedCard.card_images?.[0]?.image_url_small || ''}
                                    alt={selectedCard.name}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/300x420/333/fff?text=Imagem+Não+Disponível';
                                    }}
                                    loading="lazy"
                                />
                            </div>

                            <div className="card-details-info">
                                <h2 className="card-details-name">{selectedCard.name}</h2>
                                <div className="card-details-type">{selectedCard.type}</div>

                                {selectedCard.banlist_info?.ban_tcg &&
                                    selectedCard.banlist_info.ban_tcg !== 'Unlimited' && (
                                        <div className={`card-banlist-status ${selectedCard.banlist_info.ban_tcg.toLowerCase()}`}>
                                            {selectedCard.banlist_info.ban_tcg === 'Forbidden' ? 'PROIBIDA' :
                                                selectedCard.banlist_info.ban_tcg === 'Limited' ? 'LIMITADA (1)' :
                                                    'SEMI-LIMITADA (2)'}
                                        </div>
                                    )}

                                <div className="card-details-stats">
                                    {selectedCard.attribute && (
                                        <div className="detail-stat">
                                            <span className="stat-label">Atributo:</span>
                                            <span className="stat-value">{selectedCard.attribute}</span>
                                        </div>
                                    )}
                                    {selectedCard.race && (
                                        <div className="detail-stat">
                                            <span className="stat-label">Raça/Tipo:</span>
                                            <span className="stat-value">{selectedCard.race}</span>
                                        </div>
                                    )}
                                    {selectedCard.level && (
                                        <div className="detail-stat">
                                            <span className="stat-label">Nível:</span>
                                            <span className="stat-value">{selectedCard.level}⭐</span>
                                        </div>
                                    )}
                                    {selectedCard.atk && (
                                        <div className="detail-stat">
                                            <span className="stat-label">ATK:</span>
                                            <span className="stat-value">{selectedCard.atk}</span>
                                        </div>
                                    )}
                                    {selectedCard.def && (
                                        <div className="detail-stat">
                                            <span className="stat-label">DEF:</span>
                                            <span className="stat-value">{selectedCard.def}</span>
                                        </div>
                                    )}
                                    {selectedCard.archetype && (
                                        <div className="detail-stat">
                                            <span className="stat-label">Arquétipo:</span>
                                            <span className="stat-value">{selectedCard.archetype}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-details-description">
                                    <h4>Descrição:</h4>
                                    <p>{selectedCard.desc}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateDeckPage;