import { z } from 'zod';

export const createChamadoSchema = z.object({
  body: z.object({
    titulo: z.string().min(5),
    descricao: z.string().min(10),
    prioridade: z.string(),
    link_reuniao: z.string().url().optional(),
    categoriaId: z.string().uuid(),
    subcategoriaId: z.string().uuid().optional().nullable().or(z.literal('')),
    responsavelId: z.string().uuid().optional().nullable().or(z.literal('')),
    solicitanteOriginalId: z.string().uuid().optional().nullable().or(z.literal('')),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().transform(Number),
    limit: z.string().regex(/^\d+$/).optional().transform(Number),
  }),
});

export const reatribuirSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    novoResponsavelId: z.string().uuid().optional().nullable().or(z.literal('')),
  }),
});
