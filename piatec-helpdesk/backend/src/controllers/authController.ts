import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, senha } = req.body;
    const result = await authService.login(email, senha);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
