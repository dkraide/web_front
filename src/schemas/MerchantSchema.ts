// MerchantSchema.ts

import { z } from 'zod';

// Todos os campos são opcionais: null/undefined/espaços viram '' (ou 0 nos números),
// então o submit nunca recebe null nem texto só com espaço.
const text = z
    .string()
    .nullish()
    .transform((v) => (v ?? '').trim());

const textWithFormat = (regex: RegExp, message: string) =>
    text.refine((v) => v === '' || regex.test(v), message);

const amount = z
    .union([z.number(), z.string()])
    .nullish()
    .transform((v) => {
        const n = Number(v ?? 0);
        return Number.isFinite(n) && n > 0 ? n : 0;
    });

export const merchantSchema = z.object({
    document: textWithFormat(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
    corporateName: text,
    name: text,
    description: text,
    commercialPhone: text,
    whatsappNumber: text,
    contactEmails: text,
    averageTicket: amount,
    averagePreparationTime: amount,
    minOrderValue: amount,

    // Endereço
    postalCode: textWithFormat(/^\d{5}-\d{3}$/, 'CEP inválido'),
    street: text,
    number: text,
    district: text,
    city: text,
    state: text,
    complement: text,
    reference: text,

    // Links / redes
    facebook: text,
    instagram: text,
    urlIfood: text,
    urlGoomer: text,
    url99: text,
    urlUberEats: text,
    urlKeeta: text,
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
