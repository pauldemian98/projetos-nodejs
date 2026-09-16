import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import * as chamadoService from '../services/chamadoService';
import { notificarNovoChamado, notificarAtualizacaoChamado } from '../services/notificacaoService';

export const criarChamado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const solicitanteId = req.user!.id;
    const anexos = req.files as any[];
    
    const chamado = await chamadoService.criarChamado(req.body, solicitanteId, anexos);
    
    // Notificar criação
    await notificarNovoChamado(chamado.id).catch(e => console.error('Erro ao notificar:', e));
    
    return res.status(201).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const listarChamados = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const user = req.user!;
    let whereClause: any = {};

    if (user.papel === 'EXTERNO') {
      whereClause.OR = [
        { solicitanteId: user.id },
        { solicitanteOriginalId: user.id }
      ];
    } else if (['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'].includes(user.papel)) {
      whereClause.OR = [
        { responsavelId: user.id },
        { responsavelId: null },
        { solicitanteId: user.id },
        { solicitanteOriginalId: user.id }
      ];
    }
    // Gestor e Encarregado veem tudo (whereClause vazio)

    const [chamados, total] = await Promise.all([
      prisma.chamado.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          solicitante: { select: { id: true, nome_completo: true, papel: true, avaliacoesRecebidas: { select: { nota_comunicacao: true, nota_retorno: true }, orderBy: { createdAt: 'desc' }, take: 5 } } },
          solicitanteOriginal: { select: { id: true, nome_completo: true, papel: true, avaliacoesRecebidas: { select: { nota_comunicacao: true, nota_retorno: true }, orderBy: { createdAt: 'desc' }, take: 5 } } },
          responsavel: { select: { id: true, nome_completo: true, papel: true } },
          categoria: { select: { nome: true } },
          subcategoria: { select: { nome: true } },
          comentarios: {
            include: { usuario: { select: { nome_completo: true, papel: true } } },
            orderBy: { createdAt: 'asc' }
          },
          anexos: {
            include: { usuario: { select: { nome_completo: true, papel: true } } }
          },
          avaliacao: true
        }
      }),
      prisma.chamado.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: chamados,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

export const escalonarChamado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { direcao } = req.body;
    const chamado = await chamadoService.escalonarChamado(req.params.id, req.user!.id, direcao || 'ACIMA');

    await notificarAtualizacaoChamado(req.params.id, req.user!.id, `Chamado escalonado para ${direcao || 'ACIMA'}`).catch(e => console.error(e));

    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const obterChamado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chamado = await prisma.chamado.findUnique({
      where: { id: req.params.id },
      include: {
        solicitante: { select: { id: true, nome_completo: true, papel: true, avaliacoesRecebidas: { select: { nota_comunicacao: true, nota_retorno: true }, orderBy: { createdAt: 'desc' }, take: 5 } } },
        solicitanteOriginal: { select: { id: true, nome_completo: true, papel: true, avaliacoesRecebidas: { select: { nota_comunicacao: true, nota_retorno: true }, orderBy: { createdAt: 'desc' }, take: 5 } } },
        responsavel: { select: { id: true, nome_completo: true, papel: true } },
        categoria: { select: { nome: true } },
        subcategoria: { select: { nome: true } },
        comentarios: {
          include: { usuario: { select: { nome_completo: true, papel: true } } },
          orderBy: { createdAt: 'asc' }
        },
        anexos: {
          include: { usuario: { select: { nome_completo: true, papel: true } } }
        },
        avaliacao: true
      }
    });

    if (!chamado) return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const adicionarComentario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { texto, is_interno } = req.body;
    const comentario = await prisma.comentario.create({
      data: {
        texto,
        is_interno: is_interno || false,
        chamadoId: req.params.id,
        usuarioId: req.user!.id
      },
      include: { usuario: { select: { nome_completo: true, papel: true } } }
    });

    if (!is_interno) {
      await notificarAtualizacaoChamado(req.params.id, req.user!.id, 'Novo comentário adicionado').catch(e => console.error(e));
    }

    return res.status(201).json({ success: true, data: comentario });
  } catch (error) {
    next(error);
  }
};

