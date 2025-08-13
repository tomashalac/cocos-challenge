import { DataSource } from "typeorm";
import { Instrument } from "../entities/Instrument";
import { MarketData } from "../entities/MarketData";
import { Order } from "../entities/Order";
import { User } from "../entities/User";


export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? ''),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Instrument, Order, MarketData],
    synchronize: false,
    ssl: {
        rejectUnauthorized: false
    },

    extra: {
        connectionLimit: 10,
        connectTimeout: 60000,
        waitForConnections: true,
    }
});