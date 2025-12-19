import { Request, Response } from 'express';
import axios from 'axios';
import { getCards } from '../../controllers/cardController';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('cardController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    const baseCard = {
        id: 1,
        name: 'Test Card',
        type: 'Normal Monster',
        desc: 'Description',
        race: 'Dragon',
        attribute: 'LIGHT',
        level: 4,
        atk: 1000,
        def: 1000,
        card_images: [
            {
                id: 1,
                image_url: 'https://example.com/image.jpg',
                image_url_small: 'https://example.com/image_small.jpg',
            },
        ],
        banlist_info: {
            ban_tcg: 'Unlimited'
        }
    };

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        
        mockReq = { query: {} };
        mockRes = {
            status: statusMock,
            json: jsonMock,
        } as unknown as Response;

        jest.clearAllMocks();

        mockedAxios.get.mockResolvedValue({
            status: 200,
            data: { data: [] }
        });
    });

    describe('getCards', () => {
        it('deve buscar cartas com nome', async () => {
            mockReq.query = { fname: 'Blue-Eyes' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: { data: [{ ...baseCard, name: 'Blue-Eyes White Dragon' }] },
                });

            await getCards(mockReq as Request, mockRes as Response);

            expect(mockedAxios.get).toHaveBeenLastCalledWith(
                'https://db.ygoprodeck.com/api/v7/cardinfo.php',
                expect.objectContaining({
                    params: expect.objectContaining({ fname: 'Blue-Eyes' }),
                })
            );
            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Blue-Eyes White Dragon' }),
                ])
            );
        });

        it('deve buscar carta por ID', async () => {
            mockReq.query = { id: '89631139' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: { data: [{ ...baseCard, id: 89631139 }] },
                });

            await getCards(mockReq as Request, mockRes as Response);

            expect(mockedAxios.get).toHaveBeenLastCalledWith(
                expect.any(String),
                expect.objectContaining({ 
                    params: expect.objectContaining({ id: '89631139' }) 
                })
            );
        });

        it('deve buscar múltiplas cartas por IDs', async () => {
            mockReq.query = { id: '89631139,46986414' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: {
                        data: [
                            { ...baseCard, id: 89631139 },
                            { ...baseCard, id: 46986414 },
                        ],
                    },
                });

            await getCards(mockReq as Request, mockRes as Response);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ id: 89631139 }),
                    expect.objectContaining({ id: 46986414 }),
                ])
            );
        });

        it('deve filtrar cartas por tipo', async () => {
            mockReq.query = { type: 'Effect Monster' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: { data: [{ ...baseCard, type: 'Effect Monster' }] },
                });

            await getCards(mockReq as Request, mockRes as Response);

            expect(mockedAxios.get).toHaveBeenLastCalledWith(
                expect.any(String),
                expect.objectContaining({
                    params: expect.objectContaining({ type: 'Effect Monster' }),
                })
            );
        });

        it('deve ordenar por ATK ascendente', async () => {
            mockReq.query = { atk: 'asc' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: {
                        data: [
                            { ...baseCard, id: 1, atk: 3000 },
                            { ...baseCard, id: 2, atk: 1000 },
                        ],
                    },
                });

            await getCards(mockReq as Request, mockRes as Response);

            const responseData = jsonMock.mock.calls[0][0];
            expect(responseData[0].atk).toBe(1000);
            expect(responseData[1].atk).toBe(3000);
        });

        it('deve ordenar por ATK descendente', async () => {
            mockReq.query = { atk: 'desc' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: {
                        data: [
                            { ...baseCard, id: 1, atk: 1000 },
                            { ...baseCard, id: 2, atk: 3000 },
                        ],
                    },
                });

            await getCards(mockReq as Request, mockRes as Response);

            const responseData = jsonMock.mock.calls[0][0];
            expect(responseData[0].atk).toBe(3000);
            expect(responseData[1].atk).toBe(1000);
        });

        it('deve filtrar por ATK mínimo', async () => {
            mockReq.query = { atk: '2000' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({
                    status: 200,
                    data: {
                        data: [
                            { ...baseCard, id: 1, atk: 3000 },
                            { ...baseCard, id: 2, atk: 1000 },
                        ],
                    },
                });

            await getCards(mockReq as Request, mockRes as Response);

            const responseData = jsonMock.mock.calls[0][0];
            expect(responseData).toHaveLength(1);
            expect(responseData[0].atk).toBe(3000);
        });

        it('deve retornar array vazio quando não encontra cartas', async () => {
            mockReq.query = { fname: 'NonexistentCard' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({ status: 404, data: {} });

            await getCards(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it('deve retornar erro 400 para parâmetros inválidos', async () => {
            mockReq.query = { offset: 'invalid' };

            await getCards(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Parâmetros de busca inválidos.',
                })
            );
        });

        it('deve retornar erro 502 quando API externa falha', async () => {
            mockReq.query = { fname: 'test' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({ status: 502, data: {} });

            await getCards(mockReq as Request, mockRes as Response);

            expect(statusMock).toHaveBeenCalledWith(502);
            expect(jsonMock).toHaveBeenCalledWith({
                error: 'Falha ao comunicar com a API externa.',
            });
        });

        it('deve buscar e aplicar banlist da API', async () => {
            mockReq.query = { fname: 'Pot' };

            mockedAxios.get.mockImplementation((url, config) => {
                if (config?.params?.banlist === 'tcg') {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            data: [
                                { ...baseCard, name: 'Pot of Greed', banlist_info: { ban_tcg: 'Forbidden' } }
                            ]
                        }
                    });
                }
                return Promise.resolve({
                    status: 200,
                    data: {
                        data: [
                            { ...baseCard, name: 'Pot of Greed', banlist_info: { ban_tcg: 'Unlimited' } }
                        ]
                    }
                });
            });

            await getCards(mockReq as Request, mockRes as Response);

            expect(statusMock).not.toHaveBeenCalledWith(500);
            const responseData = jsonMock.mock.calls[0][0];
            expect(responseData[0].banlist_info?.ban_tcg).toBe('Forbidden');
        });

        it('deve lidar com parâmetros de paginação', async () => {
            mockReq.query = { offset: '0', num: '20' };

            mockedAxios.get
                .mockResolvedValueOnce({ status: 200, data: { data: [] } })
                .mockResolvedValueOnce({ status: 200, data: { data: [] } });

            await getCards(mockReq as Request, mockRes as Response);

            expect(mockedAxios.get).toHaveBeenLastCalledWith(
                expect.any(String),
                expect.objectContaining({
                    params: expect.objectContaining({ offset: 0, num: 20 }),
                })
            );
        });
    });
});