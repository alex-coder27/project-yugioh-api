import { z } from 'zod';

const CardImageSchema = z.object({
    id: z.number(),
    image_url: z.string().url(),
    image_url_small: z.string().url(),
});

const BanlistInfoSchema = z.object({
    ban_tcg: z.enum(['Limited', 'Semi-Limited', 'Forbidden', 'Unlimited', '']),
}).partial();

export interface SimplifiedCard {
    id: number;
    name: string;
    type: string;
    desc: string;
    card_images: z.infer<typeof CardImageSchema>[];
    banlist_info?: z.infer<typeof BanlistInfoSchema>;
    attribute?: string;
    race?: string;
    level?: number | string | null;
    atk?: number | string | null;
    def?: number | string | null;
}

export const SimplifiedCardSchema = z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
    desc: z.string(),
    card_images: z.array(CardImageSchema),
    banlist_info: BanlistInfoSchema.optional(),
    attribute: z.string().optional(),
    race: z.string().optional(),
    level: z.union([z.number(), z.string().nullable()]).optional(),
    atk: z.union([z.number(), z.string().nullable()]).optional(),
    def: z.union([z.number(), z.string().nullable()]).optional(),
}).passthrough();

export const YgoProDeckResponseSchema = z.object({
    data: z.array(SimplifiedCardSchema),
}).passthrough();

const emptyStringToUndefined = (val: any) => (val === '' ? undefined : val as string | undefined);

export const CardQueryDTO = z.object({
    fname: z.string().trim().optional().default(''),
    
    type: z.string().optional().transform(emptyStringToUndefined),
    attribute: z.string().optional().transform(emptyStringToUndefined),
    race: z.string().optional().transform(emptyStringToUndefined),
    
    level: z.string().optional()
        .transform(emptyStringToUndefined)
        .refine(val => !val || /^\d+$/.test(val), {
            message: 'Level deve ser um número inteiro, se presente.',
        }),
        
    atk: z.string().optional()
        .transform(emptyStringToUndefined),

    def: z.string().optional()
        .transform(emptyStringToUndefined),

    offset: z.string().optional().default('0').refine(val => /^\d+$/.test(val), {
        message: 'Offset deve ser um número inteiro.',
    }).transform(Number),
    
    num: z.string().optional().default('100').refine(val => /^\d+$/.test(val), {
        message: 'Num deve ser um número inteiro.',
    }).transform(Number),
    
    id: z.string().optional().transform(emptyStringToUndefined),
    
    includeBanished: z.string().optional().transform(val => val === 'true' ? true : false),
});

export type CardQueryInput = z.infer<typeof CardQueryDTO>;