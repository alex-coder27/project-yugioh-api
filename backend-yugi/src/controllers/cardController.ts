import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import {
    CardQueryDTO,
    CardQueryInput,
    SimplifiedCard,
    YgoProDeckResponseSchema
} from '../dtos/CardDTO';

const YGO_API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

type BanStatus = 'Limited' | 'Semi-Limited' | 'Forbidden' | 'Unlimited';

interface BanlistMap {
    [cardName: string]: BanStatus;
}

const fetchBanlistStatus = async (): Promise<BanlistMap> => {
    try {
        const response = await axios.get(YGO_API_URL, {
            params: {
                banlist: 'tcg',
            },
            validateStatus: () => true
        });

        if (response.status !== 200 || !response.data.data) {
            console.error('Falha ao buscar banlist da API externa:', response.status);
            return {};
        }

        const banlistMap: BanlistMap = {};
        
        response.data.data.forEach((card: any) => {
            if (card.banlist_info && card.banlist_info.ban_tcg && card.banlist_info.ban_tcg !== 'Unlimited') {
                banlistMap[card.name] = card.banlist_info.ban_tcg as BanStatus;
            }
        });

        return banlistMap;
    } catch (error) {
        console.error('Erro ao buscar status da banlist:', error);
        return {};
    }
};

function getStatValue(stat: number | string | null | undefined): number {
    if (stat === null || stat === undefined) return 0;
    if (typeof stat === 'number') return stat;
    
    const statStr = String(stat).toUpperCase();
    if (statStr === 'X') return 9999;
    if (statStr === '?') return 0;

    const parsed = parseInt(statStr, 10);
    return isNaN(parsed) ? 0 : parsed;
}

function getATKValue(atk: number | string | null | undefined): number {
    return getStatValue(atk);
}

function getDEFValue(def: number | string | null | undefined): number {
    return getStatValue(def);
}

export const getCards = async (req: Request, res: Response) => {
    let validatedQuery: CardQueryInput;

    try {
        validatedQuery = CardQueryDTO.parse(req.query);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const zodError = error as any;
            console.error('Erro de validação Zod no Query:', zodError.errors);
            return res.status(400).json({
                error: 'Parâmetros de busca inválidos.',
                details: zodError.errors.map((e: any) => ({ path: e.path.join('.'), message: e.message }))
            });
        }
        return res.status(500).json({ error: 'Erro interno ao validar parâmetros de busca.' });
    }

    const { fname, type, attribute, race, level, atk, def, offset, num } = validatedQuery;

    const banlistStatusMap = await fetchBanlistStatus();

    const apiParams: any = { fname, type, attribute, race, level, atk, def, offset, num };
    
    Object.keys(apiParams).forEach(key => {
        if (apiParams[key] === undefined || apiParams[key] === '') {
            delete apiParams[key];
        }
    });

    try {
        const response = await axios.get(YGO_API_URL, {
            params: apiParams,
            validateStatus: () => true
        });

        if (response.status === 400 || response.status === 404) {
            return res.status(200).json([]);
        }
        
        if (response.status !== 200 || !response.data.data) {
            console.error('Falha ao buscar cartas da API externa:', response.status);
            return res.status(502).json({ error: 'Falha ao comunicar com a API externa.' });
        }

        const data = YgoProDeckResponseSchema.parse(response.data).data;

        const meshedCards = data.map((card: any) => {
            const banStatus = banlistStatusMap[card.name];
            const correctBanlistInfo = banStatus ? { ban_tcg: banStatus } : card.banlist_info;

            return {
                ...card,
                banlist_info: correctBanlistInfo,
            } as SimplifiedCard;
        });

        let filteredCards = meshedCards;

        // FILTRAR/ORDENAR POR ATK
        if (atk) {
            if (atk === 'asc') {
                filteredCards = [...filteredCards].sort((a, b) => {
                    const atkA = getATKValue(a.atk);
                    const atkB = getATKValue(b.atk);
                    return atkA - atkB;
                });
            } else if (atk === 'desc') {
                filteredCards = [...filteredCards].sort((a, b) => {
                    const atkA = getATKValue(a.atk);
                    const atkB = getATKValue(b.atk);
                    return atkB - atkA;
                });
            } else if (/^\d+$/.test(atk)) {
                const atkValue = parseInt(atk, 10);
                filteredCards = filteredCards.filter(card => {
                    const cardATK = getATKValue(card.atk);
                    return cardATK >= atkValue;
                });
            }
        }

        // FILTRAR/ORDENAR POR DEF
        if (def) {
            if (def === 'asc') {
                filteredCards = [...filteredCards].sort((a, b) => {
                    const defA = getDEFValue(a.def);
                    const defB = getDEFValue(b.def);
                    return defA - defB;
                });
            } else if (def === 'desc') {
                filteredCards = [...filteredCards].sort((a, b) => {
                    const defA = getDEFValue(a.def);
                    const defB = getDEFValue(b.def);
                    return defB - defA;
                });
            } else if (/^\d+$/.test(def)) {
                const defValue = parseInt(def, 10);
                filteredCards = filteredCards.filter(card => {
                    const cardDEF = getDEFValue(card.def);
                    return cardDEF >= defValue;
                });
            }
        }
        
        return res.json(filteredCards);

    } catch (error) {
        console.error('Erro interno ao buscar cartas:', error);
        return res.status(500).json({ error: 'Erro interno do servidor ao processar a busca de cartas.' });
    }
};