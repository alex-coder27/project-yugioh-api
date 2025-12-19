import { DeckService } from '../../services/deck.service';
import prisma from '../../prismaClient';

interface MockPrisma {
    deck: {
        create: jest.Mock;
        findMany: jest.Mock;
        findFirst: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    deckCard: {
        deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
}

jest.mock('../../prismaClient', () => {
    const mockDeck = {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockDeckCard = {
        deleteMany: jest.fn(),
    };

    const mockTransaction = jest.fn();

    return {
        __esModule: true,
        default: {
            deck: mockDeck,
            deckCard: mockDeckCard,
            $transaction: mockTransaction,
        },
    };
});

describe('DeckService', () => {
    let deckService: DeckService;
    const mockPrisma = prisma as unknown as MockPrisma;

    beforeEach(() => {
        deckService = new DeckService();
        jest.clearAllMocks();
    });

    describe('createDeck', () => {
        it('deve criar deck com main e extra deck', async () => {
            const deckData = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 100, name: 'Card 1', count: 3 },
                    { id: 101, name: 'Card 2', count: 2 },
                ],
                extraDeck: [
                    { id: 200, name: 'Card 3', count: 1 },
                ],
            };

            const mockCreatedDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                    { id: 2, deckId: 1, cardApiId: 101, copies: 2, isExtraDeck: false },
                    { id: 3, deckId: 1, cardApiId: 200, copies: 1, isExtraDeck: true },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.deck.create.mockResolvedValue(mockCreatedDeck);

            const result = await deckService.createDeck(1, deckData);

            expect(mockPrisma.deck.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Deck',
                    userId: 1,
                    cards: {
                        create: [
                            { cardApiId: 100, copies: 3, isExtraDeck: false },
                            { cardApiId: 101, copies: 2, isExtraDeck: false },
                            { cardApiId: 200, copies: 1, isExtraDeck: true },
                        ],
                    },
                },
                include: { cards: true },
            });

            expect(result).toEqual(mockCreatedDeck);
        });

        it('deve criar deck apenas com main deck', async () => {
            const deckData = {
                name: 'Main Only',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            const mockCreatedDeck = {
                id: 1,
                name: 'Main Only',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.deck.create.mockResolvedValue(mockCreatedDeck);

            const result = await deckService.createDeck(1, deckData);

            expect(result).toEqual(mockCreatedDeck);
        });
    });

    describe('getUserDecks', () => {
        it('deve retornar todos os decks do usuário', async () => {
            const mockDecks = [
                {
                    id: 1,
                    name: 'Deck 1',
                    userId: 1,
                    cards: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    name: 'Deck 2',
                    userId: 1,
                    cards: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPrisma.deck.findMany.mockResolvedValue(mockDecks);

            const result = await deckService.getUserDecks(1);

            expect(mockPrisma.deck.findMany).toHaveBeenCalledWith({
                where: { userId: 1 },
                include: { cards: true },
                orderBy: { id: 'desc' },
            });

            expect(result).toEqual(mockDecks);
        });

        it('deve retornar array vazio quando usuário não tem decks', async () => {
            mockPrisma.deck.findMany.mockResolvedValue([]);

            const result = await deckService.getUserDecks(1);

            expect(result).toEqual([]);
        });
    });

    describe('getDeckById', () => {
        it('deve retornar deck específico do usuário', async () => {
            const mockDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.deck.findFirst.mockResolvedValue(mockDeck);

            const result = await deckService.getDeckById(1, 1);

            expect(mockPrisma.deck.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 1 },
                include: { cards: true },
            });

            expect(result).toEqual(mockDeck);
        });

        it('deve retornar null quando deck não existe', async () => {
            mockPrisma.deck.findFirst.mockResolvedValue(null);

            const result = await deckService.getDeckById(999, 1);

            expect(result).toBeNull();
        });

        it('deve retornar null quando deck pertence a outro usuário', async () => {
            mockPrisma.deck.findFirst.mockResolvedValue(null);

            const result = await deckService.getDeckById(1, 999);

            expect(mockPrisma.deck.findFirst).toHaveBeenCalledWith({
                where: { id: 1, userId: 999 },
                include: { cards: true },
            });

            expect(result).toBeNull();
        });
    });

    describe('updateDeck', () => {
        it('deve atualizar deck existente', async () => {
            const deckData = {
                name: 'Updated Deck',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            const mockUpdatedDeck = {
                id: 1,
                name: 'Updated Deck',
                userId: 1,
                cards: [
                    { id: 1, deckId: 1, cardApiId: 100, copies: 3, isExtraDeck: false },
                ],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.$transaction.mockResolvedValue([{ count: 1 }, mockUpdatedDeck]);
            mockPrisma.deck.findFirst.mockResolvedValue(mockUpdatedDeck);

            const result = await deckService.updateDeck(1, 1, deckData);

            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(result).toEqual(mockUpdatedDeck);
        });

        it('deve deletar cartas antigas antes de atualizar', async () => {
            const deckData = {
                name: 'Updated Deck',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            mockPrisma.deckCard.deleteMany.mockResolvedValue({ count: 5 });
            mockPrisma.$transaction.mockResolvedValue([{ count: 5 }, { id: 1 }]);
            mockPrisma.deck.findFirst.mockResolvedValue({
                id: 1,
                name: 'Updated Deck',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await deckService.updateDeck(1, 1, deckData);

            expect(mockPrisma.deckCard.deleteMany).toHaveBeenCalledWith({
                where: { deckId: 1 },
            });
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('deleteDeck', () => {
        it('deve deletar deck e suas cartas', async () => {
            mockPrisma.deckCard.deleteMany.mockResolvedValue({ count: 5 });
            mockPrisma.deck.delete.mockResolvedValue({ id: 1 } as any);

            await deckService.deleteDeck(1);

            expect(mockPrisma.deckCard.deleteMany).toHaveBeenCalledWith({
                where: { deckId: 1 },
            });

            expect(mockPrisma.deck.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
        });

        it('deve deletar cartas antes do deck', async () => {
            const deleteCalls: string[] = [];

            mockPrisma.deckCard.deleteMany.mockImplementation(() => {
                deleteCalls.push('deckCard');
                return Promise.resolve({ count: 0 });
            });

            mockPrisma.deck.delete.mockImplementation(() => {
                deleteCalls.push('deck');
                return Promise.resolve({ id: 1 } as any);
            });

            await deckService.deleteDeck(1);

            expect(deleteCalls).toEqual(['deckCard', 'deck']);
        });
    });

    describe('prepareDeckCardsData', () => {
        it('deve preparar dados corretamente', async () => {
            const deckData = {
                name: 'Test',
                mainDeck: [
                    { id: 100, name: 'Card 1', count: 3 },
                    { id: 101, name: 'Card 2', count: 2 },
                ],
                extraDeck: [
                    { id: 200, name: 'Card 3', count: 1 },
                ],
            };

            const mockCreatedDeck = {
                id: 1,
                name: 'Test',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.deck.create.mockResolvedValue(mockCreatedDeck);

            await deckService.createDeck(1, deckData);

            expect(mockPrisma.deck.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        cards: {
                            create: expect.arrayContaining([
                                { cardApiId: 100, copies: 3, isExtraDeck: false },
                                { cardApiId: 101, copies: 2, isExtraDeck: false },
                                { cardApiId: 200, copies: 1, isExtraDeck: true },
                            ]),
                        },
                    }),
                })
            );
        });
    });
});