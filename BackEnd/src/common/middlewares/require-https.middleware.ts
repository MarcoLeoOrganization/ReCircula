import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequireHttpsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Si estamos en desarrollo o en test, permitimos HTTP
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    // Verificar si la conexión es segura o si el proxy inverso indicó HTTPS
    const isSecure =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https';

    if (!isSecure) {
      throw new ForbiddenException(
        'Por motivos de seguridad, toda comunicación debe realizarse bajo HTTPS/TLS (RNF-03).',
      );
    }

    next();
  }
}
