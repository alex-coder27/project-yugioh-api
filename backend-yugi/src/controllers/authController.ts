import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';
import { z } from 'zod';
import { RegisterUserDTO, LoginUserDTO } from '../dtos/DeckDTO';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao';

export const registerUser = async (req: Request, res: Response) => {

    let validatedData;
    try {
        validatedData = RegisterUserDTO.parse(req.body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            return res.status(400).json({
                error: 'Dados de registro inválidos.',
                details: zodError.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
            });
        }
        return res.status(500).json({ error: 'Erro interno de validação.' });
    }

    const { username, email, password } = validatedData;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                username: true,
            }
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'Usuário registrado com sucesso',
            token,
            userId: user.id,
            username: user.username
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'Email ou Nome de Usuário já está em uso.' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

export const loginUser = async (req: Request, res: Response) => {

    let validatedData;
    try {
        validatedData = LoginUserDTO.parse(req.body);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            return res.status(400).json({
                error: 'Dados de login inválidos.',
                details: zodError.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
            });
        }
        return res.status(500).json({ error: 'Erro interno de validação.' });
    }

    const { identifier, password } = validatedData;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Email/Nome de Usuário ou senha inválidos.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email/Nome de Usuário ou senha inválidos.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login bem-sucedido',
            token,
            userId: user.id,
            username: user.username
        });

    } catch (error: any) {
        return res.status(500).json({ error: 'Erro interno do servidor durante o login.' });
    }
};