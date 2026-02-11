import { z } from 'zod';

export const merchantSchema = z.object({
    document: z
        .string()
        .min(1, 'CNPJ é obrigatório')
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
    corporateName: z
        .string()
        .min(1, 'Razão social é obrigatória'),
    name: z
        .string()
        .min(1, 'Nome Fantasia é obrigatório'),
    description: z
        .string()
        .min(1, 'Descrição  é obrigatório'),
    commercialPhone: z
        .string()
        .min(1, 'Telefone Comercial  é obrigatório'),
    whatsappNumber: z
        .string()
        .min(1, 'WhatsApp  é obrigatório'),
    contactEmails: z
        .string()
        .min(1, 'Pelo menos um email  é obrigatório'),
    averageTicket: z.number().min(0, 'Ticket médio deve ser maior ou igual a 0'),
    averagePreparationTime: z.number().min(0, 'Tempo médio de preparo deve ser maior ou igual a 0'),
    minOrderValue: z.number().min(0, 'Pedido minimo deve ser maior ou igual a 0'),
    reference: z.string().optional(),
    complement: z.string().optional(),
    postalCode: z
        .string()
        .min(1, 'CEP é obrigatório')
        .regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    district: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    urlIfood: z.string().optional(),
    urlGoomer: z.string().optional(),
    url99: z.string().optional(),
    urlUberEats: z.string().optional(),
    urlKeeta: z.string().optional(),
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
