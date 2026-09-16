import prisma from '../lib/prisma';
import { sendEmail } from '../utils/mailer';

export const obterAgenteMenorCarga = async (categoriaId: string, papeisPermitidos?: string[]) => {
  let whereClause: any = { categoriaId };
  if (papeisPermitidos && papeisPermitidos.length > 0) {
    whereClause.usuario = { papel: { in: papeisPermitidos } };
  }

  const agentesNaCategoria = await prisma.especialidadeAgente.findMany({
    where: whereClause,
    include: { usuario: true },
  });

  let agentesIds: string[] = [];

  if (agentesNaCategoria.length === 0) {
    // Fallback: se ninguém tem a especialidade cadastrada, buscar qualquer usuário com o papel permitido (ou qualquer agente se não houver filtro)
    const fallbackRoles = papeisPermitidos && papeisPermitidos.length > 0 ? papeisPermitidos : ['GESTOR', 'ENCARREGADO', 'ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'];
    const fallbackAgents = await prisma.user.findMany({ where: { papel: { in: fallbackRoles } } });
    if (fallbackAgents.length === 0) return null;
    agentesIds = fallbackAgents.map(a => a.id);
  } else {
    agentesIds = agentesNaCategoria.map(a => a.usuarioId);
  }

  const contagemChamados = await prisma.chamado.groupBy({
    by: ['responsavelId'],
    where: {
      status: { in: ['ABERTO', 'EM_ANALISE'] },
      responsavelId: { in: agentesIds }
    },
    _count: { id: true }
  });

  // Mapear agentes com sua respectiva carga (0 se não tiver chamados)
  const cargaAgentes = agentesIds.map(id => {
    const contagem = contagemChamados.find(c => c.responsavelId === id);
    return {
      usuarioId: id,
      carga: contagem ? contagem._count.id : 0
    };
  });

  cargaAgentes.sort((a, b) => a.carga - b.carga);
  return cargaAgentes[0].usuarioId;
};

export const criarChamado = async (data: any, solicitanteId: string, anexoFiles?: any[]) => {
  return await prisma.$transaction(async (tx) => {
    const solicitante = await tx.user.findUnique({ where: { id: solicitanteId } });
    const isAgenteTI = solicitante && solicitante.papel !== 'EXTERNO';

    let responsavelId: string | null = null;
    let is_emergencia = false;
    let is_alinhamento_interno = false;

    // Regra: se agente de TI abre o chamado, direciona automaticamente para ele.
    // Se usuário externo abre, fica sem atendente (responsavelId = null) para aparecer para todos.
    if (data.responsavelId) {
      responsavelId = data.responsavelId;
    } else if (isAgenteTI) {
      responsavelId = solicitanteId;
    } else {
      responsavelId = null;
    }

    let prioridade = data.prioridade || 'MEDIA';

    if (responsavelId) {
      const responsavel = await tx.user.findUnique({ where: { id: responsavelId } });
      
      if (solicitante?.papel !== 'EXTERNO' && responsavel?.papel !== 'EXTERNO') {
        if (solicitanteId === responsavelId) {
          if (prioridade === 'EMERGENCIAL') {
            is_emergencia = true;
          }
        } else {
          const assistentes = ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'];
          const gestores = ['GESTOR', 'ENCARREGADO'];

          const solIsAssistente = assistentes.includes(solicitante?.papel || '');
          const solIsGestor = gestores.includes(solicitante?.papel || '');
          const respIsAssistente = assistentes.includes(responsavel?.papel || '');
          const respIsGestor = gestores.includes(responsavel?.papel || '');

          if (solIsAssistente && respIsGestor) {
            prioridade = 'MEDIA';
            is_alinhamento_interno = true;
          } else if (solIsGestor && respIsAssistente) {
            prioridade = 'PRIORITARIO';
            is_alinhamento_interno = false; 
          } else {
            is_alinhamento_interno = true;
          }
        }
      }
    }

    let codigo = null;
    if (data.categoriaId) {
      const cat = await tx.categoria.findUnique({ where: { id: data.categoriaId } });
      if (cat) {
        const prefixo = (cat.prefixo && cat.prefixo.trim()) 
          ? cat.prefixo.trim().toUpperCase().replace(/-$/, '') 
          : (cat.nome ? cat.nome.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'CH');
        const count = await tx.chamado.count({ where: { categoriaId: data.categoriaId } });
        const nextSeq = count + 1;
        codigo = `${prefixo}-${String(nextSeq).padStart(3, '0')}`;
      }
    }

    const chamado = await tx.chamado.create({
      data: {
        codigo: codigo,
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: prioridade,
        link_reuniao: data.link_reuniao,
        solicitanteId,
        responsavelId,
        solicitanteOriginalId: data.solicitanteOriginalId || null,
        categoriaId: data.categoriaId,
        subcategoriaId: data.subcategoriaId || null,
        is_emergencia,
        is_alinhamento_interno
      }
    });

    if (anexoFiles && anexoFiles.length > 0) {
      const anexosData = anexoFiles.map(file => ({
        chamadoId: chamado.id,
        nome_original: file.originalname,
        url_arquivo: `/uploads/${file.filename}`,
        usuarioId: solicitanteId
      }));
      await tx.anexo.createMany({ data: anexosData });
    }

    // Enviar notificação caso tenha responsável diferente do solicitante
    if (responsavelId && responsavelId !== solicitanteId) {
      const resp = await tx.user.findUnique({ where: { id: responsavelId } });
      if (resp) {
        await sendEmail(resp.email, `Novo chamado atribuído: ${chamado.titulo}`, `Um novo chamado foi atribuído a você: ${chamado.id}`);
      }
    }

    return chamado;
  });
};

