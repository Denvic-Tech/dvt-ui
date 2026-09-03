import { z } from 'zod';

export const ErrorEnvelopeSchema = z.object({
  name: z.string().default('ERROR'),
  code: z.string().default('UNKNOWN'),
  description: z.string().default('Unexpected error'),
  message: z.string().default('Unexpected error'),
  category: z.string().default('UNKNOWN'),
  detail: z.any().optional(),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
