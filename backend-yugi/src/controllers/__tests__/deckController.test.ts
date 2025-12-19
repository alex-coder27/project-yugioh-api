import { Request, Response } from 'express';
import { createDeck, getDecks, getDeckById, updateDeck, deleteDeck } from '../deckController';
import { DeckService } from '../../services/deck.service';
import { DeckValidator } from '../../validators/deck.validator';
import { DeckTransformer } from '../../transformers/deck.transformer';

jest.mock('../../services/deck.service');
jest.mock('../../validators/deck.validator');
jest.mock('../../transformers/deck.transformer');

describe('deckController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = { body: {}, params: {} };
        mockRes = { status: statusMock };
        jest.clearAllMocks();
    });

    describe('createDeck', () => {
        it('deve criar deck com sucesso', async () => {
            (mockReq as any).userId = 1;
            mockReq.body = {
                name: 'Test Deck',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            const mockDeckData = {
                name: 'Test Deck',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            const mockCreatedDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockProcessedDeck = {
                ...mockCreatedDeck,
                mainDeckCount: 3,
                extraDeckCount: 0,
                mainDeckUnique: 1,
                extraDeckUnique: 0,
            };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.parseDeckData as jest.Mock).mockReturnValue(mockDeckData);
            (DeckValidator.validateDeckConstraints as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.createDeck as jest.Mock).mockResolvedValue(mockCreatedDeck);
            (DeckTransformer.processDeck as jest.Mock).mockReturnValue(mockProcessedDeck);

            await createDeck(mockReq as any, mockRes as Response);

            expect(DeckValidator.validateAuth).toHaveBeenCalledWith(1, mockRes);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Deck criado com sucesso.',
                deck: mockProcessedDeck,
            });
        });

        it('deve retornar quando validação de auth falha', async () => {
            (mockReq as any).userId = undefined;

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(false);

            await createDeck(mockReq as any, mockRes as Response);

            expect(DeckValidator.parseDeckData).not.toHaveBeenCalled();
        });

        it('deve retornar quando parse de dados falha', async () => {
            (mockReq as any).userId = 1;

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.parseDeckData as jest.Mock).mockReturnValue(null);

            await createDeck(mockReq as any, mockRes as Response);

            expect(DeckValidator.validateDeckConstraints).not.toHaveBeenCalled();
        });

        it('deve retornar quando validação de constraints falha', async () => {
            (mockReq as any).userId = 1;

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.parseDeckData as jest.Mock).mockReturnValue({
                name: 'Test',
                mainDeck: [],
                extraDeck: [],
            });
            (DeckValidator.validateDeckConstraints as jest.Mock).mockReturnValue(false);

            await createDeck(mockReq as any, mockRes as Response);

            expect(DeckService.prototype.createDeck).not.toHaveBeenCalled();
        });
    });

    describe('getDecks', () => {
        it('deve retornar todos os decks do usuário', async () => {
            (mockReq as any).userId = 1;

            const mockDecks = [
                {
                    id: 1,
                    name: 'Deck 1',
                    userId: 1,
                    cards: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            const mockProcessedDecks = [
                {
                    ...mockDecks[0],
                    mainDeckCount: 0,
                    extraDeckCount: 0,
                    mainDeckUnique: 0,
                    extraDeckUnique: 0,
                },
            ];

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getUserDecks as jest.Mock).mockResolvedValue(mockDecks);
            (DeckTransformer.processDecks as jest.Mock).mockReturnValue(mockProcessedDecks);

            await getDecks(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                decks: mockProcessedDecks,
            });
        });

        it('deve retornar quando validação falha', async () => {
            (mockReq as any).userId = undefined;

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(false);

            await getDecks(mockReq as any, mockRes as Response);

            expect(DeckService.prototype.getUserDecks).not.toHaveBeenCalled();
        });
    });

    describe('getDeckById', () => {
        it('deve retornar deck específico', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '1' };

            const mockDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockProcessedDeck = {
                ...mockDeck,
                mainDeckCount: 0,
                extraDeckCount: 0,
                mainDeckUnique: 0,
                extraDeckUnique: 0,
            };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValue(mockDeck);
            (DeckTransformer.processDeck as jest.Mock).mockReturnValue(mockProcessedDeck);

            await getDeckById(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                deck: mockProcessedDeck,
            });
        });

        it('deve retornar 404 quando deck não existe', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '999' };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValue(null);

            await getDeckById(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Deck não encontrado.',
            });
        });

        it('deve validar deck ID', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: 'invalid' };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(false);

            await getDeckById(mockReq as any, mockRes as Response);

            expect(DeckService.prototype.getDeckById).not.toHaveBeenCalled();
        });
    });

    describe('updateDeck', () => {
        it('deve atualizar deck com sucesso', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '1' };
            mockReq.body = {
                name: 'Updated Deck',
                mainDeck: [{ id: 100, name: 'Card 1', count: 3 }],
                extraDeck: [],
            };

            const mockExistingDeck = {
                id: 1,
                name: 'Old Deck',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockUpdatedDeck = {
                ...mockExistingDeck,
                name: 'Updated Deck',
            };

            const mockProcessedDeck = {
                ...mockUpdatedDeck,
                mainDeckCount: 3,
                extraDeckCount: 0,
                mainDeckUnique: 1,
                extraDeckUnique: 0,
            };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckValidator.parseDeckData as jest.Mock).mockReturnValue(mockReq.body);
            (DeckValidator.validateDeckConstraints as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValueOnce(mockExistingDeck);
            (DeckService.prototype.updateDeck as jest.Mock).mockResolvedValue(mockUpdatedDeck);
            (DeckTransformer.processDeck as jest.Mock).mockReturnValue(mockProcessedDeck);

            await updateDeck(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Deck atualizado com sucesso.',
                deck: mockProcessedDeck,
            });
        });

        it('deve retornar 404 quando deck não existe', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '999' };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckValidator.parseDeckData as jest.Mock).mockReturnValue({
                name: 'Test',
                mainDeck: [],
                extraDeck: [],
            });
            (DeckValidator.validateDeckConstraints as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValue(null);

            await updateDeck(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Deck não encontrado.',
            });
        });
    });

    describe('deleteDeck', () => {
        it('deve deletar deck com sucesso', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '1' };

            const mockDeck = {
                id: 1,
                name: 'Test Deck',
                userId: 1,
                cards: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValue(mockDeck);
            (DeckService.prototype.deleteDeck as jest.Mock).mockResolvedValue(undefined);

            await deleteDeck(mockReq as any, mockRes as Response);

            expect(DeckService.prototype.deleteDeck).toHaveBeenCalledWith(1);
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Deck deletado com sucesso.',
            });
        });

        it('deve retornar 404 quando deck não existe', async () => {
            (mockReq as any).userId = 1;
            mockReq.params = { id: '999' };

            (DeckValidator.validateAuth as jest.Mock).mockReturnValue(true);
            (DeckValidator.validateDeckId as jest.Mock).mockReturnValue(true);
            (DeckService.prototype.getDeckById as jest.Mock).mockResolvedValue(null);

            await deleteDeck(mockReq as any, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Deck não encontrado.',
            });
            expect(DeckService.prototype.deleteDeck).not.toHaveBeenCalled();
        });
    });
});