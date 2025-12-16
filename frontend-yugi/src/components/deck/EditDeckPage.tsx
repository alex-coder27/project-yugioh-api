import React, { useState, useCallback, useMemo, useEffect, useRef, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../pages/CreateDeck/CreateDeckPage.css';

import DeckHeader from '../../components/deck-builder/DeckHeader';
import TabNavigation from '../../components/deck-builder/TabNavigation';
import CardSearchSection from '../../components/deck-builder/CardSearchSection';
import DeckViewSection from '../../components/deck-builder/DeckViewSection';
import CardDetailsPanel from '../../components/deck-builder/CardDetailsPanel';

import type { Card, DeckCardItem, CardQueryInput, TabType } from '../../components/deck-builder/utils';
import {
    MAX_MAIN_DECK,
    MIN_MAIN_DECK,
    MAX_EXTRA_DECK,
    PAGE_SIZE,
    isExtraDeckCard,
    isForbidden,
    isLimited,
    isSemiLimited
} from '../../components/deck-builder/utils';

type CacheKey = string;
type CacheEntry = {
    data: Card[];
    timestamp: number;
    searchCount: number;
};

const CACHE_TTL = 2 * 60 * 1000;
const SHORT_CACHE_TTL = 30 * 1000;
const MIN_TIME_BETWEEN_SAME_SEARCH = 5000;

interface DeckCard {
    cardApiId: number;
    copies: number;
}

interface Deck {
    id: number;
    name: string;
    userId: number;
    cards: DeckCard[];
}

const EditDeckPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    const [defSearch, setDefSearch] = useState('');
    const [includeBanishedCards, setIncludeBanishedCards] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    const searchCacheRef = useRef<Map<CacheKey, CacheEntry>>(new Map());
    const lastSearchKeyRef = useRef<CacheKey>('');
    const lastSearchTimeRef = useRef<number>(0);

    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef<boolean>(true);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const loadDeck = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/decks/${id}`);
                const deck: Deck = response.data.deck;

                setDeckName(deck.name);

                const uniqueDeckCardIds = (deck.cards || [])
                    .map(deckCard => deckCard.cardApiId)
                    .filter((id, index, self) => self.indexOf(id) === index);

                const mainDeck: DeckCardItem[] = [];
                const extraDeck: DeckCardItem[] = [];
                const cardMap = new Map<number, Card>();

                if (uniqueDeckCardIds.length > 0) {
                    let fetchedCards: Card[] = [];
                    let missingCardIds: number[] = [...uniqueDeckCardIds];

                    try {
                        const cardsResponse = await api.get('/cards', {
                            params: {
                                id: uniqueDeckCardIds.join(','),
                            }
                        });
                        fetchedCards = cardsResponse.data || [];

                        fetchedCards.forEach(card => {
                            cardMap.set(card.id, card);
                            missingCardIds = missingCardIds.filter(mid => mid !== card.id);
                        });

                    } catch (bulkError: any) {
                    }

                    const individualFetchPromises = missingCardIds.map(cardId => {
                        return api.get('/cards', { params: { id: cardId } })
                            .then(res => {
                                return res.data[0];
                            })
                            .catch(_ => {
                                return null;
                            });
                    });

                    const individuallyFetchedCards = await Promise.all(individualFetchPromises);

                    individuallyFetchedCards.forEach(card => {
                        if (card && card.id) {
                            cardMap.set(card.id, card);
                        }
                    });

                    for (const deckCard of deck.cards) {
                        const foundCard = cardMap.get(deckCard.cardApiId);

                        if (foundCard) {
                            const cardItem: DeckCardItem = {
                                ...foundCard,
                                count: deckCard.copies
                            };

                            if (isExtraDeckCard(cardItem)) {
                                extraDeck.push(cardItem);
                            } else {
                                mainDeck.push(cardItem);
                            }
                        } else {
                            mainDeck.push({
                                id: deckCard.cardApiId,
                                name: `Carta #${deckCard.cardApiId} (Não Carregada)`,
                                type: 'Desconhecido',
                                desc: 'Não foi possível carregar esta carta',
                                count: deckCard.copies,
                                card_images: [],
                            } as DeckCardItem);
                        }
                    }
                }

                setMainDeckCards(mainDeck);
                setExtraDeckCards(extraDeck);

            } catch (error: any) {
                setError('Erro ao carregar o deck.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadDeck();
        }
    }, [id]);

    const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeckName(e.target.value);
    }, []);

    const getTotalCount = useCallback((deck: DeckCardItem[]) => {
        return deck.reduce((sum, item) => sum + item.count, 0);
    }, []);

    const totalMainDeck = useMemo(() => getTotalCount(mainDeckCards), [mainDeckCards, getTotalCount]);
    const totalExtraDeck = useMemo(() => getTotalCount(extraDeckCards), [extraDeckCards, getTotalCount]);
    const totalCards = totalMainDeck + totalExtraDeck;

    const getCardLimit = useCallback((card: Card) => {
        if (isForbidden(card) && !includeBanishedCards) return 0;
        if (isLimited(card)) return 1;
        if (isSemiLimited(card)) return 2;
        return 3;
    }, [includeBanishedCards]);

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
    }, [mainDeckCards, extraDeckCards, totalMainDeck, totalExtraDeck, includeBanishedCards, getCardLimit]);

    const removeCardFromDeck = useCallback((cardId: number, isExtra: boolean) => {
        const deckSetter = isExtra ? setExtraDeckCards : setMainDeckCards;

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

            if (value !== undefined && value !== null) {
                if (key === 'type') {
                    filteredParams[key] = String(value);
                }
                else if (key === 'attribute' || key === 'race' ||
                    key === 'level' || key === 'atk' || key === 'def') {
                    if (String(value).trim() !== '') {
                        filteredParams[key] = String(value).trim();
                    }
                }
                else if (key === 'fname') {
                    if (String(value).trim() !== '') {
                        filteredParams[key] = String(value).trim();
                    }
                }
                else if (key === 'offset' || key === 'num') {
                    filteredParams[key] = String(value);
                }
            }
        });

        return filteredParams;
    }, []);

    const generateCacheKey = useCallback((): CacheKey => {
        return `${searchTerm.trim().toLowerCase()}|${selectedType}|${selectedAttribute}|${selectedRace}|${levelSearch}|${atkSearch}|${defSearch}|${page}`;
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, page]);

    const shouldMakeRequest = useCallback((searchText: string): boolean => {
        const hasSearchTerm = searchText.trim().length > 0;
        if (hasSearchTerm) {
            return searchText.trim().length >= 3;
        }
        const hasOtherFilters = !!selectedType || !!selectedAttribute || !!selectedRace || !!levelSearch || !!atkSearch || !!defSearch;
        if (hasOtherFilters) {
            return true;
        }
        return true;
    }, [selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch]);

    const shouldFetchCards = useCallback((): boolean => {
        if (!shouldMakeRequest(searchTerm)) {
            return false;
        }

        const cacheKey = generateCacheKey();
        const now = Date.now();

        if (cacheKey === lastSearchKeyRef.current) {
            const timeSinceLastSearch = now - lastSearchTimeRef.current;
            if (timeSinceLastSearch < MIN_TIME_BETWEEN_SAME_SEARCH) {
                return false;
            }
        }

        const cached = searchCacheRef.current.get(cacheKey);
        if (cached) {
            const cacheAge = now - cached.timestamp;
            const cacheTTL = cached.searchCount > 3 ? SHORT_CACHE_TTL : CACHE_TTL;
            if (cacheAge < cacheTTL) {
                return false;
            }
        }
        return true;
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, page, generateCacheKey, shouldMakeRequest]);

    const fetchCards = useCallback(async () => {
        if (!shouldMakeRequest(searchTerm)) {
            if (isMountedRef.current) {
                setCards([]);
                setFetchError(null);
            }
            return;
        }

        if (!shouldFetchCards()) {
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

        let atkParam = '';
        if (atkSearch) {
            if (atkSearch === 'asc' || atkSearch === 'desc') {
                atkParam = atkSearch;
            } else if (/^\d+$/.test(atkSearch)) {
                atkParam = atkSearch;
            }
        }

        let defParam = '';
        if (defSearch) {
            if (defSearch === 'asc' || defSearch === 'desc') {
                defParam = defSearch;
            } else if (/^\d+$/.test(defSearch)) {
                defParam = defSearch;
            }
        }

        const baseQueryParams: CardQueryInput = {
            fname: searchTerm.trim() || undefined,
            type: selectedType || undefined,
            attribute: selectedAttribute || undefined,
            race: selectedRace || undefined,
            level: levelSearch || undefined,
            atk: atkParam || undefined,
            def: defParam || undefined,
            offset: String(page * PAGE_SIZE),
            num: String(PAGE_SIZE),
        };

        const queryParams = getFilteredQueryParams(baseQueryParams);

        const hasValidParams = Object.keys(queryParams).some(key => key !== 'offset' && key !== 'num' && queryParams[key] !== undefined );
        
        if (!hasValidParams && !searchTerm.trim()) {
            queryParams.offset = String(page * PAGE_SIZE);
            queryParams.num = String(PAGE_SIZE);
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
                setFetchError(null);
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
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
            abortControllerRef.current = null;
        }
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, page, generateCacheKey, shouldMakeRequest, shouldFetchCards, getFilteredQueryParams]);

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
        } else if (selectedType || selectedAttribute || selectedRace || levelSearch || atkSearch || defSearch) {
            debounceTime = 300;
        } else {
            debounceTime = 100;
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
    }, [fetchCards, generateCacheKey, searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, shouldMakeRequest]);
    
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleSearchTermChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const handleSelectType = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
        setPage(0);
    };

    const handleSelectAttribute = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(e.target.value);
        setPage(0);
    };

    const handleSelectRace = (e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedRace(e.target.value);
        setPage(0);
    };

    const handleLevelSearch = (e: ChangeEvent<HTMLSelectElement>) => {
        setLevelSearch(e.target.value);
        setPage(0);
    };

    const handleAtkSearch = (e: ChangeEvent<HTMLSelectElement>) => {
        setAtkSearch(e.target.value);
        setPage(0);
    };

    const handleDefSearch = (e: ChangeEvent<HTMLSelectElement>) => {
        setDefSearch(e.target.value);
        setPage(0);
    };

    const handleToggleBanished = () => {
        setIncludeBanishedCards(prev => !prev);
    };

    const handleCardClickForDetails = (card: Card) => {
        setSelectedCard(card);
    };

    const handleCardHover = (card: Card) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setSelectedCard(card);
        }, 500);
    };

    const handleCardLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = 'https://i.imgur.com/kS9eCgP.png';
        e.currentTarget.onerror = null;
    }, []);

    const handleRetry = () => {
        fetchCards();
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(0, prev - 1));
    };

    const handleNextPage = () => {
        setPage(prev => prev + 1);
    };

    const handleRemoveCard = useCallback((cardId: number, isExtra: boolean) => {
        removeCardFromDeck(cardId, isExtra);
    }, [removeCardFromDeck]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

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

        try {
            const deckData = {
                name: deckName,
                mainDeck: (mainDeckCards || []).map(card => ({
                    id: card.id,
                    name: card.name,
                    count: card.count
                })),
                extraDeck: (extraDeckCards || []).map(card => ({
                    id: card.id,
                    name: card.name,
                    count: card.count
                }))
            };

            await api.put(`/decks/${id}`, deckData);
            alert('Deck atualizado com sucesso!');
            navigate('/dashboard');
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Erro ao atualizar o deck. Verifique as regras do deck.';
            alert(errorMessage);
        }
    };

    if (loading) {
        return <div className="loading-container">Carregando Deck...</div>;
    }

    if (error) {
        return <div className="error-container"><p>{error}</p><button className="back-button" onClick={() => navigate('/dashboard')}>Voltar</button></div>;
    }

    return (
        <div className="create-deck-wrapper">
            <DeckHeader
                deckName={deckName}
                totalMainDeck={totalMainDeck}
                totalExtraDeck={totalExtraDeck}
                totalCards={totalCards}
                onSave={handleSaveDeck}
                onBack={() => navigate('/dashboard')}
                onNameChange={handleNameChange}
                includeBanishedCards={includeBanishedCards}
                onToggleBanished={handleToggleBanished}
                editMode={true}
            />

            <div className="deck-builder-main-layout">
                <div className="main-content">
                    <TabNavigation
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        totalCards={totalCards}
                    />

                    {activeTab === 'search' ? (
                        <CardSearchSection
                            searchTerm={searchTerm}
                            selectedType={selectedType}
                            selectedAttribute={selectedAttribute}
                            selectedRace={selectedRace}
                            levelSearch={levelSearch}
                            atkSearch={atkSearch}
                            defSearch={defSearch}
                            includeBanishedCards={includeBanishedCards}
                            cards={cards}
                            isLoading={isLoading}
                            fetchError={fetchError}
                            page={page}
                            mainDeckCards={mainDeckCards}
                            extraDeckCards={extraDeckCards}
                            onSearchChange={handleSearchTermChange}
                            onTypeChange={handleSelectType}
                            onAttributeChange={handleSelectAttribute}
                            onSubtypeChange={handleSelectRace}
                            onLevelChange={handleLevelSearch}
                            onAtkChange={handleAtkSearch}
                            onDefChange={handleDefSearch}
                            onBanishedToggle={handleToggleBanished}
                            onAddCard={addCardToDeck}
                            onCardDetails={handleCardClickForDetails}
                            onCardHover={handleCardHover}
                            onCardLeave={handleCardLeave}
                            onImageError={handleImageError}
                            onRetry={handleRetry}
                            onPrevPage={handlePrevPage}
                            onNextPage={handleNextPage}
                        />
                    ) : (
                        <DeckViewSection
                            deckName={deckName}
                            mainDeckCards={mainDeckCards}
                            extraDeckCards={extraDeckCards}
                            totalMainDeck={totalMainDeck}
                            totalExtraDeck={totalExtraDeck}
                            onCardDetails={handleCardClickForDetails}
                            onCardHover={handleCardHover}
                            onCardLeave={handleCardLeave}
                            onRemoveCard={handleRemoveCard}
                            onImageError={handleImageError}
                        />
                    )}
                </div>

                {selectedCard && (
                    <CardDetailsPanel
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default EditDeckPage;