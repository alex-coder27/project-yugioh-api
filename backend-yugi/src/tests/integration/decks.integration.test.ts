import request from 'supertest';
import { app } from '../../server';
import prisma from '../../prismaClient';
import jwt from 'jsonwebtoken';

describe('Testes de Integração de Decks', () => {
    let testUser: any;
    let otherUser: any;
    let authToken: string;
    let otherAuthToken: string;
    let sharedDeckId: number;
    const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao';

    const generateCards = (count: number) => {
        return Array.from({ length: count }, (_, i) => ({
            id: 1000 + i,
            name: `Card ${i}`,
            count: 1
        }));
    };

    beforeAll(async () => {
        await prisma.deckCard.deleteMany();
        await prisma.deck.deleteMany();
        await prisma.user.deleteMany();

        testUser = await prisma.user.create({
            data: { 
                username: 'usuario_deck', 
                email: 'deck@teste.com', 
                password: 'password123' 
            }
        });

        otherUser = await prisma.user.create({
            data: { 
                username: 'outro_usuario', 
                email: 'outro@teste.com', 
                password: 'password123' 
            }
        });

        authToken = jwt.sign({ userId: testUser.id, email: testUser.email }, JWT_SECRET);
        otherAuthToken = jwt.sign({ userId: otherUser.id, email: otherUser.email }, JWT_SECRET);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/decks', () => {
        it('deve criar um deck com sucesso', async () => {
            const res = await request(app)
                .post('/api/decks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Meu Deck de Integração',
                    mainDeck: generateCards(40),
                    extraDeck: []
                });

            expect(res.status).toBe(201);
            expect(res.body.deck.name).toBe('Meu Deck de Integração');
            sharedDeckId = res.body.deck.id;
        });

        it('deve retornar 401 sem token de autenticação', async () => {
            const res = await request(app).post('/api/decks').send({});
            expect(res.status).toBe(401);
        });

        it('deve retornar 400 quando o deck tem poucas cartas', async () => {
            const res = await request(app)
                .post('/api/decks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Deck Pequeno',
                    mainDeck: generateCards(10),
                    extraDeck: []
                });
            expect(res.status).toBe(400);
        });

        it('deve retornar 409 ao criar deck com nome duplicado', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const res = await request(app)
                .post('/api/decks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Meu Deck de Integração',
                    mainDeck: generateCards(40),
                    extraDeck: []
                });

            expect(res.status).toBe(409);
            expect(res.body.error).toContain('já tem um deck chamado');
            
            consoleSpy.mockRestore();
        });
    });

    describe('GET /api/decks', () => {
        it('deve recuperar todos os decks do usuário', async () => {
            const res = await request(app)
                .get('/api/decks')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            const decks = Array.isArray(res.body) ? res.body : res.body.decks;
            expect(Array.isArray(decks)).toBe(true);
            expect(decks.length).toBeGreaterThan(0);
        });

        it('deve retornar um array vazio quando o usuário não tem decks', async () => {
            const res = await request(app)
                .get('/api/decks')
                .set('Authorization', `Bearer ${otherAuthToken}`);

            expect(res.status).toBe(200);
            const decks = Array.isArray(res.body) ? res.body : res.body.decks;
            expect(decks.length).toBe(0);
        });
    });

    describe('GET /api/decks/:id', () => {
        it('deve recuperar um deck específico pelo ID', async () => {
            const res = await request(app)
                .get(`/api/decks/${sharedDeckId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            const deck = res.body.deck || res.body;
            expect(deck.id).toBe(sharedDeckId);
        });

        it('deve retornar 404 para deck inexistente', async () => {
            const res = await request(app)
                .get('/api/decks/99999')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(404);
        });

        it('não deve permitir acesso ao deck de outro usuário', async () => {
            const res = await request(app)
                .get(`/api/decks/${sharedDeckId}`)
                .set('Authorization', `Bearer ${otherAuthToken}`);
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /api/decks/:id', () => {
        it('deve atualizar o deck com sucesso', async () => {
            const res = await request(app)
                .put(`/api/decks/${sharedDeckId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Nome de Integração Atualizado',
                    mainDeck: generateCards(41),
                    extraDeck: []
                });

            expect(res.status).toBe(200);
            expect(res.body.deck.name).toBe('Nome de Integração Atualizado');
        });
    });

    describe('DELETE /api/decks/:id', () => {
        it('deve deletar o deck com sucesso', async () => {
            const res = await request(app)
                .delete(`/api/decks/${sharedDeckId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Deck deletado com sucesso.');

            const check = await prisma.deck.findUnique({ where: { id: sharedDeckId } });
            expect(check).toBeNull();
        });
    });
});