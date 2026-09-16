import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

export const criarUsuarioExterno = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userLogado = req.user!;
    if (userLogado.papel === 'EXTERNO') {
      return res.status(403).json({ success: false, error: 'Sem permissão para criar usuários' });
    }

    const novoUser = await userService.criarUsuarioExterno(req.body);
    return res.status(201).json({ success: true, data: novoUser });
  } catch (error) {
    next(error);
  }
};
