import { Request, Response, NextFunction } from 'express';
import * as trabalhoService from '../services/trabalhoService';

export const iniciar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chamadoId, tarefaId } = req.body;
    const apontamento = await trabalhoService.iniciarTrabalho(req.user!.id, chamadoId, tarefaId);
    
    if (chamadoId) {
      await import('../services/notificacaoService').then(m => m.notificarAtualizacaoChamado(chamadoId, req.user!.id, 'Atendimento iniciado/retomado')).catch(e => console.error(e));
    }
    
    return res.status(201).json({ success: true, data: apontamento });
  } catch (error) {
    next(error);
  }
};

export const pausarOuFinalizar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { texto_resolucao } = req.body; // se enviar, finaliza
    const resultado = await trabalhoService.pausarOuFinalizarTrabalho(req.user!.id, texto_resolucao);
    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    next(error);
  }
};

export const obterAtivo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apontamento = await trabalhoService.obterTrabalhoAtivo(req.user!.id);
    return res.status(200).json({ success: true, data: apontamento });
  } catch (error) {
    next(error);
  }
};
