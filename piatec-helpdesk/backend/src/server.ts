import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[Server] Rodando na porta ${PORT} no ambiente ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Trust Proxy ativo: ${app.get('trust proxy')}`);
});
