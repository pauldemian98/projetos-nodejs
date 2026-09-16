import prisma from '../lib/prisma';
import { differenceInSeconds } from 'date-fns';
import { sendEmail } from '../utils/mailer';
import { notificarAtualizacaoChamado } from './notificacaoService';

export const iniciarTrabalho = async (usuarioId: string, chamadoId?: string, tarefaId?: string) => {
  return await prisma.$transaction(async (tx) => {
    // Busca apontamento em aberto do usuário
    const emAberto = await tx.apontamentoTempo.findFirst({
      where: { usuarioId, fim: null }
    });

    if (emAberto) {
      throw new Error('Existe um apontamento em aberto. Conclua-o antes de iniciar outro.');
    }

    const agoraUTC = new Date();
    
    // Regra: quem clicar em iniciar o atendimento (iniciando o timer) deve ser vinculado a esse chamado como responsável
    if (chamadoId) {
      const chamado = await tx.chamado.findUnique({
        where: { id: chamadoId },
        include: { responsavel: true }
      });

      if (chamado) {
        const updateData: any = {
          responsavelId: usuarioId,
        };
        if (chamado.status === 'ABERTO') {
          updateData.status = 'EM_ANALISE';
        }

        await tx.chamado.update({
          where: { id: chamadoId },
          data: updateData
        });

        if (chamado.responsavelId !== usuarioId) {
          const antigoNome = chamado.responsavel?.nome_completo || 'Sem responsável';
          const usuarioAtual = await tx.user.findUnique({ where: { id: usuarioId } });
          await tx.historicoChamado.create({
            data: {
              chamadoId,
              usuarioId,
              campo_alterado: 'responsavelId_inicio_atendimento',
              valor_antigo: antigoNome,
              valor_novo: usuarioAtual?.nome_completo || usuarioId
            }
          });
        }
      }
    }

    const apontamento = await tx.apontamentoTempo.create({
      data: {
        inicio: agoraUTC,
        usuarioId,
        chamadoId,
        tarefaId
      }
    });

    return apontamento;
  });
};

export const pausarOuFinalizarTrabalho = async (usuarioId: string, texto_resolucao?: string) => {
  return await prisma.$transaction(async (tx) => {
    const emAberto = await tx.apontamentoTempo.findFirst({
      where: { usuarioId, fim: null }
    });

    if (!emAberto) {
      throw new Error('Nenhum trabalho em andamento encontrado.');
    }

    const agoraUTC = new Date();
    const segundosGastos = differenceInSeconds(agoraUTC, new Date(emAberto.inicio));

    await tx.apontamentoTempo.update({
      where: { id: emAberto.id },
      data: {
        fim: agoraUTC,
        segundos_gastos: Math.max(0, segundosGastos),
      }
    });

    // Somar tempo no Chamado ou Tarefa
    if (emAberto.chamadoId) {
      const chamado = await tx.chamado.update({
        where: { id: emAberto.chamadoId },
        data: { tempo_gasto_total_segundos: { increment: Math.max(0, segundosGastos) } },
        include: { solicitante: true }
      });

      // Se passou texto_resolucao, é uma finalização
      if (texto_resolucao) {
        await tx.chamado.update({
          where: { id: emAberto.chamadoId },
          data: { status: 'RESOLVIDO' }
        });

        await tx.comentario.create({
          data: {
            texto: texto_resolucao,
            chamadoId: chamado.id,
            usuarioId,
            is_interno: false
          }
        });

        if (!chamado.is_emergencia) {
          // Dispara e-mail de pesquisa de satisfação
          const link = `${process.env.FRONTEND_URL}/avaliacao/${chamado.id}`;
          await sendEmail(chamado.solicitante.email, `Chamado Resolvido: Avalie nosso atendimento`, `Seu chamado foi resolvido! Avalie nosso atendimento no link: ${link}`);
        } else {
          // Notify the resolution as an update if no survey is sent, or even if it is.
          // Wait, the sendEmail above goes to solicitante. What about solicitanteOriginal?
          // Let's call the helper in both cases
        }
        await notificarAtualizacaoChamado(chamado.id, usuarioId, 'Chamado resolvido').catch(e => console.error(e));
      }
    }

    if (emAberto.tarefaId) {
      await tx.tarefa.update({
        where: { id: emAberto.tarefaId },
        data: { tempo_gasto_total_segundos: { increment: Math.max(0, segundosGastos) } }
      });
    }

    return { success: true, segundosGastos };
  });
};

export const obterTrabalhoAtivo = async (usuarioId: string) => {
  return await prisma.apontamentoTempo.findFirst({
    where: { usuarioId, fim: null },
    include: {
      chamado: { select: { tempo_gasto_total_segundos: true } },
      tarefa: { select: { tempo_gasto_total_segundos: true } }
    }
  });
};
