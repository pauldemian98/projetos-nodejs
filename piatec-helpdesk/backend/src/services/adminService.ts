import prisma from '../lib/prisma';

// Usuários
export const toggleUserStatus = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('Usuário não encontrado');
  return await prisma.user.update({
    where: { id },
    data: { ativo: !user.ativo },
  });
};

// Categorias
export const createCategoria = async (nome: string) => {
  return await prisma.categoria.create({ data: { nome, ativo: true } });
};
export const updateCategoria = async (id: string, nome: string) => {
  return await prisma.categoria.update({ where: { id }, data: { nome } });
};
export const softDeleteCategoria = async (id: string) => {
  return await prisma.categoria.update({ where: { id }, data: { ativo: false } });
};

// Configurações
export const getConfiguracao = async (chave: string) => {
  return await prisma.configuracaoSistema.findUnique({ where: { chave } });
};
export const updateConfiguracao = async (chave: string, valor: any) => {
  return await prisma.configuracaoSistema.upsert({
    where: { chave },
    update: { valor },
    create: { chave, valor },
  });
};
