import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err); require('fs').writeFileSync('last_error.json', JSON.stringify({ body: req.body, err: err.errors || err }, null, 2));

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Erro de Validação',
      details: err.errors,
      statusCode: 400,
    });
  }

  // Erros do Prisma
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: 'Erro de Banco de Dados',
      details: err.meta,
      statusCode: 400,
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
};

