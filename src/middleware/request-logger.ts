
import express, { NextFunction, Request, Response } from 'express';

export function logRequestAndResponse(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    function onResponseFinish(): void {
        res.removeListener('finish', onResponseFinish);

        const duration = Date.now() - startTime;

        console.log(`[${req.method}] ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }

    res.on('finish', onResponseFinish);
    next();
}
