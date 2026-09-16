import express from 'express';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Proxy Reverso IIS
app.set('trust proxy', true);

// Middlewares Globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos Estáticos (Uploads)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rotas da API
app.use('/api', router);

// Tratamento Global de Erros
app.use(errorHandler);

export default app;
