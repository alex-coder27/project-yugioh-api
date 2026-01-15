import {
    isExtraDeckCard,
    isForbidden,
    isLimited,
    isSemiLimited,
    MAX_MAIN_DECK,
    MIN_MAIN_DECK,
    MAX_EXTRA_DECK,
    PAGE_SIZE,
} from '../../components/deck-builder/utils';
import type { Card } from '../../components/deck-builder/utils';

describe('Utils Functions', () => {
    describe('isExtraDeckCard', () => {
        it('deve retornar true para Fusion Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Fusion Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(true);
        });

        it('deve retornar true para Synchro Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Synchro Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(true);
        });

        it('deve retornar true para XYZ Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'XYZ Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(true);
        });

        it('deve retornar true para Link Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Link Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(true);
        });

        it('deve retornar false para Normal Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Normal Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(false);
        });

        it('deve retornar false para Effect Monster', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Effect Monster',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(false);
        });

        it('deve retornar false para Spell Card', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(false);
        });

        it('deve retornar false para Trap Card', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Trap Card',
                desc: 'Test',
            };
            expect(isExtraDeckCard(card)).toBe(false);
        });
    });

    describe('isForbidden', () => {
        it('deve retornar true quando carta é Forbidden', () => {
            const card: Card = {
                id: 1,
                name: 'Pot of Greed',
                type: 'Spell Card',
                desc: 'Draw 2 cards',
                banlist_info: {
                    ban_tcg: 'Forbidden',
                },
            };
            expect(isForbidden(card)).toBe(true);
        });

        it('deve retornar false quando carta é Limited', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
                banlist_info: {
                    ban_tcg: 'Limited',
                },
            };
            expect(isForbidden(card)).toBe(false);
        });

        it('deve retornar false quando carta não tem banlist_info', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
            };
            expect(isForbidden(card)).toBe(false);
        });

        it('deve retornar false quando ban_tcg é undefined', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
                banlist_info: {},
            };
            expect(isForbidden(card)).toBe(false);
        });
    });

    describe('isLimited', () => {
        it('deve retornar true quando carta é Limited', () => {
            const card: Card = {
                id: 1,
                name: 'Raigeki',
                type: 'Spell Card',
                desc: 'Destroy all monsters',
                banlist_info: {
                    ban_tcg: 'Limited',
                },
            };
            expect(isLimited(card)).toBe(true);
        });

        it('deve retornar false quando carta é Forbidden', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
                banlist_info: {
                    ban_tcg: 'Forbidden',
                },
            };
            expect(isLimited(card)).toBe(false);
        });

        it('deve retornar false quando carta não tem banlist_info', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
            };
            expect(isLimited(card)).toBe(false);
        });
    });

    describe('isSemiLimited', () => {
        it('deve retornar true quando carta é Semi-Limited', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
                banlist_info: {
                    ban_tcg: 'Semi-Limited',
                },
            };
            expect(isSemiLimited(card)).toBe(true);
        });

        it('deve retornar false quando carta é Limited', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
                banlist_info: {
                    ban_tcg: 'Limited',
                },
            };
            expect(isSemiLimited(card)).toBe(false);
        });

        it('deve retornar false quando carta não tem banlist_info', () => {
            const card: Card = {
                id: 1,
                name: 'Test',
                type: 'Spell Card',
                desc: 'Test',
            };
            expect(isSemiLimited(card)).toBe(false);
        });
    });

    describe('Constantes', () => {
        it('deve ter valor correto para MAX_MAIN_DECK', () => {
            expect(MAX_MAIN_DECK).toBe(60);
        });

        it('deve ter valor correto para MIN_MAIN_DECK', () => {
            expect(MIN_MAIN_DECK).toBe(40);
        });

        it('deve ter valor correto para MAX_EXTRA_DECK', () => {
            expect(MAX_EXTRA_DECK).toBe(15);
        });

        it('deve ter valor correto para PAGE_SIZE', () => {
            expect(PAGE_SIZE).toBe(100);
        });
    });
});