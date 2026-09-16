import { z } from 'zod';

export const iniciarTrabalhoSchema = z.object({
  body: z.object({
    chamadoId: z.string().uuid().optional(),
    tarefaId: z.string().uuid().optional(),
  }).refine(data => data.chamadoId || data.tarefaId, {
    message: 'É necessário informar chamadoId ou tarefaId',
  }),
});

export const finalizarTrabalhoSchema = z.object({
  body: z.object({
    texto_resolucao: z.string().min(10, { message: 'O texto de resolução é obrigatório e deve ter no mínimo 10 caracteres' }).optional(),
  }),
});
