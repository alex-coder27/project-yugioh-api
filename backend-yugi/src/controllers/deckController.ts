import { Request, Response } from 'express';
import { DeckService } from '../services/deck.service';
import { DeckValidator } from '../validators/deck.validator';
import { DeckTransformer } from '../transformers/deck.transformer';
import { DeckErrorHandler } from '../handlers/deck.errorHandler';

interface AuthenticatedRequest extends Request {
    userId?: number;
}

const deckService = new DeckService();

export const createDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!DeckValidator.validateAuth(userId, res)) return;

    const deckData = DeckValidator.parseDeckData(req.body, res);
    if (!deckData) return;

    const { name, mainDeck = [], extraDeck = [] } = deckData;

    if (!DeckValidator.validateDeckConstraints(mainDeck, extraDeck, res)) return;

    try {
        const newDeck = await deckService.createDeck(userId!, deckData);
        const processedDeck = DeckTransformer.processDeck(newDeck);

        return res.status(201).json({
            message: 'Deck criado com sucesso.',
            deck: processedDeck
        });
    } catch (error: any) {
        DeckErrorHandler.handlePrismaError(error, name, res, 'criar');
    }
};

export const getDecks = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!DeckValidator.validateAuth(userId, res)) return;

    try {
        const decks = await deckService.getUserDecks(userId!);
        const processedDecks = DeckTransformer.processDecks(decks);

        return res.status(200).json({ decks: processedDecks });
    } catch (error: any) {
        DeckErrorHandler.handleGenericError(error, res, 'Erro interno ao buscar decks.');
    }
};

export const getDeckById = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!DeckValidator.validateAuth(userId, res)) return;
    if (!DeckValidator.validateDeckId(deckId, res)) return;

    try {
        const deck = await deckService.getDeckById(deckId, userId!);

        if (!deck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        const processedDeck = DeckTransformer.processDeck(deck);

        return res.status(200).json({ deck: processedDeck });
    } catch (error: any) {
        DeckErrorHandler.handleGenericError(error, res, 'Erro interno ao buscar deck.');
    }
};

export const updateDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!DeckValidator.validateAuth(userId, res)) return;
    if (!DeckValidator.validateDeckId(deckId, res)) return;

    const deckData = DeckValidator.parseDeckData(req.body, res);
    if (!deckData) return;

    const { name, mainDeck = [], extraDeck = [] } = deckData;

    if (!DeckValidator.validateDeckConstraints(mainDeck, extraDeck, res)) return;

    try {
        const existingDeck = await deckService.getDeckById(deckId, userId!);

        if (!existingDeck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        const updatedDeck = await deckService.updateDeck(deckId, userId!, deckData);

        if (!updatedDeck) {
            return res.status(200).json({
                message: 'Deck atualizado com sucesso.',
            });
        }

        const processedDeck = DeckTransformer.processDeck(updatedDeck);

        return res.status(200).json({
            message: 'Deck atualizado com sucesso.',
            deck: processedDeck
        });
    } catch (error: any) {
        DeckErrorHandler.handlePrismaError(error, name, res, 'atualizar');
    }
};

export const deleteDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!DeckValidator.validateAuth(userId, res)) return;
    if (!DeckValidator.validateDeckId(deckId, res)) return;

    try {
        const deck = await deckService.getDeckById(deckId, userId!);

        if (!deck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        await deckService.deleteDeck(deckId);

        return res.status(200).json({ message: 'Deck deletado com sucesso.' });
    } catch (error: any) {
        DeckErrorHandler.handleGenericError(error, res, 'Erro interno ao deletar deck.');
    }
};