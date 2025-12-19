import request from 'supertest';
import { app } from '../../server';
import prisma from '../../prismaClient';
import bcrypt from 'bcrypt';

describe('Testes de Integração de Autenticação', () => {
    const testUser = {
        username: 'testuser_integration',
        email: 'test_integration@example.com',
        password: 'password123'
    };

    beforeEach(async () => {
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: testUser.email },
                    { username: testUser.username }
                ]
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('deve registrar um novo usuário com sucesso', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect('Content-Type', /json/)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Usuário registrado com sucesso');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('userId');
            expect(response.body).toHaveProperty('username', testUser.username);

            const userInDb = await prisma.user.findUnique({
                where: { email: testUser.email }
            });
            expect(userInDb).toBeTruthy();
            expect(userInDb?.username).toBe(testUser.username);
        });

        it('deve retornar 409 ao registrar com email duplicado', async () => {
            await prisma.user.create({
                data: {
                    username: 'existinguser',
                    email: testUser.email,
                    password: await bcrypt.hash(testUser.password, 10)
                }
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(409);

            expect(response.body).toHaveProperty('error', 'Email ou Nome de Usuário já está em uso.');
        });

        it('deve retornar 400 quando os dados de registro forem inválidos', async () => {
            const invalidUser = {
                username: 'ab',
                email: 'invalid-email',
                password: '123'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Dados de registro inválidos.');
            expect(response.body).toHaveProperty('details');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await prisma.user.create({
                data: {
                    username: testUser.username,
                    email: testUser.email,
                    password: await bcrypt.hash(testUser.password, 10)
                }
            });
        });

        it('deve fazer login com sucesso usando o email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login bem-sucedido');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('userId');
        });

        it('deve fazer login com sucesso usando o nome de usuário', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.username,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login bem-sucedido');
        });

        it('deve retornar 401 com credenciais inválidas', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Email/Nome de Usuário ou senha inválidos.');
        });

        it('deve retornar 400 quando os dados de login forem inválidos', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    identifier: '',
                    password: '123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Dados de login inválidos.');
        });
    });
});