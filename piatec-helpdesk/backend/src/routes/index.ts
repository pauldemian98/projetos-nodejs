import { Router } from 'express';
import bcrypt from 'bcrypt';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';
import * as dashboardController from '../controllers/dashboardController';
import * as chamadoController from '../controllers/chamadoController';
import * as trabalhoController from '../controllers/trabalhoController';

import { loginSchema } from '../schemas/authSchema';
import { createUserSchema } from '../schemas/userSchema';
import { createChamadoSchema, paginationSchema } from '../schemas/chamadoSchema';
import { iniciarTrabalhoSchema, finalizarTrabalhoSchema } from '../schemas/trabalhoSchema';

const router = Router();

// Auth
router.post('/auth/login', validate(loginSchema), authController.login);

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Users
router.post('/users', authMiddleware, validate(createUserSchema), userController.criarUsuarioExterno);

import crypto from 'crypto';
import { sendEmail } from '../utils/mailer';

router.post('/admin/users', authMiddleware, async (req, res) => {
  try {
    const { nome_completo, email, papel, ativo, data_nascimento } = req.body;
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'E-mail já cadastrado' });
    }
    
    // Gera senha aleatória de 12 caracteres
    const senhaAleatoria = crypto.randomBytes(6).toString('hex');
    const hashSenha = await bcrypt.hash(senhaAleatoria, 10);

    const newUser = await prisma.user.create({
      data: {
        nome_completo,
        email,
        senha: hashSenha,
        papel: papel || 'EXTERNO',
        ativo: ativo !== undefined ? ativo : true,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : new Date(),
      }
    });

    // Enviar e-mail com as credenciais
    const text = `Olá, ${newUser.nome_completo}. Sua conta foi criada no Piatec HelpDesk pelo administrador.\n\nSeu usuário: ${newUser.email}\nSenha temporária: ${senhaAleatoria}\n\nPor favor, acesse o sistema e altere sua senha assim que possível.`;
    await sendEmail(newUser.email, 'Bem-vindo ao Piatec HelpDesk - Credenciais de Acesso', text);

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
  }
});

router.get('/users', authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, nome_completo: true, email: true, papel: true, ativo: true }});
  res.json({ data: users });
});
router.get('/users/:id/perfil', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { 
      id: true, 
      nome_completo: true, 
      email: true, 
      papel: true,
      avaliacoesRecebidas: { 
        include: { chamado: { select: { titulo: true, status: true } }, agente: { select: { nome_completo: true } } },
        orderBy: { createdAt: 'desc' }
      },
      chamadosSolicitados: {
        where: { solicitanteOriginalId: null },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { responsavel: { select: { nome_completo: true } } }
      },
      chamadosSolicitadosOriginal: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { responsavel: { select: { nome_completo: true } } }
      }
    }
  });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ data: user });
});

router.get('/users/:id', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ 
    where: { id: req.params.id },
    select: { id: true, nome_completo: true, email: true, papel: true, ativo: true }
  });
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ data: user });
});
router.put('/users/:id', authMiddleware, async (req, res) => {
  const { nome_completo, email, senha, ativo, papel } = req.body;
  const updateData: any = {};
  if (nome_completo !== undefined) updateData.nome_completo = nome_completo;
  if (email !== undefined) updateData.email = email;
  if (ativo !== undefined) updateData.ativo = ativo;
  if (papel !== undefined) updateData.papel = papel;
  
  if (senha) {
    updateData.senha = await bcrypt.hash(senha, 10);
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao atualizar usuário' });
  }
});

// Categorias
router.get('/categorias', authMiddleware, async (req, res) => {
  const categorias = await prisma.categoria.findMany({ include: { subcategorias: { include: { responsavel: { select: { id: true, nome_completo: true } } } } } });
  res.json({ data: categorias });
});
router.post('/categorias', authMiddleware, async (req, res) => {
  const { nome, prefixo, cor } = req.body;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];
  const corEscolhida = cor || colors[Math.floor(Math.random() * colors.length)];
  const cleanPrefixo = prefixo ? prefixo.trim().toUpperCase() : null;
  const categoria = await prisma.categoria.create({
    data: {
      nome: nome.trim(),
      prefixo: cleanPrefixo,
      ativo: true,
      cor: corEscolhida
    }
  });
  res.json({ data: categoria });
});

