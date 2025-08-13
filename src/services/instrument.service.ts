import { Repository } from 'typeorm';
import { Instrument } from '../entities/Instrument';
import { AppDataSource } from '../config/data-source';

export class InstrumentService {

    constructor(private instrumentRepository: Repository<Instrument>) { }

    static create(): InstrumentService {
        const instrumentRepository = AppDataSource.getRepository(Instrument);
        return new InstrumentService(instrumentRepository);
    }

    async searchInstruments(query: string): Promise<Instrument[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const searchTerm = query.trim().toLowerCase();

        return await this.instrumentRepository
            .createQueryBuilder('instrument')
            .where('LOWER(instrument.ticker) LIKE :search', { search: `%${searchTerm}%` })
            .orWhere('LOWER(instrument.name) LIKE :search', { search: `%${searchTerm}%` })
            .orderBy('instrument.ticker', 'ASC')
            .limit(20)
            .getMany();
    }
}