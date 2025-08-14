import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from "typeorm";
import { Order } from "./Order";
import { Instrument } from "./Instrument";

@Entity('marketdata')
export class MarketData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'instrumentid' })
    instrumentId: number;

    @Column("decimal", { precision: 10, scale: 2 })
    high: number;

    @Column("decimal", { precision: 10, scale: 2 })
    low: number;

    @Column("decimal", { precision: 10, scale: 2 })
    open: number;

    @Column("decimal", { precision: 10, scale: 2 })
    close: number;

    @Column("decimal", { precision: 10, scale: 2, name: "previousclose" })
    previousClose: number;

    @Column()
    date: Date;

    @ManyToOne(() => Instrument, instrument => instrument.marketData)
    @JoinColumn({ name: 'instrumentid', referencedColumnName: 'id' })
    instrument: Instrument;
}