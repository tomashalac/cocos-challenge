import { Repository, DataSource, In } from 'typeorm';
import { Order } from '../entities/Order';
import { AppDataSource } from '../config/data-source';
import { Instrument } from '../entities/Instrument';
import { MarketData } from '../entities/MarketData';

export class OrderService {
    private orderRepository: Repository<Order>;

    constructor() {
        this.orderRepository = AppDataSource.getRepository(Order);
    }

    async getValidsOrdersWithMarketDataAndInstruments(userId: number): Promise<Order[]> {
        // hay que traerse el market mas reciente siempre
        // el orders tiene que estar siempre ordenado por datetime
        // lo ideal seria hacerlo usando query builder, pero no venia saliendo y la idea tampoco era estar 2 horas con el query builder :S
        /*return await this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.instrument', 'instrument')
            .leftJoinAndSelect(
                'order.marketData',
                'marketData',
                'marketData.date = (SELECT MAX(md.date) FROM market_data md WHERE md.instrumentid = instrument.id)'
            )
            .where('order.userId = :userId', { userId })
            .andWhere('order.status IN (:...statuses)', { statuses: ['FILLED', 'NEW'] })
            .getMany();*/

        const query = `
SELECT o.*,
    i.ticker, i.name as instrument_name, i.type as instrument_type,
    md.high, md.low, md.open, md.close, md.previousclose, md.date as market_datetime
        FROM orders o
        LEFT JOIN instruments i ON i.id = o.instrumentid
        LEFT JOIN LATERAL (
            SELECT * FROM marketdata 
            WHERE instrumentid = i.id 
            ORDER BY date DESC 
            LIMIT 1
        ) md ON true
        WHERE o.userid = $1 AND o.status IN ('FILLED', 'NEW')
        ORDER BY "datetime"
    `;


        const rawResults = await this.orderRepository.query(query, [userId]);
        return this.resultMapToEntities(rawResults);
    }

    private resultMapToEntities(rawResults: any[]) {
        return rawResults.map(row => {
            const order = new Order();
            order.id = row.id;
            order.userId = row.userid;
            order.instrumentId = row.instrumentid;
            order.side = row.side;
            order.size = parseFloat(row.size);
            order.price = row.price ? parseFloat(row.price) : undefined;
            order.type = row.type;
            order.status = row.status;
            order.datetime = row.datetime;

            order.instrument = new Instrument();
            order.instrument.id = row.instrumentid;
            order.instrument.ticker = row.ticker;
            order.instrument.name = row.instrument_name;
            order.instrument.type = row.instrument_type;

            if (row.high !== null) {
                order.instrument.marketData = [new MarketData()];
                order.instrument.marketData[0].instrumentId = row.instrumentid;
                order.instrument.marketData[0].high = parseFloat(row.high);
                order.instrument.marketData[0].low = parseFloat(row.low);
                order.instrument.marketData[0].open = parseFloat(row.open);
                order.instrument.marketData[0].close = parseFloat(row.close);
                order.instrument.marketData[0].previousClose = parseFloat(row.previousclose);
                order.instrument.marketData[0].datetime = row.market_datetime;
            }

            return order;
        });
    }
}