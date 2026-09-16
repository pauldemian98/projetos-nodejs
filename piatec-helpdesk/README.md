# Piatec HelpDesk

Bem-vindo ao projeto Piatec HelpDesk. O repositório foi reestruturado e agora contém dois diretórios separados:

- `/backend`: API em Node.js (Express) com Prisma e MySQL.
- `/frontend`: SPA em React 18 (Vite) com Tailwind CSS v4.

---

## 🚀 Passo a Passo para Iniciar o Projeto pelo VS Code

### 1. Preparação Inicial
1. Abra a pasta raiz do projeto (`piatec-helpdesk`) no VS Code.
2. Certifique-se de ter o **Node.js** (v18+) e o **MySQL** instalados na sua máquina.

### 2. Configurando o Backend
1. Abra um terminal no VS Code (`Ctrl` + `'` ou `Terminal > New Terminal`).
2. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
3. Crie o arquivo `.env` a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
   *(No Windows/PowerShell, se o `cp` falhar, você pode usar `Copy-Item .env.example .env` ou apenas duplicar o arquivo manualmente no explorador do VS Code).*
4. Abra o arquivo `backend/.env` recém-criado e preencha as variáveis, principalmente a `DATABASE_URL` com as credenciais do seu MySQL local, bem como sua chave secreta para o `JWT_SECRET`.
5. Execute as migrações do Prisma para criar as tabelas no seu banco de dados:
   ```bash
   npx prisma migrate dev --name init
   ```
6. (Opcional) Popule o banco com os dados iniciais (O usuário Gestor e as Categorias):
   ```bash
   npx ts-node prisma/seed.ts
   ```
7. Inicie o servidor backend em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   *O backend ficará rodando em `http://localhost:3000`.*

### 3. Configurando o Frontend
1. Abra um **segundo** terminal no VS Code (clique no botão `+` no painel do terminal).
2. Navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
3. Crie o arquivo `.env` a partir do exemplo:
   ```bash
   cp .env.example .env
   ```
   *(Ele já vem pré-configurado com a URL da API do backend `VITE_API_URL=http://localhost:3000/api`).*
4. Inicie o servidor de desenvolvimento do frontend:
   ```bash
   npm run dev
   ```
   *O frontend ficará rodando em `http://localhost:5173` (verifique a porta exata no console).*

---

## 💻 Dicas de Uso no VS Code

- **Extensões Recomendadas:** Instale a extensão do **Prisma** (`Prisma.prisma`) e a do **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) para melhorar sua produtividade.
- **Divisão de Terminais:** Mantenha a aba de terminais dividida (Split Terminal) para ver os logs do Backend e do Frontend lado a lado.
- **Login Inicial:** Use as credenciais cadastradas pelo script de seed (`gestor@piatec.com` / `senha_hasheada_generica_para_seed` - *lembre-se de alterar no `seed.ts` para usar uma senha que você saiba descriptografar/autenticar*).
