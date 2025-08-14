import request from 'supertest';
import { app } from '../src/app';
import { AppDataSource } from '../src/config/data-source';

describe('POST /api/orders', () => {
    beforeAll(async () => {
        await AppDataSource.initialize();
    });

    afterAll(async () => {
        await AppDataSource.destroy();
    });

    it('should submit a MARKET BUY order successfully', async () => {
        const res = await request(app)
            .post('/api/orders')
            .send({
                userId: 1,
                instrumentId: 5,
                side: 'BUY',
                type: 'LIMIT',
                quantity: 10,
                price: 10
            });

        console.log(res.body);
        expect(res.status).toBe(201);
        expect(res.body.order.status).toBe('FILLED');
        expect(res.body.order.instrumentId).toBe(5);
        expect(res.body.order.type).toBe('LIMIT');
    });
});