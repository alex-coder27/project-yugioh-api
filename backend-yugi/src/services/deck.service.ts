import prisma from '../prismaClient';
import { DeckSaveInput } from '../dtos/DeckDTO';

interface DeckCardCreateData {
    cardApiId: number;
    copies: number;
    isExtraDeck: boolean;
}

export class DeckService {
    async createDeck(userId: number, deckData: DeckSaveInput) {
        const { name, mainDeck = [], extraDeck = [] } = deckData;
        
        const deckCardsCreation = this.prepareDeckCardsData(mainDeck, extraDeck);

        return await prisma.deck.create({
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
    }

    async getUserDecks(userId: number) {
        return await prisma.deck.findMany({
            where: { userId },
            include: { cards: true },
            orderBy: { id: 'desc' },
        });
    }

    async getDeckById(deckId: number, userId: number) {
        return await prisma.deck.findFirst({
            where: { id: deckId, userId },
            include: { cards: true },
        });
    }

    async updateDeck(deckId: number, userId: number, deckData: DeckSaveInput) {
        const { name, mainDeck = [], extraDeck = [] } = deckData;
        const deckCardsCreation = this.prepareDeckCardsData(mainDeck, extraDeck);

        await prisma.$transaction([
            prisma.deckCard.deleteMany({ where: { deckId } }),
            prisma.deck.update({
                where: { id: deckId },
                data: {
                    name: name,
                    cards: { create: deckCardsCreation as any }
                },
            }),
        ]);

        return await this.getDeckById(deckId, userId);
    }

    async deleteDeck(deckId: number) {
        await prisma.deckCard.deleteMany({ where: { deckId } });
        await prisma.deck.delete({ where: { id: deckId } });
    }

    private prepareDeckCardsData(mainDeck: any[], extraDeck: any[]): DeckCardCreateData[] {
        const allCards = [
            ...mainDeck.map(card => ({ ...card, isExtraDeck: false })),
            ...extraDeck.map(card => ({ ...card, isExtraDeck: true }))
        ];

        return allCards.map(card => ({
            cardApiId: card.id,
            copies: card.count,
            isExtraDeck: card.isExtraDeck,
        }));
    }
}