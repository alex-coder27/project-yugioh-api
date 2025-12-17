interface DeckCardWithExtra {
    id?: number;
    deckId: number;
    cardApiId: number;
    copies: number;
    isExtraDeck: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ProcessedDeck {
    id: number;
    name: string;
    userId: number;
    cards: DeckCardWithExtra[];
    createdAt: Date;
    updatedAt: Date;
    mainDeckCount: number;
    extraDeckCount: number;
    mainDeckUnique: number;
    extraDeckUnique: number;
}

export class DeckTransformer {
    static processDeck(deck: any): ProcessedDeck {
        const mainDeckCards = this.filterMainDeckCards(deck.cards);
        const extraDeckCards = this.filterExtraDeckCards(deck.cards);
        
        return {
            ...deck,
            mainDeckCount: mainDeckCards.reduce((sum, card) => sum + card.copies, 0),
            extraDeckCount: extraDeckCards.reduce((sum, card) => sum + card.copies, 0),
            mainDeckUnique: mainDeckCards.length,
            extraDeckUnique: extraDeckCards.length
        };
    }

    static processDecks(decks: any[]): ProcessedDeck[] {
        return decks.map(deck => this.processDeck(deck));
    }

    private static filterMainDeckCards(cards: any[]): DeckCardWithExtra[] {
        return (cards as DeckCardWithExtra[]).filter(card => !card.isExtraDeck);
    }

    private static filterExtraDeckCards(cards: any[]): DeckCardWithExtra[] {
        return (cards as DeckCardWithExtra[]).filter(card => card.isExtraDeck);
    }
}
