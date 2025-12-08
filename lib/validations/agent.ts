import { z } from 'zod';

const contactDetailsSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const agentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  contactDetails: contactDetailsSchema,
});

export const brokerSchema = z.object({
  name: z.string().min(1, 'Broker name is required'),
  contactDetails: contactDetailsSchema,
});

export type AgentInput = z.infer<typeof agentSchema>;
export type BrokerInput = z.infer<typeof brokerSchema>;
