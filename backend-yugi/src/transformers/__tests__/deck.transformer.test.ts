import { DeckTransformer } from '../deck.transformer';

describe('DeckTransformer', () => {
    describe('processDeck', () => {
        it('deve processar deck com cartas do main e extra deck', () => {
            const mockDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                    { id: 2, deckId: 1, cardApiId: 101, copies: 2, isExtraDeck: false },
                    { id: 3, deckId: 1, cardApiId: 200, copies: 1, isExtraDeck: true },
                ],
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
            };

            const result = DeckTransformer.processDeck(mockDeck);

            expect(result).toMatchObject({
                id: 1,
                name: 'Test Deck',
                mainDeckCount: 5,
                extraDeckCount: 1,
                mainDeckUnique: 2,
                extraDeckUnique: 1,
            });
        });

        it('deve processar deck apenas com main deck', () => {
            const mockDeck = {
                id: 1,
                name: 'Main Only',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                    { id: 2, deckId: 1, cardApiId: 101, copies: 3, isExtraDeck: false },
                ],
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
            };

            const result = DeckTransformer.processDeck(mockDeck);

            expect(result.mainDeckCount).toBe(6);
            expect(result.extraDeckCount).toBe(0);
            expect(result.mainDeckUnique).toBe(2);
            expect(result.extraDeckUnique).toBe(0);
        });

        it('deve processar deck vazio', () => {
            const mockDeck = {
                id: 1,
                name: 'Empty Deck',
                userId: 1,
                cards: [],
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
            };

            const result = DeckTransformer.processDeck(mockDeck);

            expect(result.mainDeckCount).toBe(0);
            expect(result.extraDeckCount).toBe(0);
            expect(result.mainDeckUnique).toBe(0);
            expect(result.extraDeckUnique).toBe(0);
        });

        it('deve processar deck apenas com extra deck', () => {
            const mockDeck = {
                id: 1,
                name: 'Extra Only',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 200, copies: 2, isExtraDeck: true },
                    { id: 2, deckId: 1, cardApiId: 201, copies: 1, isExtraDeck: true },
                ],
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
            };

            const result = DeckTransformer.processDeck(mockDeck);

            expect(result.mainDeckCount).toBe(0);
            expect(result.extraDeckCount).toBe(3);
            expect(result.mainDeckUnique).toBe(0);
            expect(result.extraDeckUnique).toBe(2);
        });

        it('deve manter dados originais do deck', () => {
            const mockDeck = {
                id: 5,
                name: 'Blue-Eyes',
                userId: 10,
                cards: [],
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-20'),
            };

            const result = DeckTransformer.processDeck(mockDeck);

            expect(result.id).toBe(5);
            expect(result.name).toBe('Blue-Eyes');
            expect(result.userId).toBe(10);
            expect(result.createdAt).toEqual(new Date('2025-01-15'));
            expect(result.updatedAt).toEqual(new Date('2025-01-20'));
        });
    });

    describe('processDecks', () => {
        it('deve processar múltiplos decks', () => {
            const mockDecks = [
                {
                    id: 1,
                    name: 'Deck 1',
                    userId: 1,
                    cards: [
                        { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    name: 'Deck 2',
                    userId: 1,
                    cards: [
                        { id: 2, deckId: 2, cardApiId: 200, copies: 2, isExtraDeck: true },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const results = DeckTransformer.processDecks(mockDecks);

            expect(results).toHaveLength(2);
            expect(results[0].mainDeckCount).toBe(3);
            expect(results[0].extraDeckCount).toBe(0);
            expect(results[1].mainDeckCount).toBe(0);
            expect(results[1].extraDeckCount).toBe(2);
        });

        it('deve processar array vazio', () => {
            const results = DeckTransformer.processDecks([]);

            expect(results).toEqual([]);
        });

        it('deve processar um único deck', () => {
            const mockDecks = [
                {
                    id: 1,
                    name: 'Single Deck',
                    userId: 1,
                    cards: [
                        { id: 1, deckId: 1, cardApiId: 100, copies: 2, isExtraDeck: false },
                        { id: 2, deckId: 1, cardApiId: 101, copies: 1, isExtraDeck: false },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const results = DeckTransformer.processDecks(mockDecks);

            expect(results).toHaveLength(1);
            expect(results[0].mainDeckCount).toBe(3);
            expect(results[0].mainDeckUnique).toBe(2);
        });

        it('deve calcular corretamente estatísticas para cada deck', () => {
            const mockDecks = [
                {
                    id: 1,
                    name: 'Deck A',
                    userId: 1,
                    cards: [
                        { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                        { id: 2, deckId: 1, cardApiId: 101, copies: 3, isExtraDeck: false },
                        { id: 3, deckId: 1, cardApiId: 200, copies: 2, isExtraDeck: true },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    name: 'Deck B',
                    userId: 1,
                    cards: [
                        { id: 4, deckId: 2, cardApiId: 102, copies: 1, isExtraDeck: false },
                        { id: 5, deckId: 2, cardApiId: 201, copies: 1, isExtraDeck: true },
                        { id: 6, deckId: 2, cardApiId: 202, copies: 1, isExtraDeck: true },
                    ],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const results = DeckTransformer.processDecks(mockDecks);

            expect(results[0]).toMatchObject({
                mainDeckCount: 6,
                extraDeckCount: 2,
                mainDeckUnique: 2,
                extraDeckUnique: 1,
            });

            expect(results[1]).toMatchObject({
                mainDeckCount: 1,
                extraDeckCount: 2,
                mainDeckUnique: 1,
                extraDeckUnique: 2,
            });
        });
    });
});