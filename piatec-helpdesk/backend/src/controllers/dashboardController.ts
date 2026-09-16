import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export const getAgentesAvaliacao = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentes = await prisma.user.findMany({
      where: {
        papel: {
          in: ['GESTOR', 'ENCARREGADO', 'ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3']
        }
      },
      select: {
        id: true,
        nome_completo: true,
        chamadosResponsaveis: {
          where: {
            avaliacao: { isNot: null }
          },
          select: {
            avaliacao: { select: { nota_satisfacao: true } }
          }
        }
      }
    });

    const data = agentes.map(agente => {
      let media = 0;
      let avaliacoesCount = 0;
      
      const avaliacoes = agente.chamadosResponsaveis
        .map(c => c.avaliacao?.nota_satisfacao)
        .filter(nota => nota !== undefined && nota !== null) as number[];
        
      if (avaliacoes.length > 0) {
        media = avaliacoes.reduce((a, b) => a + b, 0) / avaliacoes.length;
        avaliacoesCount = avaliacoes.length;
      }

      return {
        id: agente.id,
        nome: agente.nome_completo,
        media: Number(media.toFixed(1)),
        avaliacoesCount
      };
    });

    // Ordenar do maior para o menor
    data.sort((a, b) => b.media - a.media);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};