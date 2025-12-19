import request from 'supertest';
import { app } from '../../server';
import jwt from 'jsonwebtoken';

describe('Testes de Integração de Validação', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao';
    const tokenValido = jwt.sign({ userId: 1 }, JWT_SECRET);

    describe('Validação de Deck', () => {
        it('deve validar o comprimento do nome do deck', async () => {
            const deckInvalido = {
                name: 'AB',
                mainDeck: Array.from({ length: 40 }, (_, i) => ({
                    id: 1000 + i,
                    name: `Card ${i}`,
                    count: 1
                })),
                extraDeck: []
            };

            const response = await request(app)
                .post('/api/decks')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send(deckInvalido)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Dados do deck inválidos.');
        });

        it('deve validar a contagem de cópias das cartas', async () => {
            const deckInvalido = {
                name: 'Nome de Deck Válido',
                mainDeck: [
                    { id: 123, name: 'Carta de Teste', count: 4 }
                ],
                extraDeck: []
            };

            const response = await request(app)
                .post('/api/decks')
                .set('Authorization', `Bearer ${tokenValido}`)
                .send(deckInvalido)
                .expect(400);

            expect(response.body.error).toBe('Dados do deck inválidos.');
        });
    });

    describe('Validação de Autenticação', () => {
        it('deve validar o formato do e-mail no registro', async () => {
            const usuarioInvalido = {
                username: 'usuariovalido',
                email: 'email-invalido',
                password: 'senha_valida_123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(usuarioInvalido)
                .expect(400);

            expect(response.body.error).toBe('Dados de registro inválidos.');
        });

        it('deve validar o comprimento da senha', async () => {
            const usuarioInvalido = {
                username: 'usuariovalido',
                email: 'valido@exemplo.com',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(usuarioInvalido)
                .expect(400);

            expect(response.body.error).toBe('Dados de registro inválidos.');
        });
    });
});