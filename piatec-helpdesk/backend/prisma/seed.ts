import { PrismaClient } from '@prisma/client';
// Se você for utilizar bcrypt, não se esqueça de instalá-lo: npm install bcrypt @types/bcrypt
// import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seed...');

  // Gerando um hash genérico (substitua pela sua lógica de hash caso utilize bcrypt/argon2)
  // const hashSenha = await bcrypt.hash('senha123', 10);
  const hashSenha = 'senha_hasheada_generica_para_seed';

  // 1. Criar usuário GESTOR
  const gestor = await prisma.user.upsert({
    where: { email: 'gestor@piatec.com' },
    update: {},
    create: {
      nome_completo: 'Gestor Principal',
      email: 'gestor@piatec.com',
      senha: hashSenha,
      data_nascimento: new Date('1980-01-01T00:00:00Z'),
      papel: 'GESTOR',
      ativo: true,
    },
  });
  console.log(`Usuário gestor criado: ${gestor.nome_completo}`);

  // 2. Criar categorias e subcategorias padrão
  // Utilizando o create de subcategorias aninhado dentro da criação da categoria
  const categoriaERP = await prisma.categoria.create({
    data: {
      nome: 'ERP Protheus',
      ativo: true,
      subcategorias: {
        create: [
          { nome: 'Módulo Contábil', ativo: true },
          { nome: 'Módulo Financeiro', ativo: true },
          { nome: 'Módulo Faturamento', ativo: true },
        ],
      },
    },
  });
  console.log(`Categoria criada: ${categoriaERP.nome} com subcategorias`);

  // 3. Criar a configuração de sistema "ORDEM_ESCALONAMENTO"
  const configuracaoEscalonamento = await prisma.configuracaoSistema.upsert({
    where: { chave: 'ORDEM_ESCALONAMENTO' },
    update: {},
    create: {
      chave: 'ORDEM_ESCALONAMENTO',
      valor: ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3', 'ENCARREGADO', 'GESTOR'],
    },
  });
  console.log(`Configuração de sistema criada: ${configuracaoEscalonamento.chave}`);

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
