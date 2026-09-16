import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      nome_completo: 'Admin',
      email: 'admin@piatec.com',
      senha: hash,
      data_nascimento: new Date(),
      papel: 'GESTOR',
      ativo: true
    }
  });
  console.log('User Admin created!');
}
main().finally(() => prisma.$disconnect());
