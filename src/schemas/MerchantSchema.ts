// MerchantSchema.ts

import { z } from 'zod';

const optionalString = z.string().optional().or(z.literal(''));

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
    description: optionalString,          // ← era obrigatório
    commercialPhone: z
        .string()
        .min(1, 'Telefone Comercial é obrigatório'),
    whatsappNumber: z
        .string()
        .min(1, 'WhatsApp é obrigatório'),
    contactEmails: z
        .string()
        .min(1, 'Pelo menos um email é obrigatório'),
    averageTicket: z.number().min(0),
    averagePreparationTime: z.number().min(0),
    minOrderValue: z.number().min(0),

    // Endereço
    postalCode: z
        .string()
        .min(1, 'CEP é obrigatório')
        .regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    district: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    complement: optionalString,           // ← já era optional, mas precisava do or('')
    reference: optionalString,            // ← idem

    // Links / redes — todos opcionais
    facebook: optionalString,
    instagram: optionalString,
    urlIfood: optionalString,
    urlGoomer: optionalString,
    url99: optionalString,
    urlUberEats: optionalString,
    urlKeeta: optionalString,
});

export type MerchantFormData = z.infer<typeof merchantSchema>;