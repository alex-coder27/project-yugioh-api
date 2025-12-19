jest.mock('../../prismaClient', () => ({
    default: { user: {}, deck: {} }
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn().mockResolvedValue(true)
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'fake-token'),
    verify: jest.fn((token, secret, callback) => 
        token === 'fake-token' ? callback(null, { userId: 1 }) : callback(new Error('Invalid'), null)
    )
}));

jest.mock('axios', () => ({
    get: jest.fn().mockResolvedValue({ status: 200, data: { data: [] } })
}));

jest.mock('../../controllers/authController', () => ({
    registerUser: (req: any, res: any) => res.status(201).json({ message: 'OK', token: 'fake-token' }),
    loginUser: (req: any, res: any) => res.status(200).json({ message: 'OK', token: 'fake-token' })
}));

jest.mock('../../controllers/cardController', () => ({
    getCards: (req: any, res: any) => res.status(200).json([])
}));

jest.mock('../../controllers/deckController', () => ({
    createDeck: (req: any, res: any) => res.status(201).json({ message: 'OK' }),
    getDecks: (req: any, res: any) => res.status(200).json({ decks: [] }),
    getDeckById: (req: any, res: any) => res.status(200).json({ deck: {} }),
    updateDeck: (req: any, res: any) => res.status(200).json({ message: 'OK' }),
    deleteDeck: (req: any, res: any) => res.status(200).json({ message: 'OK' })
}));

jest.mock('../../middleware/authMiddleware', () => ({
    authenticateToken: (req: any, res: any, next: any) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token' });
        if (token === 'fake-token') {
            req.userId = 1;
            return next();
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
}));

import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/authRoutes';
import cardRoutes from '../../routes/cardRoutes';
import deckRoutes from '../../routes/deckRoutes';


const createApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use('/api/cards', cardRoutes);
    app.use('/api/decks', deckRoutes);
    return app;
};

describe('Routes Tests - Isolated', () => {
    jest.setTimeout(5000);

    test('1. POST /api/auth/register → 201', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'test', email: 'test@test.com', password: '123456' });
        expect(res.status).toBe(201);
    });

    test('2. POST /api/auth/login → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'test', password: '123456' });
        expect(res.status).toBe(200);
    });

    test('3. GET /api/cards → 200', async () => {
        const app = createApp();
        const res = await request(app).get('/api/cards');
        expect(res.status).toBe(200);
    });

    test('4. GET /api/cards with query → 200', async () => {
        const app = createApp();
        const res = await request(app).get('/api/cards?fname=test&offset=0&num=10');
        expect(res.status).toBe(200);
    });

    test('5. POST /api/decks (with auth) → 201', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/decks')
            .set('Authorization', 'Bearer fake-token')
            .send({ name: 'Test', mainDeck: [], extraDeck: [] });
        expect(res.status).toBe(201);
    });

    test('6. GET /api/decks (with auth) → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .get('/api/decks')
            .set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
    });

    test('7. GET /api/decks/:id (with auth) → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .get('/api/decks/1')
            .set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
    });

    test('8. PUT /api/decks/:id (with auth) → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .put('/api/decks/1')
            .set('Authorization', 'Bearer fake-token')
            .send({ name: 'Updated', mainDeck: [], extraDeck: [] });
        expect(res.status).toBe(200);
    });

    test('9. DELETE /api/decks/:id (with auth) → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .delete('/api/decks/1')
            .set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
    });

    test('10. GET /api/auth/register → 404', async () => {
        const app = createApp();
        const res = await request(app).get('/api/auth/register');
        expect(res.status).toBe(404);
    });

    test('11. POST /api/cards → 404', async () => {
        const app = createApp();
        const res = await request(app).post('/api/cards');
        expect(res.status).toBe(404);
    });

    test('12. GET /api/decks/:id (numeric) → 200', async () => {
        const app = createApp();
        const res = await request(app)
            .get('/api/decks/123')
            .set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
    });

    test('13. GET /api/cards with pagination → 200', async () => {
        const app = createApp();
        const res = await request(app).get('/api/cards?offset=0&num=10');
        expect(res.status).toBe(200);
    });

    test('14. POST /api/auth/register with JSON → 201', async () => {
        const app = createApp();
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'user', email: 'user@test.com', password: 'pass123' });
        expect(res.status).toBe(201);
    });

    test('15. GET /api/notfound → 404', async () => {
        const app = createApp();
        const res = await request(app).get('/api/notfound');
        expect(res.status).toBe(404);
    });

    test('16. GET /api/decks (without auth) → 401', async () => {
        const app = createApp();
        const res = await request(app).get('/api/decks');
        expect(res.status).toBe(401);
    });
});