import { Request, Response } from 'express';
import { Instrument } from '../entities/Instrument';
import { AppDataSource } from '../config/data-source';
import { InstrumentService } from '../services/instrument.service';

class InstrumentController {

    constructor() { }

    async searchInstruments(req: Request, res: Response) {
        try {
            const { query } = req.query;

            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    message: 'Query parameter is required and must be a string'
                });
            }

            // aca normalmente agregaria mas checks de seguridad, largo menor a 500, solo caracteres basicos(whitelist)
            // y lo ideal seria un elastic search o algo asi y tambien poner ratelimit, ya que es bastante pesado esta request
            const instrumentRepository = AppDataSource.getRepository(Instrument);
            const instrumentService = new InstrumentService(instrumentRepository);
            const instruments = await instrumentService.searchInstruments(query);

            res.json({
                success: true,
                data: instruments,
                count: instruments.length
            });
        } catch (error) {
            console.error('Error searching instruments:', error);
            res.status(500).json({
                success: false,
                message: 'Error searching instruments',
                error: (error as Error).message
            });
        }
    }
}

export const instrumentController = new InstrumentController();