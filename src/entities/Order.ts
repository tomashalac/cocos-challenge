import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm";
import { MarketData } from "./MarketData";
import { Instrument } from "./Instrument";

export type OrderSide = "BUY" | "SELL" | "CASH_IN" | "CASH_OUT";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "NEW" | "FILLED" | "REJECTED" | "CANCELLED";

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ name: 'instrumentid' })
    instrumentId: number;

    @Column()
    side: OrderSide;

    @Column("decimal", { precision: 10, scale: 2 })
    size: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column()
    type: OrderType;

    @Column()
    status: OrderStatus;

    @Column()
    datetime: Date;

    @ManyToOne(() => Instrument, instrument => instrument.orders)
    @JoinColumn({ name: 'instrumentid', referencedColumnName: 'id' })
    instrument: Instrument;
}