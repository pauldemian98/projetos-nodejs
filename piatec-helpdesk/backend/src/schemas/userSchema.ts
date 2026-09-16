import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    nome_completo: z.string().min(3),
    email: z.string().email(),
    data_nascimento: z.string().datetime(), // Espera ISO-8601
  }),
});
