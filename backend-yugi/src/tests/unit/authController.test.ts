import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser } from '../../controllers/authController';
import prisma from '../../prismaClient';
import { ZodError } from 'zod';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../prismaClient', () => ({
    user: {
        create: jest.fn(),
        findFirst: jest.fn(),
    },
}));

jest.mock('../../dtos/DeckDTO', () => {
    const originalModule = jest.requireActual('../../dtos/DeckDTO');
    return {
        ...originalModule,
        RegisterUserDTO: {
            parse: jest.fn(),
        },
        LoginUserDTO: {
            parse: jest.fn(),
        },
    };
});

import { RegisterUserDTO, LoginUserDTO } from '../../dtos/DeckDTO';

describe('authController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
    
    const mockPrisma = prisma as any;
    const mockRegisterDTO = RegisterUserDTO as jest.Mocked<typeof RegisterUserDTO>;
    const mockLoginDTO = LoginUserDTO as jest.Mocked<typeof LoginUserDTO>;

    const throwZodError = (path: string, message: string): never => {
        throw new ZodError([
            {
                code: 'custom',
                path: [path],
                message: message,
            },
        ]);
    };

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockReq = { body: {} };
        mockRes = { status: statusMock };
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test_secret';
        
        mockRegisterDTO.parse.mockReset();
        mockLoginDTO.parse.mockReset();
    });

    describe('registerUser', () => {
        it('deve registrar novo usuário com sucesso', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const mockHashedPassword = 'hashed_password';
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
            };
            const mockToken = 'jwt_token_123';

            mockRegisterDTO.parse.mockReturnValue(mockReq.body);
            (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
            mockPrisma.user.create.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            await registerUser(mockReq as Request, mockRes as Response);

            expect(mockRegisterDTO.parse).toHaveBeenCalledWith(mockReq.body);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Usuário registrado com sucesso',
                token: mockToken,
                userId: 1,
                username: 'testuser',
            });
        });

        it('deve retornar erro 400 quando dados são inválidos', async () => {
            mockRegisterDTO.parse.mockImplementation(() => 
                throwZodError('username', 'Username muito curto')
            );

            await registerUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Dados de registro inválidos.',
                    details: expect.any(Array),
                })
            );
        });

        it('deve retornar erro 409 quando email já existe', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'existing@example.com',
                password: 'password123',
            };

            mockRegisterDTO.parse.mockReturnValue(mockReq.body);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            mockPrisma.user.create.mockRejectedValue({ code: 'P2002' });

            await registerUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Email ou Nome de Usuário já está em uso.',
            });
        });

        it('deve retornar erro 500 para erros internos', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            mockRegisterDTO.parse.mockReturnValue(mockReq.body);
            (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash failed'));

            await registerUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro interno do servidor.',
            });
        });

        it('deve criar token JWT com dados corretos', async () => {
            mockReq.body = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 5,
                username: 'testuser',
                email: 'test@example.com',
            };

            mockRegisterDTO.parse.mockReturnValue(mockReq.body);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            mockPrisma.user.create.mockResolvedValue(mockUser);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            await registerUser(mockReq as Request, mockRes as Response);

            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 5, email: 'test@example.com' },
                expect.any(String),
                { expiresIn: '7d' }
            );
        });

        it('deve validar senha com mínimo de 6 caracteres', async () => {
            mockRegisterDTO.parse.mockImplementation(() => 
                throwZodError('password', 'A senha deve ter no mínimo 6 caracteres.')
            );

            await registerUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([
                        expect.objectContaining({ 
                            field: 'password',
                            message: expect.stringContaining('6 caracteres')
                        })
                    ])
                })
            );
        });

        it('deve validar username com mínimo de 3 caracteres', async () => {
            mockRegisterDTO.parse.mockImplementation(() => 
                throwZodError('username', 'O nome de usuário deve ter no mínimo 3 caracteres.')
            );

            await registerUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.arrayContaining([
                        expect.objectContaining({ 
                            field: 'username',
                            message: expect.stringContaining('3 caracteres')
                        })
                    ])
                })
            );
        });
    });

    describe('loginUser', () => {
        it('deve fazer login com email válido', async () => {
            mockReq.body = {
                identifier: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed_password',
            };
            const mockToken = 'jwt_token_123';

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                message: 'Login bem-sucedido',
                token: mockToken,
                userId: 1,
                username: 'testuser',
            });
        });

        it('deve fazer login com username válido', async () => {
            mockReq.body = {
                identifier: 'testuser',
                password: 'password123',
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed_password',
            };

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('deve retornar erro 401 quando usuário não existe', async () => {
            mockReq.body = {
                identifier: 'nonexistent@example.com',
                password: 'password123',
            };

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockResolvedValue(null);

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Email/Nome de Usuário ou senha inválidos.',
            });
        });

        it('deve retornar erro 401 quando senha está incorreta', async () => {
            mockReq.body = {
                identifier: 'test@example.com',
                password: 'wrongpassword',
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed_password',
            };

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('deve retornar erro 400 para dados inválidos', async () => {
            mockLoginDTO.parse.mockImplementation(() => 
                throwZodError('identifier', 'Email ou Nome de Usuário são obrigatórios.')
            );

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Dados de login inválidos.',
                })
            );
        });

        it('deve retornar erro 500 para erros internos', async () => {
            mockReq.body = {
                identifier: 'test@example.com',
                password: 'password123',
            };

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockRejectedValue(new Error('DB Error'));

            await loginUser(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Erro interno do servidor durante o login.',
            });
        });

        it('deve criar token JWT com expiração de 7 dias', async () => {
            mockReq.body = {
                identifier: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashed',
            };

            mockLoginDTO.parse.mockReturnValue(mockReq.body);
            mockPrisma.user.findFirst.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            await loginUser(mockReq as Request, mockRes as Response);

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                { expiresIn: '7d' }
            );
        });
    });
});