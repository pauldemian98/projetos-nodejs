import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer';

export const criarUsuarioExterno = async (data: { nome_completo: string; email: string; data_nascimento: string }) => {
  const userExists = await prisma.user.findUnique({ where: { email: data.email } });
  if (userExists) {
    throw new Error('Usuário já cadastrado com este e-mail');
  }

  const senhaAleatoria = crypto.randomBytes(6).toString('hex'); // Gera senha de 12 caracteres
  const hashSenha = await bcrypt.hash(senhaAleatoria, 10);

  const newUser = await prisma.user.create({
    data: {
      nome_completo: data.nome_completo,
      email: data.email,
      senha: hashSenha,
      data_nascimento: new Date(data.data_nascimento),
      papel: 'EXTERNO',
      ativo: true,
    },
  });

  // Enviar e-mail com as credenciais
  const text = `Olá, ${newUser.nome_completo}. Sua conta foi criada no HelpDesk. Seu usuário: ${newUser.email} | Senha temporária: ${senhaAleatoria}`;
  await sendEmail(newUser.email, 'Bem-vindo ao Piatec HelpDesk', text);

  const { senha, ...userSemSenha } = newUser;
  return userSemSenha;
};
