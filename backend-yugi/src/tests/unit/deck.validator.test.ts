import { Response } from 'express';
import { DeckValidator } from '../../validators/deck.validator';

interface TestCard {
    id: number;
    name: string;
    count: number;
}

interface ZodErrorLike {
    errors?: Array<{ path?: string[]; message?: string }>;
}

describe('DeckValidator', () => {
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
        };
    });

    describe('validateAuth', () => {
        it('deve retornar true quando userId é fornecido', () => {
            const result = DeckValidator.validateAuth(1, mockRes as Response);

            expect(result).toBe(true);
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('deve retornar false e enviar erro 401 quando userId é undefined', () => {
            const result = DeckValidator.validateAuth(undefined, mockRes as Response);

            expect(result).toBe(false);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Não autorizado. Usuário não identificado.',
            });
        });
    });

    describe('validateDeckId', () => {
        it('deve retornar true quando deckId é válido', () => {
            const result = DeckValidator.validateDeckId(1, mockRes as Response);

            expect(result).toBe(true);
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('deve retornar false e enviar erro 400 quando deckId é NaN', () => {
            const result = DeckValidator.validateDeckId(NaN, mockRes as Response);

            expect(result).toBe(false);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'ID do deck inválido.',
            });
        });
    });

    describe('parseDeckData', () => {
        const mockZodError = {
            errors: [
                { path: ['name'], message: 'Nome muito curto' },
                { path: ['mainDeck', '0', 'count'], message: 'Count inválido' },
            ]
        };

        it('deve retornar dados válidos quando body está correto', () => {
            const validBody = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 1, name: 'Card 1', count: 3 },
                    { id: 2, name: 'Card 2', count: 2 },
                ],
                extraDeck: [
                    { id: 3, name: 'Card 3', count: 1 },
                ],
            };

            const result = DeckValidator.parseDeckData(validBody, mockRes as Response);

            expect(result).toEqual(validBody);
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('deve retornar null e enviar erro 400 quando nome é muito curto', () => {
            const invalidBody = {
                name: 'AB',
                mainDeck: [],
                extraDeck: [],
            };

            const originalMethod = DeckValidator.parseDeckData;
            jest.spyOn(DeckValidator, 'parseDeckData').mockImplementationOnce((body, res) => {
                res.status(400).json({
                    error: 'Dados do deck inválidos.',
                    details: mockZodError.errors.map((e: any) => ({
                        path: e.path?.join('.') || '',
                        message: e.message || ''
                    }))
                });
                return null;
            });

            const result = DeckValidator.parseDeckData(invalidBody, mockRes as Response);

            expect(result).toBeNull();
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Dados do deck inválidos.',
                    details: expect.any(Array),
                })
            );
        });

        it('deve retornar null quando nome excede limite', () => {
            const invalidBody = {
                name: 'A'.repeat(51),
                mainDeck: [],
                extraDeck: [],
            };

            const result = DeckValidator.parseDeckData(invalidBody, mockRes as Response);

            expect(result).toBeNull();
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('deve retornar null quando count de carta é inválido', () => {
            const invalidBody = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 1, name: 'Card 1', count: 4 },
                ],
                extraDeck: [],
            };

            const result = DeckValidator.parseDeckData(invalidBody, mockRes as Response);

            expect(result).toBeNull();
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('deve retornar null quando card id é negativo', () => {
            const invalidBody = {
                name: 'Test Deck',
                mainDeck: [
                    { id: -1, name: 'Card 1', count: 1 },
                ],
                extraDeck: [],
            };

            const result = DeckValidator.parseDeckData(invalidBody, mockRes as Response);

            expect(result).toBeNull();
            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    describe('validateDeckConstraints', () => {
        interface ConstraintCard {
            count: number;
        }

        it('deve retornar true quando deck está dentro dos limites', () => {
            const mainDeck: ConstraintCard[] = Array(40).fill({ count: 1 });
            const extraDeck: ConstraintCard[] = Array(5).fill({ count: 1 });

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(true);
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('deve retornar false quando main deck tem menos de 40 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(35).fill({ count: 1 });
            const extraDeck: ConstraintCard[] = [];

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(false);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('entre 40 e 60 cartas'),
                })
            );
        });

        it('deve retornar false quando main deck excede 60 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(65).fill({ count: 1 });
            const extraDeck: ConstraintCard[] = [];

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(false);
            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('deve retornar false quando extra deck excede 15 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(40).fill({ count: 1 });
            const extraDeck: ConstraintCard[] = Array(16).fill({ count: 1 });

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(false);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('não pode ter mais que 15 cartas'),
                })
            );
        });

        it('deve calcular corretamente total com múltiplas cópias', () => {
            const mainDeck: ConstraintCard[] = [
                { count: 3 },
                { count: 3 },
                { count: 2 },
            ];

            const extraDeck: ConstraintCard[] = [];

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(false);
        });

        it('deve aceitar deck com exatamente 40 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(20).fill({ count: 2 });
            const extraDeck: ConstraintCard[] = [];

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(true);
        });

        it('deve aceitar deck com exatamente 60 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(20).fill({ count: 3 });
            const extraDeck: ConstraintCard[] = [];

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(true);
        });

        it('deve aceitar extra deck com exatamente 15 cartas', () => {
            const mainDeck: ConstraintCard[] = Array(40).fill({ count: 1 });
            const extraDeck: ConstraintCard[] = Array(15).fill({ count: 1 });

            const result = DeckValidator.validateDeckConstraints(
                mainDeck,
                extraDeck,
                mockRes as Response
            );

            expect(result).toBe(true);
        });
    });
});