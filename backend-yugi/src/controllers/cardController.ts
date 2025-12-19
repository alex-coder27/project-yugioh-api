import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import {
    CardQueryDTO,
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
        console.error('Erro ao buscar banlist:', error);
        return {};
    }
};

const getATKValue = (atk: any): number => {
    if (typeof atk === 'number') return atk;
    if (typeof atk === 'string') {
        const parsed = parseInt(atk, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const getDEFValue = (def: any): number => {
    if (typeof def === 'number') return def;
    if (typeof def === 'string') {
        const parsed = parseInt(def, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const getCards = async (req: Request, res: Response) => {
    try {
        const queryResult = CardQueryDTO.safeParse(req.query);

        if (!queryResult.success) {
            return res.status(400).json({
                error: 'Parâmetros de busca inválidos.',
                details: queryResult.error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const { fname, type, attribute, race, level, atk, def, offset, num, id } = queryResult.data;

        const banlistMap = await fetchBanlistStatus();

        const params: any = {
            offset,
            num,
        };

        if (fname) params.fname = fname;
        if (id) params.id = id;
        if (type) params.type = type;
        if (attribute) params.attribute = attribute;
        if (race) params.race = race;
        if (level) params.level = level;

        const response = await axios.get(YGO_API_URL, { 
            params,
            validateStatus: (status) => status < 500
        });

        if (response.status === 404) {
            return res.status(200).json([]);
        }

        if (response.status !== 200) {
            return res.status(502).json({ error: 'Falha ao comunicar com a API externa.' });
        }

        const apiData = YgoProDeckResponseSchema.safeParse(response.data);

        if (!apiData.success) {
            console.error('Erro ao validar dados da API externa:', apiData.error);
            return res.status(502).json({ error: 'Dados recebidos da API externa são inválidos.' });
        }

        let filteredCards: SimplifiedCard[] = apiData.data.data.map(card => {
            const banStatus = banlistMap[card.name];
            if (banStatus) {
                return {
                    ...card,
                    banlist_info: {
                        ...card.banlist_info,
                        ban_tcg: banStatus
                    }
                };
            }
            return card;
        });

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
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Parâmetros de busca inválidos.',
                details: error.issues.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        console.error('Erro interno ao buscar cartas:', error);
        return res.status(500).json({ error: 'Erro interno do servidor ao processar a busca de cartas.' });
    }
};