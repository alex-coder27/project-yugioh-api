import { z } from 'zod';

export const RegisterUserDTO = z.object({
    username: z.string().min(3, { message: "O nome de usuário deve ter no mínimo 3 caracteres." }).max(30),
    email: z.string().email({ message: "Formato de e-mail inválido." }),
    password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});

export const LoginUserDTO = z.object({
    identifier: z.string().min(1, { message: "Email ou Nome de Usuário são obrigatórios." }), 
    password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
});