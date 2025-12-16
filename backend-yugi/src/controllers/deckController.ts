import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { z } from 'zod';
import { DeckSaveDTO, DeckSaveInput } from '../dtos/DeckDTO';

interface AuthenticatedRequest extends Request {
    userId?: number;
}

interface DeckCardCreateData {
    cardApiId: number;
    copies: number;
    isExtraDeck: boolean;
}

interface DeckCardWithExtra {
    id?: number;
    deckId: number;
    cardApiId: number;
    copies: number;
    isExtraDeck: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const MIN_MAIN_DECK = 40;
const MAX_MAIN_DECK = 60;
const MAX_EXTRA_DECK = 15;

const filterMainDeckCards = (cards: any[]): DeckCardWithExtra[] => {
    return (cards as DeckCardWithExtra[]).filter(card => !card.isExtraDeck);
};

const filterExtraDeckCards = (cards: any[]): DeckCardWithExtra[] => {
    return (cards as DeckCardWithExtra[]).filter(card => card.isExtraDeck);
};

export const createDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
    }

    let deckData: DeckSaveInput;

    try {
        deckData = DeckSaveDTO.parse(req.body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            return res.status(400).json({
                error: 'Dados do deck inválidos.',
                details: zodError.errors.map((e: any) => ({
                    path: e.path?.join('.') || '',
                    message: e.message || ''
                }))
            });
        }
        return res.status(400).json({ error: 'Formato de dados do deck inválido.' });
    }

    const { name } = deckData;
    const mainDeck = deckData.mainDeck || [];
    const extraDeck = deckData.extraDeck || [];

    const totalMainDeck = mainDeck.reduce((sum, card) => sum + card.count, 0);
    const totalExtraDeck = extraDeck.reduce((sum, card) => sum + card.count, 0);

    if (totalMainDeck < MIN_MAIN_DECK || totalMainDeck > MAX_MAIN_DECK) {
        return res.status(400).json({
            error: `O Deck Principal deve ter entre ${MIN_MAIN_DECK} e ${MAX_MAIN_DECK} cartas. Total atual: ${totalMainDeck}`
        });
    }

    if (totalExtraDeck > MAX_EXTRA_DECK) {
        return res.status(400).json({
            error: `O Deck Extra não pode ter mais que ${MAX_EXTRA_DECK} cartas. Total atual: ${totalExtraDeck}`
        });
    }

    try {
        const allCards = [
            ...mainDeck.map(card => ({ ...card, isExtraDeck: false })),
            ...extraDeck.map(card => ({ ...card, isExtraDeck: true }))
        ];

        const deckCardsCreation: DeckCardCreateData[] = allCards.map(card => ({
            cardApiId: card.id,
            copies: card.count,
            isExtraDeck: card.isExtraDeck,
        }));

        console.log('Criando deck com cards:', deckCardsCreation);

        const newDeck = await prisma.deck.create({
            data: {
                name: name,
                userId: userId,
                cards: {
                    create: deckCardsCreation as any,
                },
            },
            include: {
                cards: true,
            }
        });

        const mainDeckCards = filterMainDeckCards(newDeck.cards);
        const extraDeckCards = filterExtraDeckCards(newDeck.cards);
        
        const processedDeck = {
            ...newDeck,
            mainDeckCount: mainDeckCards.reduce((sum, card) => sum + card.copies, 0),
            extraDeckCount: extraDeckCards.reduce((sum, card) => sum + card.copies, 0),
            mainDeckUnique: mainDeckCards.length,
            extraDeckUnique: extraDeckCards.length
        };

        return res.status(201).json({
            message: 'Deck criado com sucesso.',
            deck: processedDeck
        });

    } catch (error: any) {
        console.error('Erro detalhado ao criar deck:', error);
        console.error('Stack trace:', error.stack);

        if (error.code === 'P2002') {
            return res.status(409).json({
                error: `Você já tem um deck chamado "${name}".`
            });
        }

        return res.status(500).json({
            error: 'Erro interno ao salvar o deck.',
            details: error.message,
            code: error.code
        });
    }
};

export const getDecks = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
    }

    try {
        const decks = await prisma.deck.findMany({
            where: {
                userId: userId,
            },
            include: {
                cards: true,
            },
            orderBy: {
                id: 'desc',
            },
        });

        const processedDecks = decks.map(deck => {
            const mainDeckCards = filterMainDeckCards(deck.cards);
            const extraDeckCards = filterExtraDeckCards(deck.cards);
            
            return {
                ...deck,
                mainDeckCount: mainDeckCards.reduce((sum, card) => sum + card.copies, 0),
                extraDeckCount: extraDeckCards.reduce((sum, card) => sum + card.copies, 0),
                mainDeckUnique: mainDeckCards.length,
                extraDeckUnique: extraDeckCards.length
            };
        });

        return res.status(200).json({ decks: processedDecks });
    } catch (error: any) {
        console.error('Erro ao buscar decks:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar decks.', details: error.message });
    }
};