export const escalonarChamado = async (chamadoId: string, usuarioAcaoId: string, direcao: 'ACIMA' | 'ABAIXO' = 'ACIMA') => {
  return await prisma.$transaction(async (tx) => {
    const chamado = await tx.chamado.findUnique({ where: { id: chamadoId }, include: { responsavel: true } });
    if (!chamado) throw new Error('Chamado não encontrado');

    const config = await tx.configuracaoSistema.findUnique({ where: { chave: 'ORDEM_ESCALONAMENTO' } });
    if (!config) throw new Error('Ordem de escalonamento não configurada');

    const ordem = config.valor as string[];
    const papelAtual = chamado.responsavel?.papel;
    
    let proximoPapel: string | null = null;
    if (papelAtual) {
      const indexAtual = ordem.indexOf(papelAtual);
      if (direcao === 'ACIMA') {
        // "O primeiro nível (index 0) é o mais baixo". Logo, subir (ACIMA) significa ir para um índice maior (indexAtual + 1)
        if (indexAtual >= 0 && indexAtual < ordem.length - 1) {
          proximoPapel = ordem[indexAtual + 1];
        } else {
          throw new Error('Não há nível superior para escalonar');
        }
      } else {
        if (indexAtual > 0) {
          proximoPapel = ordem[indexAtual - 1];
        } else {
          throw new Error('Não há nível inferior para desescalonar');
        }
      }
    } else {
      proximoPapel = ordem[0];
    }

    if (!proximoPapel) throw new Error('Falha ao determinar o próximo nível');

    // Identificar próximo agente disponível
    const novoResponsavelId = await obterAgenteMenorCarga(chamado.categoriaId, [proximoPapel]);
    if (!novoResponsavelId) throw new Error(`Nenhum agente do papel ${proximoPapel} disponível`);

    const antigoResponsavelId = chamado.responsavelId;

    const chamadoAtualizado = await tx.chamado.update({
      where: { id: chamadoId },
      data: { responsavelId: novoResponsavelId }
    });

    await tx.historicoChamado.create({
      data: {
        chamadoId,
        usuarioId: usuarioAcaoId,
        campo_alterado: 'responsavelId_escalonamento',
        valor_antigo: antigoResponsavelId || 'Sem responsável',
        valor_novo: novoResponsavelId
      }
    });

    return chamadoAtualizado;
  });
};

export const atribuirResponsavel = async (chamadoId: string, novoResponsavelId: string | null, usuarioExecutorId: string) => {
  return await prisma.$transaction(async (tx) => {
    const chamado = await tx.chamado.findUnique({
      where: { id: chamadoId },
      include: { responsavel: true }
    });
    if (!chamado) throw new Error('Chamado não encontrado');

    let novoRespUser = null;
    if (novoResponsavelId) {
      novoRespUser = await tx.user.findUnique({ where: { id: novoResponsavelId } });
      if (!novoRespUser || !novoRespUser.ativo || novoRespUser.papel === 'EXTERNO') {
        throw new Error('Usuário selecionado não é um agente de TI válido ou ativo');
      }
    }

    const antigoNome = chamado.responsavel?.nome_completo || 'Sem responsável';
    const novoNome = novoRespUser?.nome_completo || 'Sem responsável';

    const chamadoAtualizado = await tx.chamado.update({
      where: { id: chamadoId },
      data: {
        responsavelId: novoResponsavelId,
        ...(chamado.status === 'ABERTO' && novoResponsavelId ? { status: 'EM_ANALISE' } : {})
      },
      include: {
        solicitante: { select: { id: true, nome_completo: true, papel: true } },
        responsavel: { select: { id: true, nome_completo: true, papel: true } },
        categoria: { select: { nome: true } },
        subcategoria: { select: { nome: true } },
      }
    });

    if (chamado.responsavelId !== novoResponsavelId) {
      await tx.historicoChamado.create({
        data: {
          chamadoId,
          usuarioId: usuarioExecutorId,
          campo_alterado: 'responsavelId',
          valor_antigo: antigoNome,
          valor_novo: novoNome
        }
      });
    }

    if (novoRespUser && novoRespUser.id !== usuarioExecutorId) {
      await sendEmail(
        novoRespUser.email,
        `Chamado atribuído a você: ${chamado.titulo}`,
        `Você foi definido como responsável pelo chamado #${chamado.codigo || chamado.id}: ${chamado.titulo}`
      );
    }

    return chamadoAtualizado;
  });
};
