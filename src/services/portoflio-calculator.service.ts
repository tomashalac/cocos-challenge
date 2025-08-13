import { Order } from '../entities/Order';
import { MarketData } from '../entities/MarketData';
import { Instrument } from '../entities/Instrument';

export interface Position {
    quantity: number;
    totalCost: number;
    instrument: Instrument;
    marketData: MarketData;
    orders: Order[];
}

export interface Portfolio {
    positions: Map<number, Position>;
    cash: number;
    assignCash: number;
}

export class PortfolioCalculator {

    private constructor() {

    }

    public static create() {
        return new PortfolioCalculator();
    }

    calculatePortfolio(orders: Order[]): Portfolio {
        // Calcular posiciones agrupando por instrumento
        const positions = new Map<number, Position>();
        let cash = 0;
        let assignCash = 0;

        for (const order of orders) {
            const instrumentId = order.instrumentId;

            if (order.status === 'NEW') {
                // la plata la tiene como cash pero esta asignada y aun no la pude usar
                assignCash += order.size * order.price;
            } else if (order.side === 'CASH_IN') {
                cash += order.size;
            } else if (order.side === 'CASH_OUT') {
                cash -= order.size;
            } else {
                this.initializePositionIfNotExists(positions, order, instrumentId);
                this.processFilledOrder(positions, order, instrumentId, cash);
            }
        }

        return { positions, cash, assignCash };
    }

    private processFilledOrder(positions: Map<number, Position>, order: Order, instrumentId: number, cash: number): void {
        const position = positions.get(instrumentId)!;
        if (order.side === 'BUY') {
            position.quantity += order.size;
            position.totalCost += order.size * order.price;
        } else if (order.side === 'SELL') {
            position.quantity -= order.size;
            if (position.quantity < 0) {
                console.error('The user can not have negative stock, value: ' + position.quantity + ' stock: ' + order.instrument.ticker);
            }
            position.totalCost -= order.size * order.price;
        } else {
            throw new Error('Invalid type!, type: ' + order.side);
        }
    }

    private initializePositionIfNotExists(positions: Map<number, Position>, order: Order, instrumentId: number): void {
        if (!positions.has(instrumentId)) {
            const marketData = order.instrument?.marketData?.[0];

            positions.set(instrumentId, {
                quantity: 0,
                totalCost: 0,
                instrument: order.instrument,
                marketData: marketData,
                orders: []
            });
        }
    }

}