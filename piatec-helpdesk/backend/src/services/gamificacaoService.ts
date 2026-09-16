import prisma from '../lib/prisma';
import { sendEmail } from '../utils/mailer';

export const premiarAgente = async (agenteId: string, gestorId: string, mesReferencia: string, mensagemElogio: string) => {
  const premiacao = await prisma.premiacaoMensal.create({
    data: {
      agenteId,
      gestorId,
      mes_referencia: mesReferencia,
      mensagem_elogio: mensagemElogio
    }
  });

  const agente = await prisma.user.findUnique({ where: { id: agenteId } });
  if (agente) {
    await sendEmail(agente.email, 'Parabéns! Você é o Agente do Mês', mensagemElogio);
  }

  return premiacao;
};
