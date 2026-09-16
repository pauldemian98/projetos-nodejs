import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { deduzirCategoria } from '../utils/categoriaDictionary';
import { criarChamado } from './chamadoService';

export const processarWebhook = async (payload: { texto: string; remetente_email: string; remetente_nome: string; anexos?: string[] }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Achar ou criar solicitante
    let solicitante = await tx.user.findUnique({ where: { email: payload.remetente_email } });
    
    if (!solicitante) {
      const senhaAleatoria = crypto.randomBytes(6).toString('hex');
      const hashSenha = await bcrypt.hash(senhaAleatoria, 10);
      solicitante = await tx.user.create({
        data: {
          nome_completo: payload.remetente_nome || payload.remetente_email,
          email: payload.remetente_email,
          senha: hashSenha,
          data_nascimento: new Date('1900-01-01T00:00:00Z'),
          papel: 'EXTERNO',
          ativo: true,
        }
      });
    }

    // 2. Deduzir Categoria
    const nomeCategoria = deduzirCategoria(payload.texto);
    let categoriaId: string;
    let subcategoriaId: string | null = null;

    if (nomeCategoria) {
      const cat = await tx.categoria.findFirst({ where: { nome: nomeCategoria }, include: { subcategorias: true } });
      if (cat) {
        categoriaId = cat.id;
        subcategoriaId = cat.subcategorias.length > 0 ? cat.subcategorias[0].id : null;
      } else {
        const fallback = await tx.categoria.findFirst({ include: { subcategorias: true } });
        categoriaId = fallback?.id || '';
        subcategoriaId = fallback?.subcategorias?.length ? fallback.subcategorias[0].id : null;
      }
    } else {
      const fallback = await tx.categoria.findFirst({ include: { subcategorias: true } });
      categoriaId = fallback?.id || '';
      subcategoriaId = fallback?.subcategorias?.length ? fallback.subcategorias[0].id : null;
    }

    // 3. Criar Chamado com roteamento
    // Aproveitamos o mesmo método criarChamado que já faz o roteamento dentro do $transaction
    const fakeData = {
      titulo: 'Chamado via Webhook',
      descricao: payload.texto,
      prioridade: 'MEDIA',
      categoriaId,
      subcategoriaId
    };

    const chamado = await criarChamado(fakeData, solicitante.id);

    // 4. Anexos (se o payload.anexos trouxer URLs diretas)
    if (payload.anexos && payload.anexos.length > 0) {
      await tx.anexo.createMany({
        data: payload.anexos.map(url => ({
          chamadoId: chamado.id,
          nome_original: 'anexo-webhook',
          url_arquivo: url
        }))
      });
    }

    return chamado;
  });
};
