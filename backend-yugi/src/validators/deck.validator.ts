import { Response } from 'express';
import { z } from 'zod';
import { DeckSaveDTO, DeckSaveInput } from '../dtos/DeckDTO';

const MIN_MAIN_DECK = 40;
const MAX_MAIN_DECK = 60;
const MAX_EXTRA_DECK = 15;

export class DeckValidator {
    static validateAuth(userId: number | undefined, res: Response): boolean {
        if (!userId) {
            res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
            return false;
        }
        return true;
    }

    static validateDeckId(deckId: number, res: Response): boolean {
        if (isNaN(deckId)) {
            res.status(400).json({ error: 'ID do deck inválido.' });
            return false;
        }
        return true;
    }

    static parseDeckData(body: any, res: Response): DeckSaveInput | null {
        try {
            return DeckSaveDTO.parse(body);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const zodError = error as any;
                res.status(400).json({
                    error: 'Dados do deck inválidos.',
                    details: zodError.errors.map((e: any) => ({
                        path: e.path?.join('.') || '',
                        message: e.message || ''
                    }))
                });
            } else {
                res.status(400).json({ error: 'Formato de dados do deck inválido.' });
            }
            return null;
        }
    }

    static validateDeckConstraints(mainDeck: any[], extraDeck: any[], res: Response): boolean {
        const totalMainDeck = mainDeck.reduce((sum, card) => sum + card.count, 0);
        const totalExtraDeck = extraDeck.reduce((sum, card) => sum + card.count, 0);

        if (totalMainDeck < MIN_MAIN_DECK || totalMainDeck > MAX_MAIN_DECK) {
            res.status(400).json({
                error: `O Deck Principal deve ter entre ${MIN_MAIN_DECK} e ${MAX_MAIN_DECK} cartas. Total atual: ${totalMainDeck}`
            });
            return false;
        }

        if (totalExtraDeck > MAX_EXTRA_DECK) {
            res.status(400).json({
                error: `O Deck Extra não pode ter mais que ${MAX_EXTRA_DECK} cartas. Total atual: ${totalExtraDeck}`
            });
            return false;
        }

        return true;
    }
}
