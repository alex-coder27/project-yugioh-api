import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../authMiddleware';

jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        
        mockReq = {
            headers: {},
        };
        
        mockRes = {
            status: statusMock,
        };
        
        mockNext = jest.fn();
        
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('deve retornar 401 quando token não é fornecido', () => {
        mockReq.headers = {};

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Acesso negado. Token não fornecido.',
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 401 quando header authorization está vazio', () => {
        mockReq.headers = { authorization: '' };

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 403 quando token é inválido', () => {
        mockReq.headers = { authorization: 'Bearer invalid-token' };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            callback(new Error('Invalid token'), null);
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Token inválido ou expirado.',
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve retornar 403 quando token está expirado', () => {
        mockReq.headers = { authorization: 'Bearer expired-token' };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            const error = new Error('Token expired');
            callback(error, null);
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(403);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Token inválido ou expirado.',
        });
    });

    it('deve chamar next e adicionar userId ao request quando token é válido', () => {
        const mockToken = 'valid-token';
        const mockUserId = 123;
        
        mockReq.headers = { authorization: `Bearer ${mockToken}` };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            callback(null, { userId: mockUserId });
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(jwt.verify).toHaveBeenCalledWith(
            mockToken,
            expect.any(String),
            expect.any(Function)
        );
        expect((mockReq as any).userId).toBe(mockUserId);
        expect(mockNext).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
    });

    it('deve usar JWT_SECRET do environment quando disponível', () => {
        process.env.JWT_SECRET = 'custom-secret-key';
        mockReq.headers = { authorization: 'Bearer valid-token' };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            expect(secret).toBe('custom-secret-key');
            callback(null, { userId: 1 });
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    it('deve usar secret padrão quando JWT_SECRET não está no environment', () => {
        delete process.env.JWT_SECRET;
        mockReq.headers = { authorization: 'Bearer valid-token' };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            expect(secret).toBe('chave_secreta_padrao');
            callback(null, { userId: 1 });
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    it('deve extrair token corretamente do header Bearer', () => {
        const testToken = 'test-jwt-token-123';
        mockReq.headers = { authorization: `Bearer ${testToken}` };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            expect(token).toBe(testToken);
            callback(null, { userId: 1 });
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);
    });

    it('deve lidar com header authorization sem Bearer prefix', () => {
        mockReq.headers = { authorization: 'just-token-without-bearer' };

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(401);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Acesso negado. Token não fornecido.',
        });
    });

    it('deve permitir múltiplos dados no payload do token', () => {
        mockReq.headers = { authorization: 'Bearer valid-token' };

        const mockPayload = {
            userId: 123,
            email: 'test@example.com',
            username: 'testuser',
        };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            callback(null, mockPayload);
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect((mockReq as any).userId).toBe(123);
        expect(mockNext).toHaveBeenCalled();
    });

    it('deve lidar com token null após split', () => {
        mockReq.headers = { authorization: 'Bearer' };

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(statusMock).toHaveBeenCalledWith(401);
    });

    it('não deve chamar next quando há erro de verificação', () => {
        mockReq.headers = { authorization: 'Bearer invalid-token' };

        (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
            callback(new Error('Verification failed'), null);
        });

        authenticateToken(mockReq as any, mockRes as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(statusMock).toHaveBeenCalledWith(403);
    });
});