router.put('/categorias/:id', authMiddleware, async (req, res) => {
  const { nome, prefixo, cor, ativo } = req.body;
  const updateData: any = {};
  if (nome !== undefined) updateData.nome = nome.trim();
  if (prefixo !== undefined) updateData.prefixo = prefixo ? prefixo.trim().toUpperCase() : null;
  if (cor !== undefined) updateData.cor = cor;
  if (ativo !== undefined) updateData.ativo = ativo;

  const categoria = await prisma.categoria.update({
    where: { id: req.params.id },
    data: updateData
  });
  res.json({ data: categoria });
});

router.delete('/categorias/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.categoria.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: 'Não é possível excluir categorias que possuem chamados vinculados.' });
  }
});
router.post('/categorias/:id/subcategorias', authMiddleware, async (req, res) => {
  const { nome, responsavelId, prefixo } = req.body;
  const sub = await prisma.subcategoria.create({
    data: {
      nome,
      categoriaId: req.params.id,
      responsavelId: responsavelId || null,
      prefixo: prefixo || null
    }
  });
  res.json({ data: sub });
});
router.delete('/subcategorias/:id', authMiddleware, async (req, res) => {
  await prisma.subcategoria.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});
router.put('/subcategorias/:id', authMiddleware, async (req, res) => {
  const { nome, responsavelId, prefixo } = req.body;
  const sub = await prisma.subcategoria.update({
    where: { id: req.params.id },
    data: {
      nome,
      responsavelId: responsavelId || null,
      prefixo: prefixo || null
    }
  });
  res.json({ data: sub });
});

// Configurações
router.get('/config/escalonamento', authMiddleware, async (req, res) => {
  let config = await prisma.configuracaoSistema.findUnique({ where: { chave: 'ORDEM_ESCALONAMENTO' } });
  if (!config) {
    config = await prisma.configuracaoSistema.create({
      data: {
        chave: 'ORDEM_ESCALONAMENTO',
        valor: ["ESTAGIARIO", "ASSISTENTE_1", "ASSISTENTE_2", "GESTOR"]
      }
    });
  }
  res.json({ data: config.valor });
});
router.put('/config/escalonamento', authMiddleware, async (req, res) => {
  const { ordem } = req.body;
  const config = await prisma.configuracaoSistema.upsert({
    where: { chave: 'ORDEM_ESCALONAMENTO' },
    update: { valor: ordem },
    create: { chave: 'ORDEM_ESCALONAMENTO', valor: ordem }
  });
  res.json({ data: config.valor });
});

// Chamados
router.get('/chamados', authMiddleware, validate(paginationSchema), chamadoController.listarChamados);
router.get('/chamados/:id', authMiddleware, chamadoController.obterChamado);
router.post('/chamados', authMiddleware, uploadMiddleware.array('anexos'), validate(createChamadoSchema), chamadoController.criarChamado);
router.post('/chamados/:id/escalonar', authMiddleware, chamadoController.escalonarChamado);
router.post('/chamados/:id/comentarios', authMiddleware, chamadoController.adicionarComentario);
router.put('/chamados/:id/status', authMiddleware, chamadoController.atualizarStatus);
router.post('/chamados/:id/avaliar-solicitante', authMiddleware, chamadoController.avaliarSolicitante);
router.post('/chamados/:id/avaliar-chamado', authMiddleware, chamadoController.avaliarChamado);
router.put('/chamados/:id/prioridade', authMiddleware, chamadoController.atualizarPrioridade);
router.put('/chamados/:id/solicitante-original', authMiddleware, chamadoController.atualizarSolicitanteOriginal);
router.put('/chamados/:id/responsavel', authMiddleware, chamadoController.atribuirResponsavel);
router.post('/chamados/:id/anexos', authMiddleware, uploadMiddleware.array('anexos'), chamadoController.adicionarAnexo);

// Trabalho (Timer)
router.get('/trabalho/ativo', authMiddleware, trabalhoController.obterAtivo);
router.post('/trabalho/iniciar', authMiddleware, validate(iniciarTrabalhoSchema), trabalhoController.iniciar);
router.post('/trabalho/pausar-ou-finalizar', authMiddleware, validate(finalizarTrabalhoSchema), trabalhoController.pausarOuFinalizar);

router.get('/dashboard/agentes-avaliacao', authMiddleware, dashboardController.getAgentesAvaliacao);

export default router;
