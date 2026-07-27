import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const userId = (req as any).user?.userId || '-';

      const log = {
        method,
        path: originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        ip: ip || req.connection?.remoteAddress || '-',
        userId,
      };

      if (statusCode >= 500) {
        console.error(JSON.stringify({ level: 'error', ...log }));
      } else if (statusCode >= 400) {
        console.warn(JSON.stringify({ level: 'warn', ...log }));
      } else {
        console.log(JSON.stringify({ level: 'info', ...log }));
      }

      return originalSend.call(this, body);
    };

    next();
  }
}
