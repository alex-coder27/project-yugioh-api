import request from 'supertest';
import { app } from '../../server';
import jwt from 'jsonwebtoken';

describe('Testes de Integração do Middleware de Autenticação', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao';

    describe('Validação de Token', () => {
        it('deve permitir acesso com um token válido', async () => {
            const validToken = jwt.sign(
                { userId: 1, email: 'test@example.com' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            const response = await request(app)
                .get('/api/decks')
                .set('Authorization', `Bearer ${validToken}`);

            expect([200, 404]).toContain(response.status);
            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(403);
        });

        it('deve retornar 401 sem o token', async () => {
            const response = await request(app)
                .get('/api/decks')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Acesso negado. Token não fornecido.');
        });

        it('deve retornar 403 com um token inválido', async () => {
            const response = await request(app)
                .get('/api/decks')
                .set('Authorization', 'Bearer invalid_token')
                .expect(403);

            expect(response.body).toHaveProperty('error', 'Token inválido ou expirado.');
        });

        it('deve retornar 403 com um token expirado', async () => {
            const expiredToken = jwt.sign(
                { userId: 1, email: 'test@example.com' },
                JWT_SECRET,
                { expiresIn: '-1h' }
            );

            const response = await request(app)
                .get('/api/decks')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error', 'Token inválido ou expirado.');
        });

        it('deve retornar 401 com cabeçalho de autorização malformatado', async () => {
            const response = await request(app)
                .get('/api/decks')
                .set('Authorization', 'MalformedHeader')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Acesso negado. Token não fornecido.');
        });
    });
});