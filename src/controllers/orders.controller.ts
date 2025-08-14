import { Request, Response } from 'express';
import { PutOrderService } from '../services/put-order.service';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';

export interface SubmitOrderDTO {
    userId: number;
    instrumentId: number;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity?: number;
    totalAmount?: number;
    price?: number;
}

export interface OrderValidationResult {
    isValid: boolean;
    error?: string;
    calculatedQuantity?: number;
    finalPrice?: number;
}

class OrderController {
    private orderService: PutOrderService;

    constructor() {
        this.orderService = PutOrderService.create();
    }

    async submitOrder(req: Request, res: Response) {
        try {
            const orderData: SubmitOrderDTO = req.body;

            if (!this.validateRequestData(orderData)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid request data'
                });
            }


            // esto normalmente seria un middleware con auth que ya verifica, maneja y carga los datos
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: parseInt(orderData.userId?.toString()) }
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }



            const orderResponse = await this.orderService.submitOrder(orderData);
            const error = orderResponse.error;
            const order = orderResponse.order;

            if (error || order.status === 'REJECTED') {
                let orderObj = undefined;
                if (order) {
                    orderObj = {
                        id: order.id,
                        status: order.status,
                        instrumentId: order.instrumentId,
                        side: order.side,
                        type: order.type,
                        quantity: order.size,
                        price: order.price,
                        datetime: order.datetime
                    };
                }
                return res.status(400).json({
                    success: false,
                    message: 'Order rejected',
                    error: error,
                    order: orderObj,
                });
            }

            res.status(201).json({
                success: true,
                message: 'Order submitted successfully',
                order: {
                    id: order.id,
                    status: order.status,
                    instrumentId: order.instrumentId,
                    side: order.side,
                    type: order.type,
                    quantity: order.size,
                    price: order.price,
                    datetime: order.datetime
                }
            });
        } catch (error) {
            console.error('Error submitting order:', error);
            res.status(500).json({
                success: false,
                message: 'Error submitting order',
                error: (error as Error).message
            });
        }
    }

    private validateRequestData(orderData: SubmitOrderDTO): boolean {
        if (!orderData.userId || !orderData.instrumentId || !orderData.side || !orderData.type) {
            return false;
        }

        if (!['BUY', 'SELL'].includes(orderData.side)) {
            return false;
        }

        if (!['MARKET', 'LIMIT'].includes(orderData.type)) {
            return false;
        }

        if (!orderData.quantity && !orderData.totalAmount) {
            return false;
        }

        if (orderData.type === 'LIMIT' && !orderData.price) {
            return false;
        }

        return true;
    }
}

export const orderController = new OrderController();