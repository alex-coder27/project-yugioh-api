import { Request, Response } from 'express';
import prisma from '../prismaClient';
import { z } from 'zod';
import { DeckSaveDTO, DeckSaveInput } from '../dtos/DeckDTO'; 

interface AuthenticatedRequest extends Request {
    userId?: number;
}

const MIN_MAIN_DECK = 40;
const MAX_MAIN_DECK = 60;
const MAX_EXTRA_DECK = 15;

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
                details: zodError.errors.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        return res.status(400).json({ error: 'Formato de dados do deck inválido.' });
    }

    const { name, mainDeck, extraDeck } = deckData;
    
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
        const allCards = [...mainDeck, ...extraDeck];
        
        const deckCardsCreation = allCards.map(card => ({
            cardApiId: String(card.id),
            copies: card.count, 
        }));
        
        const newDeck = await prisma.deck.create({
            data: {
                name: name,
                userId: userId,
                cards: {
                    create: deckCardsCreation, 
                },
            },
            include: {
                cards: true, 
            }
        });

        return res.status(201).json({ message: 'Deck criado com sucesso.', deck: newDeck });

    } catch (error: any) {
        console.error('Erro ao criar deck:', error);
        
        if (error.code === 'P2002') { 
             return res.status(409).json({ error: `Você já tem um deck chamado "${name}".` });
        }
        
        return res.status(500).json({ error: 'Erro interno ao salvar o deck.' });
    }
};