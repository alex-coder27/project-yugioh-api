import { Response } from 'express';

export class DeckErrorHandler {
    static handlePrismaError(error: any, deckName: string, res: Response, operation: string): void {
        console.error(`Erro detalhado ao ${operation} deck:`, error);
        console.error('Stack trace:', error.stack);

        if (error.code === 'P2002') {
            res.status(409).json({
                error: `Você já tem um deck chamado "${deckName}".`
            });
            return;
        }

        res.status(500).json({
            error: `Erro interno ao ${operation} o deck.`,
            details: error.message,
            code: error.code
        });
    }

    static handleGenericError(error: any, res: Response, message: string): void {
        console.error(message, error);
        res.status(500).json({ 
            error: message, 
            details: error.message 
        });
    }
}