export const getDeckById = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
    }

    if (isNaN(deckId)) {
        return res.status(400).json({ error: 'ID do deck inválido.' });
    }

    try {
        const deck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: userId,
            },
            include: {
                cards: true,
            },
        });

        if (!deck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        const mainDeckCards = filterMainDeckCards(deck.cards);
        const extraDeckCards = filterExtraDeckCards(deck.cards);
        
        const processedDeck = {
            ...deck,
            mainDeckCount: mainDeckCards.reduce((sum, card) => sum + card.copies, 0),
            extraDeckCount: extraDeckCards.reduce((sum, card) => sum + card.copies, 0),
            mainDeckUnique: mainDeckCards.length,
            extraDeckUnique: extraDeckCards.length
        };

        return res.status(200).json({ deck: processedDeck });
    } catch (error: any) {
        console.error('Erro ao buscar deck:', error);
        return res.status(500).json({ error: 'Erro interno ao buscar deck.', details: error.message });
    }
};

export const updateDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
    }

    if (isNaN(deckId)) {
        return res.status(400).json({ error: 'ID do deck inválido.' });
    }

    let deckData: DeckSaveInput;

    try {
        deckData = DeckSaveDTO.parse(req.body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            return res.status(400).json({
                error: 'Dados do deck inválidos.',
                details: zodError.errors.map((e: any) => ({
                    path: e.path?.join('.') || '',
                    message: e.message || ''
                }))
            });
        }
        return res.status(400).json({ error: 'Formato de dados do deck inválido.' });
    }

    const { name } = deckData;
    const mainDeck = deckData.mainDeck || [];
    const extraDeck = deckData.extraDeck || [];

    const totalMainDeck = mainDeck.reduce((sum, card) => sum + card.count, 0);
    const totalExtraDeck = extraDeck.reduce((sum, card) => sum + card.count, 0);

    if (totalMainDeck < MIN_MAIN_DECK || totalMainDeck > MAX_MAIN_DECK) {
        return res.status(400).json({
            error: `O Deck Principal deve ter entre ${MIN_MAIN_DECK} e ${MAX_MAIN_DECK} cartas. Total atual: ${totalMainDeck}`
        });
    }

    if (totalExtraDeck > MAX_EXTRA_DECK) {
        return res.status(400).json({
            error: `O Deck Extra não pode ter mais que ${MAX_EXTRA_DECK} cartas. Total atual: ${totalExtraDeck}`
        });
    }

    try {
        const existingDeck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: userId,
            }
        });

        if (!existingDeck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        const allCards = [
            ...mainDeck.map(card => ({ ...card, isExtraDeck: false })),
            ...extraDeck.map(card => ({ ...card, isExtraDeck: true }))
        ];

        const deckCardsCreation: DeckCardCreateData[] = allCards.map(card => ({
            cardApiId: card.id,
            copies: card.count,
            isExtraDeck: card.isExtraDeck,
        }));

        await prisma.$transaction([
            prisma.deckCard.deleteMany({
                where: {
                    deckId: deckId,
                }
            }),

            prisma.deck.update({
                where: {
                    id: deckId,
                },
                data: {
                    name: name,
                    cards: {
                        create: deckCardsCreation as any,
                    }
                },
            }),
        ]);

        const updatedDeck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: userId,
            },
            include: {
                cards: true,
            },
        });

        if (!updatedDeck) {
            return res.status(200).json({
                message: 'Deck atualizado com sucesso.',
            });
        }

        const mainDeckCards = filterMainDeckCards(updatedDeck.cards);
        const extraDeckCards = filterExtraDeckCards(updatedDeck.cards);
        
        const processedDeck = {
            ...updatedDeck,
            mainDeckCount: mainDeckCards.reduce((sum, card) => sum + card.copies, 0),
            extraDeckCount: extraDeckCards.reduce((sum, card) => sum + card.copies, 0),
            mainDeckUnique: mainDeckCards.length,
            extraDeckUnique: extraDeckCards.length
        };

        return res.status(200).json({
            message: 'Deck atualizado com sucesso.',
            deck: processedDeck
        });

    } catch (error: any) {
        console.error('Erro detalhado ao atualizar deck:', error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                error: `Você já tem um deck chamado "${name}".`
            });
        }

        return res.status(500).json({
            error: 'Erro interno ao atualizar o deck.',
            details: error.message
        });
    }
};

export const deleteDeck = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const deckId = parseInt(req.params.id);

    if (!userId) {
        return res.status(401).json({ error: 'Não autorizado. Usuário não identificado.' });
    }

    if (isNaN(deckId)) {
        return res.status(400).json({ error: 'ID do deck inválido.' });
    }

    try {
        const deck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: userId,
            },
        });

        if (!deck) {
            return res.status(404).json({ error: 'Deck não encontrado.' });
        }

        await prisma.deckCard.deleteMany({
            where: {
                deckId: deckId,
            },
        });

        await prisma.deck.delete({
            where: {
                id: deckId,
            },
        });

        return res.status(200).json({ message: 'Deck deletado com sucesso.' });
    } catch (error: any) {
        console.error('Erro ao deletar deck:', error);
        return res.status(500).json({ error: 'Erro interno ao deletar deck.', details: error.message });
    }
};