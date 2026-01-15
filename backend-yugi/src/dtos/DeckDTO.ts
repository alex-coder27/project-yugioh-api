import { z } from 'zod';

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