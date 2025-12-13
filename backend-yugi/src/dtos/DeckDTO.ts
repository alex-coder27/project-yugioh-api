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


const DeckCardSchema = z.object({
    id: z.number().int().positive({ message: "O ID da carta deve ser um número inteiro positivo." }), 
    name: z.string().min(1).max(255),
    count: z.number().int().min(1, { message: "A contagem de cópias deve ser no mínimo 1." }).max(3, { message: "A contagem de cópias deve ser no máximo 3." }),
});

export const DeckSaveDTO = z.object({
    name: z.string()
        .min(3, { message: "O nome do deck deve ter pelo menos 3 caracteres." })
        .max(50, { message: "O nome do deck deve ter no máximo 50 caracteres." }),
        
    mainDeck: z.array(DeckCardSchema).max(60, { message: "O número de cartas distintas no Main Deck não pode exceder 60." }), 
    extraDeck: z.array(DeckCardSchema).max(15, { message: "O número de cartas distintas no Extra Deck não pode exceder 15." }), 
});

export type DeckSaveInput = z.infer<typeof DeckSaveDTO>;
