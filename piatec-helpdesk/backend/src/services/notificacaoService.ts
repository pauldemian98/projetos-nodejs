import prisma from '../lib/prisma';
import { sendEmail } from '../utils/mailer';

export const notificarNovoChamado = async (chamadoId: string) => {
  const chamado = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    include: {
      solicitante: true,
      solicitanteOriginal: true,
    }
  });
  if (!chamado) return;

  const isAgenteTI = chamado.solicitante?.papel !== 'EXTERNO';

  if (!isAgenteTI) {
    // External user created the ticket, notify all IT agents
    const agentes = await prisma.user.findMany({
      where: {
        papel: { not: 'EXTERNO' },
        ativo: true
      }
    });
    
    const emails = agentes.map(a => a.email).join(', ');
    if (emails) {
      const subject = `Novo chamado criado: #${chamado.codigo || chamado.id}`;
      const text = `O usuário ${chamado.solicitante.nome_completo} criou um novo chamado.\n\nTítulo: ${chamado.titulo}\nDescrição: ${chamado.descricao}`;
      await sendEmail(emails, subject, text);
    }
  } else {
    // IT Agent created the ticket. Notify the original requester.
    if (chamado.solicitanteOriginalId && chamado.solicitanteOriginal) {
      const subject = `Chamado criado em seu nome: #${chamado.codigo || chamado.id}`;
      const text = `Um novo chamado foi aberto em seu nome pelo agente ${chamado.solicitante.nome_completo}.\n\nTítulo: ${chamado.titulo}\nDescrição: ${chamado.descricao}`;
      await sendEmail(chamado.solicitanteOriginal.email, subject, text);
    }
  }
};

export const notificarAtualizacaoChamado = async (chamadoId: string, autorId: string, acaoDescricao: string) => {
  const chamado = await prisma.chamado.findUnique({
    where: { id: chamadoId },
    include: {
      solicitante: true,
      solicitanteOriginal: true,
      responsavel: true,
    }
  });
  if (!chamado) return;

  const autor = await prisma.user.findUnique({ where: { id: autorId } });
  if (!autor) return;

  const isAutorAgenteTI = autor.papel !== 'EXTERNO';

  // Determine who should receive the notification
  const emailsToNotify = new Set<string>();

  if (isAutorAgenteTI) {
    // Agent did something -> notify solicitante / solicitanteOriginal
    if (chamado.solicitante?.papel === 'EXTERNO' && chamado.solicitanteId !== autorId) {
      emailsToNotify.add(chamado.solicitante.email);
    }
    if (chamado.solicitanteOriginalId && chamado.solicitanteOriginal?.papel === 'EXTERNO' && chamado.solicitanteOriginalId !== autorId) {
      emailsToNotify.add(chamado.solicitanteOriginal.email);
    }
  } else {
    // External user did something -> notify responsavel, or all agents if no responsavel
    if (chamado.responsavelId && chamado.responsavel) {
      emailsToNotify.add(chamado.responsavel.email);
    } else {
      const agentes = await prisma.user.findMany({
        where: { papel: { not: 'EXTERNO' }, ativo: true }
      });
      agentes.forEach(a => emailsToNotify.add(a.email));
    }
  }

  if (emailsToNotify.size > 0) {
    const emailsArray = Array.from(emailsToNotify).join(', ');
    const subject = `Atualização no chamado #${chamado.codigo || chamado.id}`;
    const text = `O chamado #${chamado.codigo || chamado.id} "${chamado.titulo}" foi atualizado por ${autor.nome_completo}.\n\nAção: ${acaoDescricao}`;
    
    await sendEmail(emailsArray, subject, text);
  }
};
