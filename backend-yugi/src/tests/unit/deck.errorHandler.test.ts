import { Response } from 'express';
import { DeckErrorHandler } from '../../handlers/deck.errorHandler';

describe('DeckErrorHandler', () => {
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
        };
        
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('handlePrismaError', () => {
        it('deve retornar 409 para erro de duplicação (P2002)', () => {
            const error = {
                code: 'P2002',
                message: 'Unique constraint failed',
                stack: 'Error stack trace',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Test Deck',
                mockRes as Response,
                'criar'
            );

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Você já tem um deck chamado "Test Deck".',
            });
        });

        it('deve retornar 500 para erros genéricos do Prisma', () => {
            const error = {
                code: 'P2025',
                message: 'Record not found',
                stack: 'Error stack trace',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Test Deck',
                mockRes as Response,
                'atualizar'
            );

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro interno ao atualizar o deck.',
                details: 'Record not found',
                code: 'P2025',
            });
        });

        it('deve logar erro detalhado no console', () => {
            const error = {
                code: 'P2003',
                message: 'Foreign key constraint failed',
                stack: 'Error stack trace',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Test Deck',
                mockRes as Response,
                'criar'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Erro detalhado ao criar deck:',
                error
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Stack trace:',
                'Error stack trace'
            );
        });

        it('deve usar nome do deck na mensagem de duplicação', () => {
            const error = {
                code: 'P2002',
                message: 'Unique constraint failed',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Blue-Eyes Deck',
                mockRes as Response,
                'criar'
            );

            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Você já tem um deck chamado "Blue-Eyes Deck".',
            });
        });

        it('deve usar operação na mensagem de erro genérico', () => {
            const error = {
                code: 'P2025',
                message: 'Record not found',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Test Deck',
                mockRes as Response,
                'deletar'
            );

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Erro interno ao deletar o deck.',
                })
            );
        });

        it('deve incluir código do erro na resposta', () => {
            const error = {
                code: 'P2015',
                message: 'Related record not found',
            };

            DeckErrorHandler.handlePrismaError(
                error,
                'Test Deck',
                mockRes as Response,
                'criar'
            );

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: 'P2015',
                })
            );
        });
    });

    describe('handleGenericError', () => {
        it('deve retornar 500 para erros genéricos', () => {
            const error = new Error('Database connection failed');

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Erro ao processar requisição'
            );

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro ao processar requisição',
                details: 'Database connection failed',
            });
        });

        it('deve logar erro no console', () => {
            const error = new Error('Network timeout');

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Erro de rede'
            );

            expect(consoleErrorSpy).toHaveBeenCalledWith('Erro de rede', error);
        });

        it('deve incluir mensagem do erro nos detalhes', () => {
            const error = new Error('Custom error message');

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Erro genérico'
            );

            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro genérico',
                details: 'Custom error message',
            });
        });

        it('deve lidar com erro sem mensagem', () => {
            const error = { code: 'UNKNOWN' };

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Erro desconhecido'
            );

            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro desconhecido',
                details: undefined,
            });
        });

        it('deve usar mensagem personalizada fornecida', () => {
            const error = new Error('Internal error');

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Mensagem customizada do erro'
            );

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Mensagem customizada do erro',
                })
            );
        });

        it('deve sempre retornar status 500', () => {
            const error = new Error('Any error');

            DeckErrorHandler.handleGenericError(
                error,
                mockRes as Response,
                'Error message'
            );

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});