export const atualizarStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    let finalStatus = status;

    const temAvaliacao = await prisma.avaliacaoChamado.findUnique({ where: { chamadoId: req.params.id } });
    
    if (temAvaliacao) {
      return res.status(403).json({ success: false, error: 'Chamado encerrado e avaliado. Não é possível alterar o status.' });
    }

    if (status === 'RESOLVIDO') {
      finalStatus = 'AGUARDANDO_AVALIACAO';
    }

    const chamado = await prisma.chamado.update({
      where: { id: req.params.id },
      data: { status: finalStatus }
    });

    await notificarAtualizacaoChamado(req.params.id, req.user!.id, `Status alterado para ${finalStatus}`).catch(e => console.error(e));

    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const avaliarSolicitante = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nota_comunicacao, nota_retorno } = req.body;
    
    const chamado = await prisma.chamado.findUnique({
      where: { id: req.params.id }
    });

    if (!chamado) {
      return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
    }

    const avaliadoId = chamado.solicitanteOriginalId || chamado.solicitanteId;

    // Create the evaluation
    const avaliacao = await prisma.avaliacaoSolicitante.create({
      data: {
        nota_comunicacao,
        nota_retorno,
        chamadoId: req.params.id,
        agenteId: req.user!.id,
        avaliadoId
      }
    });

    // Also update the status to AGUARDANDO_AVALIACAO or RESOLVIDO
    const temAvaliacao = await prisma.avaliacaoChamado.findUnique({ where: { chamadoId: req.params.id } });
    const finalStatus = temAvaliacao ? 'RESOLVIDO' : 'AGUARDANDO_AVALIACAO';

    await prisma.chamado.update({
      where: { id: req.params.id },
      data: { status: finalStatus }
    });

    return res.status(201).json({ success: true, data: avaliacao });
  } catch (error) {
    next(error);
  }
};

export const atualizarSolicitanteOriginal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { solicitanteOriginalId } = req.body;
    const chamado = await prisma.chamado.update({
      where: { id: req.params.id },
      data: { solicitanteOriginalId: solicitanteOriginalId || null },
      include: { solicitanteOriginal: { select: { id: true, nome_completo: true } } }
    });
    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const atualizarPrioridade = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prioridade } = req.body;
    const is_emergencia = prioridade === 'EMERGENCIAL';
    const chamado = await prisma.chamado.update({
      where: { id: req.params.id },
      data: { prioridade, is_emergencia }
    });
    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

export const adicionarAnexo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anexos = req.files as any[];
    if (!anexos || anexos.length === 0) return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    
    const anexosData = anexos.map(file => ({
      chamadoId: req.params.id,
      nome_original: file.originalname,
      url_arquivo: `/uploads/${file.filename}`,
      usuarioId: req.user!.id
    }));
    
    await prisma.anexo.createMany({ data: anexosData });
    const novosAnexos = await prisma.anexo.findMany({ where: { chamadoId: req.params.id } });

    await notificarAtualizacaoChamado(req.params.id, req.user!.id, 'Novo anexo adicionado').catch(e => console.error(e));

    return res.status(201).json({ success: true, data: novosAnexos });
  } catch (error) {
    next(error);
  }
};

export const avaliarChamado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nota_satisfacao, comentario, problema_resolvido } = req.body;
    
    const chamado = await prisma.chamado.findUnique({
      where: { id: req.params.id }
    });

    if (!chamado) {
      return res.status(404).json({ success: false, error: 'Chamado não encontrado' });
    }

    const user = req.user!;
    const isTI = ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3', 'GESTOR', 'ENCARREGADO'].includes(user.papel);

    if (isTI) {
      // Para o agente de TI ele só deve responder avaliando o chamado quando ele for o Solicitante Original
      if (chamado.solicitanteOriginalId !== user.id) {
        return res.status(403).json({
          success: false,
          error: 'Como Agente de TI, você só pode avaliar o chamado quando for o Solicitante Original.',
        });
      }
    } else {
      // Usuário externo pode avaliar se for solicitante ou solicitante original
      if (chamado.solicitanteId !== user.id && chamado.solicitanteOriginalId !== user.id) {
        return res.status(403).json({ success: false, error: 'Apenas o solicitante pode avaliar' });
      }
    }

    const avaliacao = await prisma.avaliacaoChamado.create({
      data: {
        nota_satisfacao,
        comentario,
        problema_resolvido,
        chamadoId: chamado.id
      }
    });

    const chamadoAtualizado = await prisma.chamado.update({
      where: { id: chamado.id },
      data: { status: 'RESOLVIDO' }
    });

    return res.status(200).json({ success: true, data: { avaliacao, chamado: chamadoAtualizado } });
  } catch (error) {
    next(error);
  }
};

export const atribuirResponsavel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (user.papel !== 'GESTOR' && user.papel !== 'ENCARREGADO') {
      return res.status(403).json({ success: false, error: 'Apenas administradores podem atribuir responsáveis' });
    }

    const { responsavelId, novoResponsavelId } = req.body;
    const targetResponsavelId = novoResponsavelId !== undefined ? novoResponsavelId : responsavelId;

    const chamado = await chamadoService.atribuirResponsavel(
      req.params.id,
      targetResponsavelId || null,
      user.id
    );

    await notificarAtualizacaoChamado(req.params.id, req.user!.id, 'Responsável pelo chamado alterado').catch(e => console.error(e));

    return res.status(200).json({ success: true, data: chamado });
  } catch (error) {
    next(error);
  }
};

