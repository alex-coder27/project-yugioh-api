import React, { useState, useCallback, useMemo, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './CreateDeckPage.css';

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

    const handleDeckNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
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
        return `${searchTerm.trim().toLowerCase()}|${selectedType}|${selectedAttribute}|${selectedRace}|${levelSearch}|${atkSearch}|${defSearch}|${page}`;
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, page]);

    const shouldMakeRequest = useCallback((searchText: string): boolean => {
        const hasSearchTerm = searchText.trim().length > 0;
        const hasMinSearchChars = searchText.trim().length >= 3;
        const hasOtherFilters = !!selectedType || !!selectedAttribute || !!selectedRace || !!levelSearch || !!atkSearch || !!defSearch;

        if (hasSearchTerm && !hasMinSearchChars && !hasOtherFilters) {
            return false;
        }

        if (!hasSearchTerm) {
            return true;
        }

        return hasMinSearchChars || hasOtherFilters;
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

        // A remoção da verificação `!hasValidParams && !searchTerm.trim()` permite buscar a página 0 de todas as cartas
        // A lógica de `shouldMakeRequest` já garante que a busca só ocorrerá se for válida (termo >= 3 OU outros filtros OU todos vazios).

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
    }, [searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, page, shouldFetchCards, generateCacheKey, shouldMakeRequest, getFilteredQueryParams]);

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
        }
        // Condição adicionada: se não houver filtros, mas shouldMakeRequest for true (ou seja, primeira busca), debounce curto
        else if (shouldMakeRequest(searchTerm) && searchTerm.trim().length === 0) {
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
    }, [fetchCards, generateCacheKey, searchTerm, selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch, shouldMakeRequest]);

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

    const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setPage(0);

        // Remove a lógica de limpar as cartas se o termo for muito curto e não houver outros filtros.
        // A função shouldMakeRequest agora gerencia se deve ocorrer um fetch.
    }, [selectedType, selectedAttribute, selectedRace, levelSearch, atkSearch, defSearch]);

    const handleTypeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
        setSelectedRace('');
        setLevelSearch('');
        setAtkSearch('');
        setDefSearch('');
        setPage(0);
    }, []);

    const handleSubtypeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedRace(value);
        setPage(0);
    }, []);

    const handleAttributeChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setSelectedAttribute(e.target.value);
        setPage(0);
    }, []);

    const handleLevelChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setLevelSearch(e.target.value);
        setPage(0);
    }, []);

    const handleAtkChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setAtkSearch(e.target.value);
        setPage(0);
    }, []);

    const handleDefChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        setDefSearch(e.target.value);
        setPage(0);
    }, []);

    const handleBanishedToggle = useCallback(() => {
        setIncludeBanishedCards(prev => !prev);
    }, []);

    const handleNextPage = useCallback(() => {
        if (cards.length === PAGE_SIZE) {
            setPage(prev => prev + 1);
        }
    }, [cards.length]);

    const handlePrevPage = useCallback(() => {
        setPage(prev => Math.max(0, prev - 1));
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

    const handleCardClickForDetails = useCallback((card: Card) => {
        setSelectedCard(card);
    }, []);

    const handleCardHover = useCallback((card: Card) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        const timeout = setTimeout(() => {
            setSelectedCard(card);
        }, 400);

        hoverTimeoutRef.current = timeout;
    }, []);

    const handleCardLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    }, []);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.src = 'https://via.placeholder.com/300x420/333/fff?text=Imagem+Não+Disponível';
    }, []);

    const handleRemoveCard = useCallback((cardId: number, isExtra: boolean) => {
        removeCardFromDeck(cardId, isExtra);
    }, [removeCardFromDeck]);

    const handleRetry = useCallback(() => {
        fetchCards();
    }, [fetchCards]);

    return (
        <div className="create-deck-wrapper">
            <DeckHeader
                deckName={deckName}
                onDeckNameChange={handleDeckNameChange}
                onSaveDeck={handleSaveDeck}
            />

            <TabNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                totalCards={totalCards}
            />

            <div className="deck-builder-main-layout">
                <div className="main-content">
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
                            onSearchChange={handleSearchChange}
                            onTypeChange={handleTypeChange}
                            onAttributeChange={handleAttributeChange}
                            onSubtypeChange={handleSubtypeChange}
                            onLevelChange={handleLevelChange}
                            onAtkChange={handleAtkChange}
                            onDefChange={handleDefChange}
                            onBanishedToggle={handleBanishedToggle}
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

export default CreateDeckPage;