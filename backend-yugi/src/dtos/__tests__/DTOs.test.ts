import { z } from 'zod';
import {
    RegisterUserDTO,
    LoginUserDTO,
    DeckSaveDTO,
} from '../DeckDTO';
import {
    CardQueryDTO,
    SimplifiedCardSchema,
} from '../CardDTO';

describe('DTOs Validation', () => {
    describe('RegisterUserDTO', () => {
        it('deve validar registro correto', () => {
            const validData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const result = RegisterUserDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar username muito curto', () => {
            const invalidData = {
                username: 'ab',
                email: 'test@example.com',
                password: 'password123',
            };

            const result = RegisterUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('3 caracteres');
            }
        });

        it('deve rejeitar email inválido', () => {
            const invalidData = {
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123',
            };

            const result = RegisterUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar senha muito curta', () => {
            const invalidData = {
                username: 'testuser',
                email: 'test@example.com',
                password: '12345',
            };

            const result = RegisterUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('6 caracteres');
            }
        });

        it('deve rejeitar username muito longo', () => {
            const invalidData = {
                username: 'a'.repeat(31),
                email: 'test@example.com',
                password: 'password123',
            };

            const result = RegisterUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar dados faltando', () => {
            const invalidData = {
                username: 'testuser',
            };

            const result = RegisterUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('LoginUserDTO', () => {
        it('deve validar login correto', () => {
            const validData = {
                identifier: 'test@example.com',
                password: 'password123',
            };

            const result = LoginUserDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve aceitar username como identifier', () => {
            const validData = {
                identifier: 'testuser',
                password: 'password123',
            };

            const result = LoginUserDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar identifier vazio', () => {
            const invalidData = {
                identifier: '',
                password: 'password123',
            };

            const result = LoginUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar senha muito curta', () => {
            const invalidData = {
                identifier: 'test@example.com',
                password: '12345',
            };

            const result = LoginUserDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('DeckSaveDTO', () => {
        it('deve validar deck correto', () => {
            const validData = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 100, name: 'Card 1', count: 3 },
                    { id: 101, name: 'Card 2', count: 2 },
                ],
                extraDeck: [
                    { id: 200, name: 'Card 3', count: 1 },
                ],
            };

            const result = DeckSaveDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar nome muito curto', () => {
            const invalidData = {
                name: 'AB',
                mainDeck: [],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar nome muito longo', () => {
            const invalidData = {
                name: 'A'.repeat(51),
                mainDeck: [],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar count de carta inválido', () => {
            const invalidData = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 100, name: 'Card 1', count: 4 }, // max 3
                ],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar count menor que 1', () => {
            const invalidData = {
                name: 'Test Deck',
                mainDeck: [
                    { id: 100, name: 'Card 1', count: 0 },
                ],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar card ID negativo', () => {
            const invalidData = {
                name: 'Test Deck',
                mainDeck: [
                    { id: -1, name: 'Card 1', count: 1 },
                ],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar mais de 60 cartas no main deck', () => {
            const invalidData = {
                name: 'Test Deck',
                mainDeck: Array(61).fill({ id: 1, name: 'Card', count: 1 }),
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar mais de 15 cartas no extra deck', () => {
            const invalidData = {
                name: 'Test Deck',
                mainDeck: [],
                extraDeck: Array(16).fill({ id: 1, name: 'Card', count: 1 }),
            };

            const result = DeckSaveDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve aceitar decks vazios', () => {
            const validData = {
                name: 'Empty Deck',
                mainDeck: [],
                extraDeck: [],
            };

            const result = DeckSaveDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('CardQueryDTO', () => {
        it('deve validar query correta', () => {
            const validData = {
                fname: 'Blue-Eyes',
                type: 'Normal Monster',
                offset: '0',
                num: '100',
            };

            const result = CardQueryDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve ter valores default', () => {
            const result = CardQueryDTO.parse({});

            expect(result.offset).toBe(0);
            expect(result.num).toBe(100);
            expect(result.fname).toBe('');
        });

        it('deve converter offset para número', () => {
            const result = CardQueryDTO.parse({ offset: '50' });
            expect(typeof result.offset).toBe('number');
            expect(result.offset).toBe(50);
        });

        it('deve converter num para número', () => {
            const result = CardQueryDTO.parse({ num: '20' });
            expect(typeof result.num).toBe('number');
            expect(result.num).toBe(20);
        });

        it('deve rejeitar offset não numérico', () => {
            const invalidData = { offset: 'invalid' };
            const result = CardQueryDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve rejeitar num não numérico', () => {
            const invalidData = { num: 'invalid' };
            const result = CardQueryDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve validar level numérico', () => {
            const validData = { level: '4' };
            const result = CardQueryDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar level não numérico', () => {
            const invalidData = { level: 'invalid' };
            const result = CardQueryDTO.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('deve transformar string vazia em undefined', () => {
            const result = CardQueryDTO.parse({
                type: '',
                attribute: '',
            });

            expect(result.type).toBeUndefined();
            expect(result.attribute).toBeUndefined();
        });

        it('deve aceitar parâmetros opcionais', () => {
            const validData = {
                fname: 'Dragon',
            };

            const result = CardQueryDTO.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('deve converter includeBanished para boolean', () => {
            const result1 = CardQueryDTO.parse({ includeBanished: 'true' });
            expect(result1.includeBanished).toBe(true);

            const result2 = CardQueryDTO.parse({ includeBanished: 'false' });
            expect(result2.includeBanished).toBe(false);
        });
    });

    describe('SimplifiedCardSchema', () => {
        it('deve validar carta completa', () => {
            const validCard = {
                id: 89631139,
                name: 'Blue-Eyes White Dragon',
                type: 'Normal Monster',
                desc: 'This legendary dragon...',
                card_images: [
                    {
                        id: 1,
                        image_url: 'https://example.com/card.jpg',
                        image_url_small: 'https://example.com/card_small.jpg',
                    },
                ],
                attribute: 'LIGHT',
                race: 'Dragon',
                level: 8,
                atk: 3000,
                def: 2500,
            };

            const result = SimplifiedCardSchema.safeParse(validCard);
            expect(result.success).toBe(true);
        });

        it('deve aceitar carta sem atributos opcionais', () => {
            const validCard = {
                id: 1,
                name: 'Card',
                type: 'Spell Card',
                desc: 'Description',
                card_images: [
                    {
                        id: 1,
                        image_url: 'https://example.com/card.jpg',
                        image_url_small: 'https://example.com/card_small.jpg',
                    },
                ],
            };

            const result = SimplifiedCardSchema.safeParse(validCard);
            expect(result.success).toBe(true);
        });

        it('deve rejeitar URLs inválidas', () => {
            const invalidCard = {
                id: 1,
                name: 'Card',
                type: 'Monster',
                desc: 'Desc',
                card_images: [
                    {
                        id: 1,
                        image_url: 'invalid-url',
                        image_url_small: 'invalid-url',
                    },
                ],
            };

            const result = SimplifiedCardSchema.safeParse(invalidCard);
            expect(result.success).toBe(false);
        });

        it('deve aceitar atk/def como string ou número', () => {
            const card1 = {
                id: 1,
                name: 'Card',
                type: 'Monster',
                desc: 'Desc',
                atk: 3000,
                def: 2500,
                card_images: [
                    {
                        id: 1,
                        image_url: 'https://example.com/card.jpg',
                        image_url_small: 'https://example.com/card_small.jpg',
                    },
                ],
            };

            const card2 = {
                ...card1,
                atk: '3000',
                def: '2500',
            };

            expect(SimplifiedCardSchema.safeParse(card1).success).toBe(true);
            expect(SimplifiedCardSchema.safeParse(card2).success).toBe(true);
        });

        it('deve aceitar campos extras (passthrough)', () => {
            const validCard = {
                id: 1,
                name: 'Card',
                type: 'Monster',
                desc: 'Desc',
                card_images: [
                    {
                        id: 1,
                        image_url: 'https://example.com/card.jpg',
                        image_url_small: 'https://example.com/card_small.jpg',
                    },
                ],
                extraField: 'Extra data',
            };

            const result = SimplifiedCardSchema.safeParse(validCard);
            expect(result.success).toBe(true);
        });
    });
});