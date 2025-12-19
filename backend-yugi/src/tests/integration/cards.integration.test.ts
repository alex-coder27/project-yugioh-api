import request from 'supertest';
import { app } from '../../server';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Testes de Integração de Cartas', () => {
    const createMockCard = (id: number, name: string, atk: number) => ({
        id,
        name,
        type: "Spellcaster/Normal",
        desc: "Test description",
        card_images: [
            {
                id,
                image_url: `http://example.com/${id}.jpg`,
                image_url_small: `http://example.com/${id}_small.jpg`
            }
        ],
        atk,
        def: 1000,
        level: 4,
        race: "Spellcaster",
        attribute: "DARK"
    });

    const mockEmptyBanlist = {
        status: 200,
        data: { data: [] }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/cards', () => {
        it('deve filtrar por ATK em ordem crescente', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Card A", 1000),
                            createMockCard(2, "Card B", 500),
                            createMockCard(3, "Card C", 2000)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ atk: 'asc' })
                .expect(200);

            expect(response.body).toHaveLength(3);
            expect(response.body[0].atk).toBe(500);
            expect(response.body[1].atk).toBe(1000);
            expect(response.body[2].atk).toBe(2000);
        });

        it('deve filtrar pelo valor mínimo de ATK', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Card A", 1000),
                            createMockCard(2, "Card B", 500),
                            createMockCard(3, "Card C", 2000)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ atk: '1500' })
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].atk).toBe(2000);
        });

        it('deve combinar múltiplos filtros - filtro de ATK aplicado localmente', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Dark Magician", 2500),
                            createMockCard(2, "Dark Hole", 0),
                            createMockCard(3, "Dark Armed Dragon", 2800)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ 
                    fname: 'Dark',
                    atk: '2000'
                })
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0].name).toBe("Dark Magician");
            expect(response.body[1].name).toBe("Dark Armed Dragon");
        });

        it('deve lidar com o filtro fname aplicado pela API externa', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                if (params.fname === 'Dark') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                createMockCard(1, "Dark Magician", 2500)
                            ]
                        }
                    });
                }
                
                return Promise.resolve({
                    status: 200,
                    data: { data: [] }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ fname: 'Dark' })
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Dark Magician");
        });

        it('deve retornar cartas com sucesso em uma busca básica', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                if (params.fname === 'Magician') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                createMockCard(1, "Dark Magician", 2500)
                            ]
                        }
                    });
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Dark Magician", 2500),
                            createMockCard(2, "Blue-Eyes White Dragon", 3000)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ fname: 'Magician' })
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Dark Magician");
        });

        it('deve lidar com resposta 404 da API', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 404,
                    data: {}
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ fname: 'nonexistentcard' })
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('deve lidar com erro de resposta da API (500)', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 500,
                    data: {}
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .expect(502);

            expect(response.body).toHaveProperty('error', 'Falha ao comunicar com a API externa.');
        });

        it('deve retornar 400 para parâmetros de busca inválidos', async () => {
            const response = await request(app)
                .get('/api/cards')
                .query({ offset: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Parâmetros de busca inválidos.');
        });

        it('deve filtrar por valores de DEF', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            { ...createMockCard(1, "Card A", 1000), def: 500 },
                            { ...createMockCard(2, "Card B", 1000), def: 1000 },
                            { ...createMockCard(3, "Card C", 1000), def: 1500 }
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ def: 'asc' })
                .expect(200);

            expect(response.body[0].def).toBe(500);
            expect(response.body[1].def).toBe(1000);
            expect(response.body[2].def).toBe(1500);
        });

        it('deve filtrar pelo valor mínimo de DEF', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve(mockEmptyBanlist);
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            { ...createMockCard(1, "Card A", 1000), def: 500 },
                            { ...createMockCard(2, "Card B", 1000), def: 1000 },
                            { ...createMockCard(3, "Card C", 1000), def: 1500 }
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ def: '1000' })
                .expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body[0].def).toBe(1000);
            expect(response.body[1].def).toBe(1500);
        });

        it('deve aplicar o status da banlist quando disponível', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                {
                                    name: "Dark Magician",
                                    banlist_info: { ban_tcg: 'Limited' }
                                },
                                {
                                    name: "Pot of Greed",
                                    banlist_info: { ban_tcg: 'Forbidden' }
                                }
                            ]
                        }
                    });
                }
                
                if (params.fname === 'Magician') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                createMockCard(1, "Dark Magician", 2500)
                            ]
                        }
                    });
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Dark Magician", 2500),
                            createMockCard(2, "Pot of Greed", 0),
                            createMockCard(3, "Blue-Eyes White Dragon", 3000)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .query({ fname: 'Magician' })
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe("Dark Magician");
            expect(response.body[0].banlist_info).toEqual({ ban_tcg: 'Limited' });
        });

        it('deve aplicar o status da banlist a todas as cartas quando não houver filtro fname', async () => {
            mockedAxios.get.mockImplementation((url, config) => {
                const params = (config as any)?.params || {};
                
                if (params.banlist === 'tcg') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                {
                                    name: "Dark Magician",
                                    banlist_info: { ban_tcg: 'Limited' }
                                },
                                {
                                    name: "Pot of Greed",
                                    banlist_info: { ban_tcg: 'Forbidden' }
                                }
                            ]
                        }
                    });
                }
                
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            createMockCard(1, "Dark Magician", 2500),
                            createMockCard(2, "Pot of Greed", 0),
                            createMockCard(3, "Blue-Eyes White Dragon", 3000)
                        ]
                    }
                });
            });

            const response = await request(app)
                .get('/api/cards')
                .expect(200);

            expect(response.body).toHaveLength(3);

            const darkMagician = response.body.find((c: any) => c.name === "Dark Magician");
            const potOfGreed = response.body.find((c: any) => c.name === "Pot of Greed");
            const blueEyes = response.body.find((c: any) => c.name === "Blue-Eyes White Dragon");
            
            expect(darkMagician.banlist_info).toEqual({ ban_tcg: 'Limited' });
            expect(potOfGreed.banlist_info).toEqual({ ban_tcg: 'Forbidden' });
            expect(blueEyes.banlist_info).toBeUndefined();
        });
    });
});