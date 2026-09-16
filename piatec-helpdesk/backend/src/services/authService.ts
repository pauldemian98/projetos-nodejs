import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export const login = async (email: string, senhaLimpa: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.ativo) {
    throw new Error('Credenciais inválidas ou usuário inativo');
  }

  const valid = await bcrypt.compare(senhaLimpa, user.senha);
  if (!valid) {
    throw new Error('Credenciais inválidas');
  }

  const token = jwt.sign({ id: user.id, papel: user.papel }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  const { senha, ...userSemSenha } = user;
  return { token, user: userSemSenha };
};
