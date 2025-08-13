import { Position } from "./portoflio-calculator.service";


export interface Asset {
    instrument: number;
    quantity: number;
    positionValue: number;
    performance: number;
    ticker: string;
}

export interface PortfolioSummary {
    portfolioValue: number;
    assets: Asset[];
}

export class AssetCalculator {

    private constructor() { }

    public static create() {
        return new AssetCalculator();
    }

    calculatePortfolioValue(positions: Position[]): PortfolioSummary {
        let portfolioValue = 0;
        const assets: Asset[] = [];

        for (const position of positions) {
            const asset = this.calculateAsset(position);
            portfolioValue += asset.positionValue;
            assets.push(asset);
        }

        return { portfolioValue, assets };
    }

    private calculateAsset(position: Position): Asset {
        const currentPrice = position.marketData?.close || position.marketData?.previousClose || 0;
        const positionValue = position.quantity * currentPrice;
        const avgPrice = position.totalCost / Math.abs(position.quantity);
        const performance = avgPrice > 0 ? ((currentPrice - avgPrice) / avgPrice) * 100 : 0;

        return {
            instrument: position.instrument.id,
            quantity: position.quantity,
            positionValue: parseFloat(positionValue.toFixed(2)),
            performance: parseFloat(performance.toFixed(2)),
            ticker: position.instrument.ticker,
        };
    }
}