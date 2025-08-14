import { Repository } from 'typeorm';
import { Order } from '../entities/Order';
import { Instrument } from '../entities/Instrument';
import { MarketData } from '../entities/MarketData';
import { AppDataSource } from '../config/data-source';
import { SubmitOrderDTO, OrderValidationResult } from '../controllers/orders.controller';
import { PortfolioCalculator } from './portoflio-calculator.service';
import { AssetCalculator } from './assert-calculator.service';

export class PutOrderService {
    private orderRepository: Repository<Order>;
    private instrumentRepository: Repository<Instrument>;
    private marketDataRepository: Repository<MarketData>;

    constructor() {
        this.orderRepository = AppDataSource.getRepository(Order);
        this.instrumentRepository = AppDataSource.getRepository(Instrument);
        this.marketDataRepository = AppDataSource.getRepository(MarketData);
    }

    static create(): PutOrderService {
        return new PutOrderService();
    }

    async submitOrder(orderData: SubmitOrderDTO): Promise<{ order: Order, error?: OrderValidationResult }> {
        const validation = await this.validateOrder(orderData);
        if (!validation.isValid) {
            return { error: validation, order: await this.createRejectedOrder(orderData, validation.error!) };
        }

        const order = new Order();
        order.userId = orderData.userId;
        order.instrumentId = orderData.instrumentId;
        order.side = orderData.side;
        order.type = orderData.type;
        order.size = validation.calculatedQuantity!;
        order.price = validation.finalPrice!;
        if (orderData.type == 'LIMIT') {
            order.status = 'FILLED';
        } else {
            order.status = 'NEW';
        }
        order.datetime = new Date();

        return { order: await this.orderRepository.save(order) };
    }

    private async validateOrder(orderData: SubmitOrderDTO): Promise<OrderValidationResult> {
        const instrument = await this.instrumentRepository.findOne({
            where: { id: orderData.instrumentId }
        });
        if (!instrument) {
            return { isValid: false, error: 'Instrument not found' };
        }

        const currentPrice = await this.getPrice(orderData.instrumentId);
        if (currentPrice.error) {
            return currentPrice.error;
        }


        const finalPrice = orderData.type === 'MARKET' ? currentPrice.price : orderData.price!;

        if (orderData.type === 'LIMIT' && (!orderData.price || orderData.price <= 0)) {
            return { isValid: false, error: 'Price is required for LIMIT orders' };
        }

        let calculatedQuantity: number;

        if (orderData.quantity) {
            if (Number.isInteger(orderData.quantity) == false) {
                return { isValid: false, error: 'The quantity must be an integer' };
            }
            calculatedQuantity = orderData.quantity;
        } else if (orderData.totalAmount) {
            calculatedQuantity = Math.floor(orderData.totalAmount / finalPrice);
            if (calculatedQuantity <= 0) {
                return { isValid: false, error: 'Total amount too small to buy any shares' };
            }
        } else {
            return { isValid: false, error: 'Either quantity or totalAmount must be provided' };
        }

        const fundsValidation = await this.validateFunds(orderData.userId, orderData.side, calculatedQuantity, finalPrice, orderData.instrumentId);
        if (!fundsValidation.isValid) {
            return fundsValidation;
        }

        return {
            isValid: true,
            calculatedQuantity,
            finalPrice
        };
    }

    private async validateFunds(userId: number, side: string, quantity: number, price: number, instrumentId: number): Promise<OrderValidationResult> {
        const orders = await this.getUserOrders(userId);
        const portfolio = PortfolioCalculator.create().calculatePortfolio(orders);

        if (side === 'BUY') {
            const requiredAmount = quantity * price;
            if (portfolio.cash < requiredAmount) {
                return { isValid: false, error: 'Insufficient funds' };
            }
        } else if (side === 'SELL') {
            const userOrders = await this.getUserOrdersForInstrument(userId, quantity);
            const assets = AssetCalculator.create().calculatePortfolioValue(Array.from(portfolio.positions.values()));

            const asset = assets.assets.find(asset => asset.instrument == instrumentId);
            if (!asset || asset.quantity < quantity) {
                return { isValid: false, error: 'Insufficient shares' };
            }
        }

        return { isValid: true };
    }

    private async getUserOrders(userId: number): Promise<Order[]> {
        return await this.orderRepository.find({
            where: { userId: userId, status: 'FILLED' },
            relations: ['instrument']
        });
    }

    private async getUserOrdersForInstrument(userId: number, instrumentId: number): Promise<Order[]> {
        return await this.orderRepository.find({
            where: { userId: userId, instrumentId: instrumentId, status: 'FILLED' }
        });
    }

    private async getLatestMarketData(instrumentId: number): Promise<MarketData | null> {
        return await this.marketDataRepository.findOne({
            where: { instrumentId: instrumentId },
            order: { date: 'DESC' }
        });
    }

    private async createRejectedOrder(orderData: SubmitOrderDTO, error: string): Promise<Order> {
        const order = new Order();
        order.userId = orderData.userId;
        order.instrumentId = orderData.instrumentId;
        order.side = orderData.side;
        order.type = orderData.type;
        order.size = orderData.quantity || 0;
        order.price = orderData.price || 0;
        order.status = 'REJECTED';
        order.datetime = new Date();

        return await this.orderRepository.save(order);
    }

    private async getPrice(instrumentId: number): Promise<{ error?: OrderValidationResult, price?: number }> {
        const marketData = await this.getLatestMarketData(instrumentId);
        if (!marketData) {
            return { error: { isValid: false, error: 'No market data available' } };
        }

        const currentPrice = marketData.close || marketData.open;
        if (!currentPrice || currentPrice <= 0) {
            return { error: { isValid: false, error: 'Invalid market price' } };
        }

        return { price: currentPrice };
    }
}