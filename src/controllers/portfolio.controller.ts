import { Request, Response } from 'express';
import { User } from '../entities/User';
import { Order } from '../entities/Order';
import { Instrument } from '../entities/Instrument';
import { MarketData } from '../entities/MarketData';
import { AppDataSource } from '../config/data-source';
import { In } from 'typeorm';
import { OrderService } from '../services/order.service';
import { PortfolioCalculator } from '../services/portoflio-calculator.service';
import { AssetCalculator } from '../services/assert-calculator.service';

class PortfolioController {
    async getPortfolio(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            // esto normalmente seria un middleware con auth que ya verifica, maneja y carga los datos
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: parseInt(userId) }
            });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const orderService = new OrderService();
            const orders = await orderService.getValidsOrdersWithMarketDataAndInstruments(user.id);

            const portfolio = PortfolioCalculator.create().calculatePortfolio(orders);

            const assets = AssetCalculator.create().calculatePortfolioValue(Array.from(portfolio.positions.values()));

            const totalValue = assets.portfolioValue + portfolio.cash + portfolio.assignCash;
            res.json({
                totalValue: parseFloat(totalValue.toFixed(2)),
                totalValueTicker: 'ARS',
                availableBalance: parseFloat(portfolio.cash.toFixed(2)),
                availableBalanceTicker: "ARS",
                assets: assets.assets
            });
        } catch (error) {
            console.error('Error fetching portfolio: ', error);
            res.status(500).json({ message: 'Error fetching portfolio', error: (error as Error).message });
        }
    }
}

export const portfolioController = new PortfolioController();