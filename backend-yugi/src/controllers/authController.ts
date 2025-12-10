import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient';

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao';

export const registerUser = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email e senha são obrigatórios.' });
    }

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
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Email/Nome de Usuário e senha são obrigatórios.' });
    }

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
            token, 
            userId: user.id,
            username: user.username
        });

    } catch (error) {
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};