import prisma from '../lib/prisma';

export const createProjeto = async (data: any) => prisma.projeto.create({ data });
export const createTarefa = async (data: any) => prisma.tarefa.create({ data });

export const atualizarStatusTarefa = async (id: string, status: any) => {
  return await prisma.tarefa.update({ where: { id }, data: { status } });
};

export const concluirProjeto = async (projetoId: string, usuarioId: string, dificuldades_tecnicas: string, comunicacao: string) => {
  return await prisma.avaliacaoProjeto.create({
    data: { projetoId, usuarioId, dificuldades_tecnicas, comunicacao }
  });
};
