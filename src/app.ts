
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_FILE || "prod.env" });

import express from 'express';
import { portfolioController } from './controllers/portfolio.controller';
import { instrumentController } from './controllers/instruments.controller';
import { orderController } from './controllers/orders.controller';
import { logRequestAndResponse } from './middleware/request-logger';


const app = express();

app.use(express.json());


app.use(logRequestAndResponse);

app.get('/api/portfolio/:userId', portfolioController.getPortfolio.bind(portfolioController));
app.get('/api/instruments/search', instrumentController.searchInstruments.bind(instrumentController));
app.post('/api/orders', orderController.submitOrder.bind(orderController));


app.use('*', (req, res) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

export { app };